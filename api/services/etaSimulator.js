import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://epsvzkvtnetjdgkovakk.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwc3Z6a3Z0bmV0amRna292YWtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwMjI0ODgsImV4cCI6MjEwMDU5ODQ4OH0.WqYUhfjPKCS-t114gAk8XVuoU9dwf2yS10G_OgFSMvo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Trajetos reais aproximados das linhas principais na Serra
const ROUTE_PATHS = {
  '501': [
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' },
    { lat: -20.1907, lng: -40.2631, name: 'Shopping Montserrat' },
    { lat: -20.2195, lng: -40.2464, name: 'Carone Mall' },
    { lat: -20.2347, lng: -40.2578, name: 'T. Carapina' }
  ],
  '507': [
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' },
    { lat: -20.1907, lng: -40.2631, name: 'Shopping Montserrat' },
    { lat: -20.2012, lng: -40.2558, name: 'IFES / UVV' },
    { lat: -20.2347, lng: -40.2578, name: 'T. Carapina' }
  ],
  '523': [
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' },
    { lat: -20.2195, lng: -40.2464, name: 'Carone Mall' },
    { lat: -20.1944, lng: -40.2429, name: 'Hosp. Dório Silva' },
    { lat: -20.1371, lng: -40.1949, name: 'T. Jacaraípe' }
  ],
  '803': [
    { lat: -20.2347, lng: -40.2578, name: 'T. Carapina' },
    { lat: -20.2012, lng: -40.2558, name: 'IFES / UVV' },
    { lat: -20.1371, lng: -40.1949, name: 'T. Jacaraípe' }
  ],
  '840': [
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' },
    { lat: -20.1907, lng: -40.2631, name: 'Shopping Montserrat' },
    { lat: -20.1944, lng: -40.2429, name: 'Hosp. Dório Silva' }
  ],
  '860': [
    { lat: -20.1371, lng: -40.1949, name: 'T. Jacaraípe' },
    { lat: -20.1944, lng: -40.2429, name: 'Hosp. Dório Silva' },
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' }
  ],
  '875': [
    { lat: -20.1371, lng: -40.1949, name: 'T. Jacaraípe' },
    { lat: -20.2195, lng: -40.2464, name: 'Carone Mall' },
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' }
  ],
  '591': [
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' },
    { lat: -20.2347, lng: -40.2578, name: 'T. Carapina' },
    { lat: -20.2382, lng: -40.2735, name: 'T. Campo Grande' }
  ],
  '880': [
    { lat: -20.1266, lng: -40.3081, name: 'Serra Sede' },
    { lat: -20.2108, lng: -40.2573, name: 'T. Laranjeiras' },
    { lat: -20.2347, lng: -40.2578, name: 'T. Carapina' }
  ],
  '806': [
    { lat: -20.2347, lng: -40.2578, name: 'T. Carapina' },
    { lat: -20.2800, lng: -40.3000, name: 'Vitória' }
  ]
};

// Distância em km entre dois pontos lat/lng
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

let tickCounter = 0;

export async function updateRealTimeTransitData() {
  tickCounter++;
  try {
    const { data: stopRoutes } = await supabase.from('stop_routes').select('stop_id, route_id, direction, bus_stops(latitude, longitude)');
    if (!stopRoutes || stopRoutes.length === 0) return;

    const vehiclesToUpsert = [];
    const arrivalsToUpsert = [];

    const routesList = Object.keys(ROUTE_PATHS);

    for (const routeId of routesList) {
      const path = ROUTE_PATHS[routeId];
      if (!path || path.length < 2) continue;

      // Simula movimento progressivo do ônibus ao longo da rota
      const progress = ((tickCounter * 0.08) + (parseInt(routeId) % 5) * 0.2) % 1;
      const totalSegs = path.length - 1;
      const segIndex = Math.floor(progress * totalSegs);
      const segProgress = (progress * totalSegs) - segIndex;

      const p1 = path[segIndex];
      const p2 = path[Math.min(segIndex + 1, totalSegs)];

      const currentLat = p1.lat + (p2.lat - p1.lat) * segProgress;
      const currentLng = p1.lng + (p2.lng - p1.lng) * segProgress;
      const vehicleId = `V-${routeId}-SERRA`;
      const speedKmh = 35 + (tickCounter % 15);

      vehiclesToUpsert.push({
        vehicle_id: vehicleId,
        route_id: routeId,
        latitude: parseFloat(currentLat.toFixed(6)),
        longitude: parseFloat(currentLng.toFixed(6)),
        speed_kmh: speedKmh,
        bearing: 180,
        direction: p2.name,
        updated_at: new Date().toISOString()
      });

      // Calcula a previsão de chegada (ETA) para cada parada onde a linha passa
      const paradasLinha = stopRoutes.filter(sr => sr.route_id === routeId);
      for (const sr of paradasLinha) {
        if (!sr.bus_stops) continue;
        const distKm = haversineDistance(currentLat, currentLng, sr.bus_stops.latitude, sr.bus_stops.longitude);
        // Velocidade média de 25 km/h no trânsito urbano
        const etaMinutes = Math.max(1, Math.round((distKm / 25) * 60));
        const status = etaMinutes <= 3 ? 'chegando' : (etaMinutes > 15 ? 'atrasado' : 'on_time');

        arrivalsToUpsert.push({
          stop_id: sr.stop_id,
          route_id: routeId,
          vehicle_id: vehicleId,
          eta_minutes: etaMinutes,
          distance_km: parseFloat(distKm.toFixed(1)),
          status: status,
          active: true,
          updated_at: new Date().toISOString()
        });
      }
    }

    // Upsert posições de veículos no Supabase
    if (vehiclesToUpsert.length > 0) {
      await supabase.from('vehicle_positions').upsert(vehiclesToUpsert, { onConflict: 'vehicle_id' });
    }

    // Upsert previsões de chegada no Supabase
    if (arrivalsToUpsert.length > 0) {
      await supabase.from('arrivals').upsert(arrivalsToUpsert, { onConflict: 'stop_id,route_id' });
    }

  } catch (err) {
    console.warn('[ETA-SIMULATOR] Aviso ao atualizar dados de trânsito:', err.message);
  }
}

export function startETASimulator(intervalMs = 8000) {
  console.log('⚡ Motor de Trânsito em Tempo Real (GPS & ETAs da Serra) iniciado!');
  updateRealTimeTransitData();
  setInterval(updateRealTimeTransitData, intervalMs);
}
