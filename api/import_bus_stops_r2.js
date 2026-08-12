/**
 * SEGUNDA RODADA — Quadrantes NW e SW de Serra que falharam
 * Sub-divide em áreas menores e usa mail.ru que funcionou
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://epsvzkvtnetjdgkovakk.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo'
);

const MIRROR = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';

// Sub-quadrantes menores para NW e SW
const SUBS = [
  // NW (Sede/Carapina) dividido em 4
  { name: 'NW-1 (Serra Sede)',     bbox: '-20.14,-40.37,-20.06,-40.30' },
  { name: 'NW-2 (Carapina Norte)', bbox: '-20.14,-40.30,-20.06,-40.24' },
  { name: 'NW-3 (Planalto)',       bbox: '-20.17,-40.37,-20.14,-40.30' },
  { name: 'NW-4 (Carapina Sul)',   bbox: '-20.17,-40.30,-20.14,-40.24' },
  // SW (CIVIT/Laranjeiras) dividido em 4
  { name: 'SW-1 (Laranjeiras N)',  bbox: '-20.21,-40.37,-20.17,-40.30' },
  { name: 'SW-2 (Laranjeiras E)',  bbox: '-20.21,-40.30,-20.17,-40.24' },
  { name: 'SW-3 (Colina/Montserrat)', bbox: '-20.25,-40.37,-20.21,-40.30' },
  { name: 'SW-4 (CIVIT)',          bbox: '-20.25,-40.30,-20.21,-40.24' },
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('🔄 SEGUNDA RODADA — Sub-quadrantes NW e SW de Serra');
  console.log('═'.repeat(55) + '\n');

  let allElements = [];

  for (let i = 0; i < SUBS.length; i++) {
    const q = SUBS[i];
    process.stdout.write(`   [${i+1}/${SUBS.length}] ${q.name.padEnd(25)} `);
    
    const query = `[out:json][timeout:25];(node["highway"="bus_stop"](${q.bbox});node["public_transport"="platform"](${q.bbox}););out body;`;
    
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
        console.log(`→ ${els.length} pontos ✅`);
        allElements.push(...els);
      } else {
        console.log(`→ HTTP ${res.status} ❌`);
      }
    } catch (err) {
      console.log(`→ ${err.message?.substring(0,40)} ❌`);
    }
    
    await sleep(5000);
  }

  const uniqueMap = new Map();
  allElements.forEach(el => uniqueMap.set(el.id, el));
  const unique = Array.from(uniqueMap.values());
  console.log(`\n📊 ${unique.length} pontos únicos nos quadrantes NW+SW\n`);

  if (unique.length === 0) { console.log('❌ Sem dados.'); return; }

  const records = unique.map(el => ({
    code: el.tags?.ref ? `GTFS-${el.tags.ref}` : `OSM-${el.id}`,
    name: (el.tags?.name || el.tags?.description || 'Ponto de Ônibus').substring(0, 200),
    address: `${el.tags?.['addr:street'] || ''}${el.tags?.['addr:suburb'] ? ', ' + el.tags['addr:suburb'] : ''}, Serra - ES`.substring(0, 300),
    latitude: el.lat,
    longitude: el.lon,
    city: 'Serra',
    bairro: el.tags?.['addr:suburb'] || el.tags?.['addr:neighbourhood'] || null,
    source: 'osm_overpass_r2',
    active: true
  }));

  const BATCH = 200;
  let ok = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    process.stdout.write(`   💾 Lote ${Math.floor(i/BATCH)+1}/${Math.ceil(records.length/BATCH)} (${batch.length})... `);
    const { error } = await supabase.from('bus_stops').upsert(batch, { onConflict: 'code', ignoreDuplicates: false });
    if (error) console.log(`❌ ${error.message}`);
    else { console.log('✅'); ok += batch.length; }
  }

  const { count } = await supabase.from('bus_stops').select('*', { count: 'exact', head: true }).eq('city', 'Serra');
  console.log(`\n🎉 ${ok} pontos salvos! Total Serra no banco: ${count || '?'}`);
}

main();
