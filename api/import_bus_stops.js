/**
 * IMPORTADOR COMPLETO — Todos os 544+ pontos de ônibus com abrigo em SERRA (ES)
 * Usa servidores espelho da Overpass API para evitar rate-limit
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://epsvzkvtnetjdgkovakk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo'
);

// Servidores espelho da Overpass API
const MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

// Serra (ES) - bounding box completa do município
// Norte: Fundão border (~-20.06), Sul: Vitória border (~-20.24), Oeste: (~-40.36), Leste: oceano (~-40.14)
const SERRA_BBOX = '-20.25,-40.37,-20.06,-40.14';

// Subdivide em 4 quadrantes para não sobrecarregar
const QUADRANTS = [
  { name: 'Serra NW (Sede/Carapina)',     bbox: '-20.17,-40.37,-20.06,-40.24' },
  { name: 'Serra NE (Jacaraípe/Almeida)', bbox: '-20.17,-40.24,-20.06,-40.14' },
  { name: 'Serra SW (CIVIT/Laranjeiras)',  bbox: '-20.25,-40.37,-20.17,-40.24' },
  { name: 'Serra SE (Barcelona/Manguinhos)', bbox: '-20.25,-40.24,-20.17,-40.14' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function tryFetch(query, mirrorIdx = 0, maxRetries = MIRRORS.length) {
  for (let i = 0; i < maxRetries; i++) {
    const mirror = MIRRORS[(mirrorIdx + i) % MIRRORS.length];
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(30000)
      });
      
      if (res.ok) {
        const data = await res.json();
        return { data, mirror: mirror.split('/')[2] };
      }
      
      console.log(`      ⚠️ ${mirror.split('/')[2]} → HTTP ${res.status}`);
    } catch (err) {
      console.log(`      ⚠️ ${mirror.split('/')[2]} → ${err.message?.substring(0, 50)}`);
    }
    await sleep(2000);
  }
  return null;
}

async function main() {
  console.log('🚏 IMPORTAÇÃO COMPLETA — TODOS OS ABRIGOS DE SERRA (ES)');
  console.log('═'.repeat(58));
  console.log('Meta: ~544 pontos com abrigo instalado');
  console.log('Fonte: OpenStreetMap (múltiplos espelhos Overpass)');
  console.log('Destino: Supabase → bus_stops\n');

  let allElements = [];

  for (let i = 0; i < QUADRANTS.length; i++) {
    const q = QUADRANTS[i];
    console.log(`   [${i+1}/${QUADRANTS.length}] 📍 ${q.name}`);
    
    // Busca TODOS os tipos de pontos de transporte público
    const query = `[out:json][timeout:60];(
      node["highway"="bus_stop"](${q.bbox});
      node["public_transport"="platform"](${q.bbox});
      node["public_transport"="stop_position"](${q.bbox});
      node["amenity"="bus_station"](${q.bbox});
      node["amenity"="shelter"]["shelter_type"="public_transport"](${q.bbox});
    );out body;`;
    
    const result = await tryFetch(query, i);
    
    if (result && result.data.elements) {
      console.log(`      ✅ ${result.data.elements.length} pontos via ${result.mirror}`);
      allElements.push(...result.data.elements);
    } else {
      console.log(`      ❌ Nenhum espelho respondeu para este quadrante`);
    }
    
    await sleep(3000);
  }

  // Deduplicação por ID do OSM
  const uniqueMap = new Map();
  allElements.forEach(el => uniqueMap.set(el.id, el));
  const unique = Array.from(uniqueMap.values());

  console.log(`\n📊 ${unique.length} pontos únicos encontrados via Overpass\n`);

  if (unique.length > 0) {
    const records = unique.map(el => {
      const name = el.tags?.name || el.tags?.description || el.tags?.ref_name || 'Ponto de Ônibus';
      const ref = el.tags?.ref || '';
      const bairro = el.tags?.['addr:suburb'] || el.tags?.['addr:neighbourhood'] || el.tags?.['addr:district'] || '';
      const street = el.tags?.['addr:street'] || '';
      const shelter = el.tags?.shelter === 'yes' || el.tags?.covered === 'yes';
      
      let address = street ? street : '';
      if (bairro) address += address ? `, ${bairro}` : bairro;
      address += ', Serra - ES';
      
      return {
        code: ref ? `GTFS-${ref}` : `OSM-${el.id}`,
        name: name.substring(0, 200),
        address: address.substring(0, 300),
        latitude: el.lat,
        longitude: el.lon,
        city: 'Serra',
        bairro: bairro || null,
        source: 'osm_overpass_full',
        active: true
      };
    });

    await upsertRecords(records);
  } else {
    console.log('⚠️ Nenhum dado obtido dos espelhos. Verifique sua conexão.\n');
  }
}

async function upsertRecords(records) {
  const BATCH = 200;
  let ok = 0;

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(records.length / BATCH);
    
    process.stdout.write(`   💾 Lote ${batchNum}/${totalBatches} (${batch.length})... `);
    
    const { error } = await supabase
      .from('bus_stops')
      .upsert(batch, { onConflict: 'code', ignoreDuplicates: false });

    if (error) console.log(`❌ ${error.message}`);
    else { console.log('✅'); ok += batch.length; }
  }

  // Conta total no banco
  const { count } = await supabase.from('bus_stops').select('*', { count: 'exact', head: true }).eq('city', 'Serra');

  console.log(`\n${'═'.repeat(58)}`);
  console.log(`🎉 IMPORTAÇÃO CONCLUÍDA!`);
  console.log(`   ✅ ${ok} pontos salvos/atualizados agora`);
  console.log(`   📊 Total no banco (Serra): ${count || '?'} pontos`);
  console.log(`\n💡 Acesse http://localhost:8080 → Mapa Operacional`);
}

main();
