/**
 * Script para importar pontos perdidos especificamente de LARANJEIRAS
 * Subdividido em blocos minúsculos para não dar timeout
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://epsvzkvtnetjdgkovakk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo'
);

// Laranjeiras Pq Res dividido em 4 mini blocos
const BBOXES = [
  { name: 'Laranjeiras Q1 (Noroeste)', bbox: '-20.205,-40.265,-20.190,-40.250' },
  { name: 'Laranjeiras Q2 (Nordeste)', bbox: '-20.205,-40.250,-20.190,-40.235' },
  { name: 'Laranjeiras Q3 (Sudoeste)', bbox: '-20.220,-40.265,-20.205,-40.250' },
  { name: 'Laranjeiras Q4 (Sudeste)',  bbox: '-20.220,-40.250,-20.205,-40.235' }
];

const MIRROR = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔍 BUSCANDO PONTOS FALTANTES: LARANJEIRAS (MINI-BLOCOS)');
  console.log('═'.repeat(70));

  let allElements = [];

  for (let i = 0; i < BBOXES.length; i++) {
    const q = BBOXES[i];
    process.stdout.write(`   📍 Buscando em ${q.name.padEnd(35)} `);
    
    const query = `[out:json][timeout:25];(
      node["highway"="bus_stop"](${q.bbox});
      node["public_transport"="platform"](${q.bbox});
    );out body;`;
    
    try {
      const res = await fetch(MIRROR, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
        signal: AbortSignal.timeout(25000)
      });
      
      if (res.ok) {
        const data = await res.json();
        const els = data.elements || [];
        console.log(`→ ${els.length} pontos encontrados ✅`);
        allElements.push(...els);
      } else {
        console.log(`→ HTTP ${res.status} ❌`);
      }
    } catch (err) {
      console.log(`→ ${err.message?.substring(0,40)} ❌`);
    }
    
    await sleep(3000);
  }

  const uniqueMap = new Map();
  allElements.forEach(el => uniqueMap.set(el.id, el));
  const unique = Array.from(uniqueMap.values());
  
  console.log(`\n📊 ${unique.length} pontos únicos encontrados em Laranjeiras.\n`);

  if (unique.length === 0) {
    console.log('❌ Não foi possível carregar os dados via API.');
    return;
  }

  const records = unique.map(el => {
    const name = el.tags?.name || el.tags?.description || 'Ponto de Ônibus';
    const ref = el.tags?.ref || '';
    const bairro = el.tags?.['addr:suburb'] || el.tags?.['addr:neighbourhood'] || 'Parque Residencial Laranjeiras';
    const street = el.tags?.['addr:street'] || '';
    
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
      bairro: bairro,
      source: 'osm_overpass_laranjeiras',
      active: true
    };
  });

  const BATCH = 100;
  let ok = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    process.stdout.write(`   💾 Salvando lote ${Math.floor(i/BATCH)+1}/${Math.ceil(records.length/BATCH)} (${batch.length} pontos)... `);
    const { error } = await supabase.from('bus_stops').upsert(batch, { onConflict: 'code', ignoreDuplicates: true });
    if (error) console.log(`❌ Erro: ${error.message}`);
    else { console.log('✅ OK'); ok += batch.length; }
  }

  console.log(`\n🎉 ${ok} pontos salvos com sucesso!`);
}

main();
