import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import {
  getTotemTransitData,
  getStationTransitData,
  getGlobalVehicles,
  pairTotem,
  syncTotem,
  syncStation
} from './controllers/transitController.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ── Health ──────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: process.env.TRANSIT_DATA_MODE || 'real', timestamp: new Date() });
});

// ── Legado / MDM ─────────────────────────────────────────────
app.post('/api/v1/transport/totem/pair', pairTotem);
app.get('/api/v1/transport/totem/:totemId/sync', syncTotem);
app.get('/api/v1/transport/totem/:totemId', getTotemTransitData);

// ── Visão Global CCO ─────────────────────────────────────────
app.get('/api/v1/transport/vehicles', getGlobalVehicles);

// ── Novos endpoints de Trânsito (Estação × Linhas) ───────────
app.get('/api/transit/stops/:stopId',       getStationTransitData);
app.get('/api/transit/totems/:totemId',     getTotemTransitData);
app.post('/api/transit/sync-station/:stopId', syncStation);

// ── Também expõe veículos via novo path ──────────────────────
app.get('/api/transit/vehicles', getGlobalVehicles);

app.listen(PORT, () => {
  console.log(`🚀 ITE API Server running on http://localhost:${PORT}`);
  console.log(`📡 Transit Data Mode: ${process.env.TRANSIT_DATA_MODE || 'real'}`);
});
