import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://epsvzkvtnetjdgkovakk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('SUPABASE_URL ou SUPABASE_ANON_KEY ausente no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seed() {
  console.log('🌱 Iniciando seed de dados reais da Serra/ES...');

  // 1. Bus Stops (Pontos de Ônibus & Terminais Reais da Serra)
  const busStops = [
    { code: 'ST-TL01', name: 'Terminal Laranjeiras', address: 'Av. Eldes Scherrer Souza, Laranjeiras, Serra - ES', latitude: -20.2108, longitude: -40.2573, city: 'Serra', active: true },
    { code: 'ST-TJ02', name: 'Terminal Jacaraípe', address: 'Av. Talma Rodrigues Ribeiro, Jacaraípe, Serra - ES', latitude: -20.1371, longitude: -40.1949, city: 'Serra', active: true },
    { code: 'ST-CM03', name: 'Terminal Carapina', address: 'BR-101, Carapina, Serra - ES', latitude: -20.2347, longitude: -40.2578, city: 'Serra', active: true },
    { code: 'ST-TS04', name: 'Terminal Serra Sede', address: 'R. Cassiano Castelo, Serra Sede, Serra - ES', latitude: -20.1266, longitude: -40.3081, city: 'Serra', active: true },
    { code: 'ST-TC05', name: 'Terminal Campo Grande', address: 'BR-262, Campo Grande, Cariacica - ES', latitude: -20.2382, longitude: -40.2735, city: 'Cariacica', active: true },
    { code: 'ST-HDS06', name: 'Hospital Dório Silva', address: 'Av. Eudes Scherrer Souza, Laranjeiras, Serra - ES', latitude: -20.1944, longitude: -40.2429, city: 'Serra', active: true },
    { code: 'ST-SM07', name: 'Shopping Montserrat', address: 'Av. Eldes Scherrer Souza, 2162, Colina de Laranjeiras, Serra - ES', latitude: -20.1907, longitude: -40.2631, city: 'Serra', active: true },
    { code: 'ST-PMS08', name: 'Prefeitura Municipal da Serra', address: 'R. Maestro Antônio Cícero, 111, Caçaroca, Serra - ES', latitude: -20.1266, longitude: -40.3081, city: 'Serra', active: true },
    { code: 'ST-UVV09', name: 'IFES / UVV Serra', address: 'Rod. ES-010, Manguinhos, Serra - ES', latitude: -20.2012, longitude: -40.2558, city: 'Serra', active: true },
    { code: 'ST-CMA10', name: 'Carone Mall Laranjeiras', address: 'Av. Colares Júnior, Laranjeiras, Serra - ES', latitude: -20.2195, longitude: -40.2464, city: 'Serra', active: true }
  ];

  console.log('📍 Inserindo/Atualizando pontos de ônibus (bus_stops)...');
  for (const bs of busStops) {
    const { error } = await supabase.from('bus_stops').upsert(bs, { onConflict: 'code' });
    if (error) console.error(`Erro ao inserir ponto ${bs.code}:`, error.message);
  }

  // 2. Routes (Linhas do Transcol Reais que operam na Serra)
  const routes = [
    { route_id: '501', codigo: '501', nome: 'T. Laranjeiras / T. Carapina via Reta da Penha', route_color: '2D9B5A', active: true },
    { route_id: '507', codigo: '507', nome: 'T. Laranjeiras / T. Ibes via Terceira Ponte', route_color: '3B82F6', active: true },
    { route_id: '523', codigo: '523', nome: 'T. Laranjeiras / T. Jacaraípe via Av. Talma R. Ribeiro', route_color: '8B5CF6', active: true },
    { route_id: '803', codigo: '803', nome: 'T. Carapina / T. Jacaraípe via Manguinhos', route_color: 'F59E0B', active: true },
    { route_id: '840', codigo: '840', nome: 'T. Laranjeiras / Hosp. Dório Silva / Bairro das Laranjeiras', route_color: 'EF4444', active: true },
    { route_id: '860', codigo: '860', nome: 'T. Jacaraípe / T. Laranjeiras via Av. Paulo Pereira Gomes', route_color: '06B6D4', active: true },
    { route_id: '875', codigo: '875', nome: 'T. Jacaraípe / T. Laranjeiras via Av. Talma Rodrigues', route_color: 'EC4899', active: true },
    { route_id: '591', codigo: '591', nome: 'T. Laranjeiras / T. Campo Grande via BR-101', route_color: '14B8A6', active: true },
    { route_id: '880', codigo: '880', nome: 'Serra Sede / T. Carapina via BR-101', route_color: 'A855F7', active: true },
    { route_id: '806', codigo: '806', nome: 'T. Carapina / Vitória via Beira Mar', route_color: 'F97316', active: true }
  ];

  console.log('🚌 Inserindo/Atualizando linhas de ônibus (routes)...');
  for (const r of routes) {
    const { error } = await supabase.from('routes').upsert(r, { onConflict: 'route_id' });
    if (error) console.error(`Erro ao inserir rota ${r.route_id}:`, error.message);
  }

  // 3. Stop Routes (Associação Parada × Linhas)
  const stopRoutes = [
    // T. Laranjeiras (ST-TL01)
    { stop_id: 'ST-TL01', route_id: '501', direction: 'T. Carapina', stop_sequence: 1, active: true },
    { stop_id: 'ST-TL01', route_id: '507', direction: 'Vitória', stop_sequence: 1, active: true },
    { stop_id: 'ST-TL01', route_id: '523', direction: 'T. Jacaraípe', stop_sequence: 1, active: true },
    { stop_id: 'ST-TL01', route_id: '840', direction: 'Hosp. Dório Silva', stop_sequence: 1, active: true },
    { stop_id: 'ST-TL01', route_id: '860', direction: 'T. Jacaraípe', stop_sequence: 1, active: true },
    { stop_id: 'ST-TL01', route_id: '875', direction: 'T. Jacaraípe', stop_sequence: 1, active: true },
    { stop_id: 'ST-TL01', route_id: '591', direction: 'T. Campo Grande', stop_sequence: 1, active: true },

    // T. Jacaraípe (ST-TJ02)
    { stop_id: 'ST-TJ02', route_id: '523', direction: 'T. Laranjeiras', stop_sequence: 10, active: true },
    { stop_id: 'ST-TJ02', route_id: '803', direction: 'T. Carapina', stop_sequence: 1, active: true },
    { stop_id: 'ST-TJ02', route_id: '860', direction: 'T. Laranjeiras', stop_sequence: 1, active: true },
    { stop_id: 'ST-TJ02', route_id: '875', direction: 'T. Laranjeiras', stop_sequence: 1, active: true },

    // T. Carapina (ST-CM03)
    { stop_id: 'ST-CM03', route_id: '501', direction: 'T. Laranjeiras', stop_sequence: 10, active: true },
    { stop_id: 'ST-CM03', route_id: '803', direction: 'T. Jacaraípe', stop_sequence: 10, active: true },
    { stop_id: 'ST-CM03', route_id: '880', direction: 'Serra Sede', stop_sequence: 1, active: true },
    { stop_id: 'ST-CM03', route_id: '806', direction: 'Vitória', stop_sequence: 1, active: true },

    // Shopping Montserrat (ST-SM07)
    { stop_id: 'ST-SM07', route_id: '501', direction: 'T. Carapina', stop_sequence: 3, active: true },
    { stop_id: 'ST-SM07', route_id: '507', direction: 'Vitória', stop_sequence: 3, active: true },
    { stop_id: 'ST-SM07', route_id: '840', direction: 'Hosp. Dório Silva', stop_sequence: 2, active: true },

    // Carone Mall Laranjeiras (ST-CMA10)
    { stop_id: 'ST-CMA10', route_id: '501', direction: 'T. Laranjeiras', stop_sequence: 8, active: true },
    { stop_id: 'ST-CMA10', route_id: '523', direction: 'T. Jacaraípe', stop_sequence: 2, active: true },
    { stop_id: 'ST-CMA10', route_id: '840', direction: 'T. Laranjeiras', stop_sequence: 8, active: true },

    // Hospital Dório Silva (ST-HDS06)
    { stop_id: 'ST-HDS06', route_id: '840', direction: 'T. Laranjeiras', stop_sequence: 5, active: true },
    { stop_id: 'ST-HDS06', route_id: '860', direction: 'T. Jacaraípe', stop_sequence: 4, active: true },

    // Prefeitura da Serra (ST-PMS08)
    { stop_id: 'ST-PMS08', route_id: '880', direction: 'T. Carapina', stop_sequence: 8, active: true },
    { stop_id: 'ST-PMS08', route_id: '523', direction: 'T. Laranjeiras', stop_sequence: 12, active: true }
  ];

  console.log('🔗 Inserindo vínculos parada × linhas (stop_routes)...');
  for (const sr of stopRoutes) {
    const { error } = await supabase.from('stop_routes').upsert(sr, { onConflict: 'stop_id,route_id' });
    if (error) console.error(`Erro ao vincular ${sr.stop_id} com ${sr.route_id}:`, error.message);
  }

  // 4. Vincular Totens existentes a Paradas Primárias (totem_stops)
  const { data: totens } = await supabase.from('totens').select('id, nome');
  if (totens && totens.length > 0) {
    console.log(`📡 Vinculando ${totens.length} totens a paradas primárias...`);
    const stopMapping = {
      1: 'ST-TL01', // Totem Laranjeiras 01 -> Terminal Laranjeiras
      2: 'ST-TJ02', // Totem Terminal Jacaraípe -> Terminal Jacaraípe
      3: 'ST-PMS08', // Totem Prefeitura -> Prefeitura da Serra
      4: 'ST-SM07', // Totem Montserrat -> Shopping Montserrat
      5: 'ST-CM03', // Totem Carapina -> Terminal Carapina
      6: 'ST-HDS06'  // Totem Dório Silva -> Hospital Dório Silva
    };

    for (const t of totens) {
      const targetStop = stopMapping[t.id] || 'ST-TL01';
      const { error } = await supabase.from('totem_stops').upsert({
        totem_id: t.id,
        stop_id: targetStop,
        is_primary: true,
        active: true
      }, { onConflict: 'totem_id,stop_id' });
      if (error) console.error(`Erro ao vincular totem ${t.id} à parada ${targetStop}:`, error.message);

      // Atualiza lat/lng do totem com as coordenadas da parada vinculada
      const stopInfo = busStops.find(b => b.code === targetStop);
      if (stopInfo) {
        await supabase.from('totens').update({
          lat: stopInfo.latitude,
          lng: stopInfo.longitude,
          localizacao: stopInfo.name
        }).eq('id', t.id);
      }
    }
  }

  console.log('✅ Seed finalizado com sucesso!');
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
