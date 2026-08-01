import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getTotemTransitData, getGlobalVehicles, pairTotem, syncTotem } from './controllers/transitController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Endpoint de Pareamento Web (Smart Agent)
app.post('/api/v1/transport/totem/pair', pairTotem);

// Endpoint de Sync em Tempo Real (Painel -> Cliente)
app.get('/api/v1/transport/totem/:totemId/sync', syncTotem);

// Endpoint principal do Intelligent Transit Engine (Totem)
app.get('/api/v1/transport/totem/:totemId', getTotemTransitData);

// Novo Endpoint: Visão Global CCO (Mapa Operacional)
app.get('/api/v1/transport/vehicles', getGlobalVehicles);

app.listen(PORT, () => {
  console.log(`🚀 ITE API Server running on http://localhost:${PORT}`);
});
