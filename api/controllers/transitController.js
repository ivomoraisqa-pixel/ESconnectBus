import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl     = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[TRANSIT] ERRO: SUPABASE_URL ou SUPABASE_ANON_KEY não configurados no .env');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Modo de dados: 'real' (produção) ou 'mock' (desenvolvimento)
const TRANSIT_DATA_MODE = process.env.TRANSIT_DATA_MODE || 'real';
console.log(`[TRANSIT] Modo de dados: ${TRANSIT_DATA_MODE.toUpperCase()}`);

// ============================================================
// MOCK DATA — usado apenas quando TRANSIT_DATA_MODE=mock
// ============================================================
const MOCK_VEHICLES = [
  { vehicle_id: 'V-501-MOCK', route_id: '501', latitude: -20.2120, longitude: -40.2590, speed_kmh: 42, direction: 'Centro' },
  { vehicle_id: 'V-507-MOCK', route_id: '507', latitude: -20.2130, longitude: -40.2570, speed_kmh: 50, direction: 'Vitória' },
  { vehicle_id: 'V-523-MOCK', route_id: '523', latitude: -20.1990, longitude: -40.2460, speed_kmh: 35, direction: 'T. Laranjeiras' }
];
const MOCK_ARRIVALS = [
  { stop_id: 'ST-TL01', route_id: '501', eta_minutes: 4,  distance_km: 1.8, status: 'on_time' },
  { stop_id: 'ST-TL01', route_id: '507', eta_minutes: 9,  distance_km: 3.5, status: 'delayed' },
  { stop_id: 'ST-CM03', route_id: '523', eta_minutes: 3,  distance_km: 0.9, status: 'on_time' }
];

// ============================================================
// getGlobalVehicles — Visão global CCO (Mapa Operacional)
// ============================================================
export const getGlobalVehicles = async (req, res) => {
  console.log('[VEHICLE] Requisição de frota global recebida');

  if (TRANSIT_DATA_MODE === 'mock') {
    return res.json({
      timestamp: new Date().toISOString(),
      mode: 'mock',
      total_active: MOCK_VEHICLES.length,
      vehicles: MOCK_VEHICLES
    });
  }

  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

    const { data: vehicles, error } = await supabase
      .from('vehicle_positions')
      .select('vehicle_id, route_id, latitude, longitude, speed_kmh, bearing, direction, updated_at')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    console.log(`[VEHICLE] ${vehicles?.length || 0} veículos ativos retornados`);
    return res.json({
      timestamp: new Date().toISOString(),
      mode: 'real',
      total_active: vehicles?.length || 0,
      vehicles: vehicles || []
    });
  } catch (err) {
    console.error('[VEHICLE] Erro:', err.message);
    return res.status(500).json({ error: 'Erro ao buscar veículos' });
  }
};

// ============================================================
// getStationTransitData — GET /api/transit/stops/:stopId
// ============================================================
export const getStationTransitData = async (req, res) => {
  const { stopId } = req.params;
  console.log(`[STATION] Requisição para estação: ${stopId}`);

  try {
    if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

    // 1. Busca a estação em bus_stops
    const { data: station, error: stErr } = await supabase
      .from('bus_stops')
      .select('*')
      .eq('code', stopId)
      .eq('active', true)
      .single();

    if (stErr || !station) {
      console.warn(`[STATION] Estação não encontrada: ${stopId}`);
      return res.status(404).json({ error: `Estação '${stopId}' não encontrada` });
    }

    // 2. Busca as linhas vinculadas em stop_routes + routes
    const { data: stopRoutes, error: srErr } = await supabase
      .from('stop_routes')
      .select(`
        route_id, direction, stop_sequence,
        routes ( route_id, codigo, nome, route_color, route_short_name, route_long_name )
      `)
      .eq('stop_id', stopId)
      .eq('active', true);

    if (srErr) throw srErr;

    const routeIds = (stopRoutes || []).map(sr => sr.route_id);
    console.log(`[ROUTE] ${routeIds.length} linhas encontradas para estação ${stopId}: ${routeIds.join(', ')}`);

    // 3. Busca veículos apenas das linhas desta estação
    let vehicles = [];
    if (routeIds.length > 0) {
      const { data: vData, error: vErr } = await supabase
        .from('vehicle_positions')
        .select('*')
        .in('route_id', routeIds);
      if (!vErr) vehicles = vData || [];
    }
    console.log(`[VEHICLE] ${vehicles.length} veículos filtrados para estação ${stopId}`);

    // 4. Busca ETAs apenas para esta estação
    let arrivals = [];
    if (routeIds.length > 0) {
      const { data: aData, error: aErr } = await supabase
        .from('arrivals')
        .select('*')
        .eq('stop_id', stopId)
        .in('route_id', routeIds)
        .eq('active', true)
        .order('eta_minutes', { ascending: true });
      if (!aErr) arrivals = aData || [];
    }
    console.log(`[ETA] ${arrivals.length} previsões de chegada para estação ${stopId}`);

    const lines = (stopRoutes || []).map(sr => {
      const r = sr.routes || {};
      const arrival = arrivals.find(a => a.route_id === sr.route_id);
      return {
        route_id: sr.route_id,
        line:     r.codigo || sr.route_id,
        name:     r.nome || r.route_long_name || '',
        color:    r.route_color || '3B82F6',
        direction: sr.direction || '',
        eta_minutes: arrival?.eta_minutes ?? null,
        distance_km: arrival?.distance_km ?? null,
        status:   arrival?.status || 'no_data'
      };
    });

    return res.json({
      timestamp: new Date().toISOString(),
      mode: TRANSIT_DATA_MODE,
      station: {
        id:        station.code,
        name:      station.name,
        address:   station.address,
        lat:       station.latitude,
        lng:       station.longitude
      },
      total_lines: lines.length,
      lines,
      vehicles,
      arrivals
    });

  } catch (err) {
    console.error(`[STATION] Erro para ${stopId}:`, err.message);
    return res.status(500).json({ error: 'Erro interno ao buscar dados da estação' });
  }
};

// ============================================================
// getTotemTransitData — GET /api/v1/transport/totem/:totemId
//                     & GET /api/transit/totems/:totemId
// Fluxo: totem → totem_stops → bus_stops → stop_routes → routes → vehicle_positions → arrivals
// ============================================================
export const getTotemTransitData = async (req, res) => {
  const { totemId } = req.params;
  console.log(`[TOTEM] Requisição de dados de trânsito para totem: ${totemId}`);

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    // 1. Busca o totem
    const { data: totem, error: tErr } = await supabase
      .from('totens')
      .select('id, nome, localizacao, cidade, lat, lng, status')
      .eq('id', totemId)
      .single();

    if (tErr || !totem) {
      console.warn(`[TOTEM] Totem não encontrado: ${totemId}`);
      return res.status(404).json({ error: 'Totem não encontrado' });
    }

    // 2. Busca a estação vinculada via totem_stops
    const { data: totemStopLink, error: tsErr } = await supabase
      .from('totem_stops')
      .select('stop_id, is_primary')
      .eq('totem_id', totemId)
      .eq('active', true)
      .eq('is_primary', true)
      .single();

    const stopId = totemStopLink?.stop_id || 'ST-TL01';
    console.log(`[STATION] Estação para totem ${totemId}: ${stopId}${!totemStopLink ? ' (fallback padrão)' : ''}`);


    // 3. Busca dados da estação
    const { data: station, error: stErr } = await supabase
      .from('bus_stops')
      .select('*')
      .eq('code', stopId)
      .single();

    if (stErr || !station) {
      console.warn(`[STATION] Estação ${stopId} não encontrada em bus_stops`);
      return res.status(404).json({ error: `Estação '${stopId}' não encontrada em bus_stops` });
    }

    // 4. Busca linhas da estação via stop_routes
    const { data: stopRoutes, error: srErr } = await supabase
      .from('stop_routes')
      .select(`
        route_id, direction, stop_sequence,
        routes ( route_id, codigo, nome, route_color, route_short_name )
      `)
      .eq('stop_id', stopId)
      .eq('active', true);

    if (srErr) throw srErr;

    // FILTRO CRÍTICO — apenas as linhas desta estação
    const authorizedRouteIds = (stopRoutes || []).map(sr => sr.route_id);
    console.log(`[ROUTE] ${authorizedRouteIds.length} linhas autorizadas para estação ${stopId}: ${authorizedRouteIds.join(', ')}`);

    if (authorizedRouteIds.length === 0) {
      return res.json({
        timestamp:   new Date().toISOString(),
        mode:        TRANSIT_DATA_MODE,
        totem_id:    totem.id,
        totem_name:  totem.nome,
        stop: { id: station.code, name: station.name, lat: station.latitude, lng: station.longitude },
        total_lines: 0,
        lines:    [],
        vehicles: [],
        arrivals: [],
        message:  'Nenhuma linha cadastrada para esta estação.'
      });
    }

    // 5. Veículos — filtrados apenas pelas linhas autorizadas da estação
    let vehicles = [];
    if (TRANSIT_DATA_MODE === 'mock') {
      vehicles = MOCK_VEHICLES.filter(v => authorizedRouteIds.includes(v.route_id));
    } else {
      const { data: vData, error: vErr } = await supabase
        .from('vehicle_positions')
        .select('vehicle_id, route_id, latitude, longitude, speed_kmh, bearing, direction, updated_at')
        .in('route_id', authorizedRouteIds);
      if (!vErr) vehicles = vData || [];
    }
    console.log(`[VEHICLE] ${vehicles.length} veículos filtrados para totem ${totemId}`);

    // 6. Estimativas de chegada — apenas desta estação × linhas autorizadas
    let arrivals = [];
    if (TRANSIT_DATA_MODE === 'mock') {
      arrivals = MOCK_ARRIVALS.filter(a => a.stop_id === stopId && authorizedRouteIds.includes(a.route_id));
    } else {
      const { data: aData, error: aErr } = await supabase
        .from('arrivals')
        .select('stop_id, route_id, vehicle_id, eta_minutes, distance_km, status, updated_at')
        .eq('stop_id', stopId)
        .in('route_id', authorizedRouteIds)
        .eq('active', true)
        .order('eta_minutes', { ascending: true });
      if (!aErr) arrivals = aData || [];
    }
    console.log(`[ETA] ${arrivals.length} previsões de chegada para totem ${totemId}`);

    // 7. Monta a lista de linhas enriquecida com ETA
    const lines = (stopRoutes || []).map(sr => {
      const r = sr.routes || {};
      const arrival = arrivals.find(a => a.route_id === sr.route_id);
      return {
        route_id:    sr.route_id,
        line:        r.codigo || r.route_short_name || sr.route_id,
        name:        r.nome || '',
        color:       r.route_color || '3B82F6',
        direction:   sr.direction || '',
        eta_minutes: arrival?.eta_minutes ?? null,
        distance_km: arrival?.distance_km ?? null,
        status:      arrival?.status || 'no_data',
        vehicle_id:  arrival?.vehicle_id || null
      };
    }).sort((a, b) => {
      // Ordena: com ETA primeiro (menor primeiro), sem ETA por último
      if (a.eta_minutes === null && b.eta_minutes === null) return 0;
      if (a.eta_minutes === null) return 1;
      if (b.eta_minutes === null) return -1;
      return a.eta_minutes - b.eta_minutes;
    });

    console.log(`[TOTEM] Payload montado para totem ${totemId} com ${lines.length} linhas e ${vehicles.length} veículos`);

    return res.json({
      timestamp:   new Date().toISOString(),
      mode:        TRANSIT_DATA_MODE,
      totem_id:    totem.id,
      totem_name:  totem.nome,
      stop: {
        id:       station.code,
        name:     station.name,
        address:  station.address,
        lat:      station.latitude,
        lng:      station.longitude
      },
      total_lines: lines.length,
      lines,
      vehicles,
      arrivals
    });

  } catch (err) {
    console.error(`[TOTEM] Erro para totem ${totemId}:`, err.message);
    return res.status(500).json({ error: 'Erro interno ao buscar dados do totem' });
  }
};

// ============================================================
// syncStation — POST /api/transit/sync-station/:stopId
// ============================================================
export const syncStation = async (req, res) => {
  const { stopId } = req.params;
  console.log(`[STATION] Sincronização solicitada para estação: ${stopId}`);

  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

  try {
    // 1. Valida a estação
    const { data: station, error: stErr } = await supabase
      .from('bus_stops')
      .select('*')
      .eq('code', stopId)
      .single();

    if (stErr || !station) {
      return res.status(404).json({ success: false, error: `Estação '${stopId}' não encontrada` });
    }
    console.log(`[STATION] Validando: ${station.name}`);

    // 2. Busca relações em stop_routes
    const { data: stopRoutes, error: srErr } = await supabase
      .from('stop_routes')
      .select('route_id, direction, routes(codigo, nome)')
      .eq('stop_id', stopId)
      .eq('active', true);

    if (srErr) throw srErr;

    const lines = (stopRoutes || []).map(sr => ({
      route_id:  sr.route_id,
      line:      sr.routes?.codigo || sr.route_id,
      nome:      sr.routes?.nome || '',
      direction: sr.direction || ''
    }));

    console.log(`[ROUTE] ${lines.length} linhas sincronizadas para estação ${stopId}: ${lines.map(l => l.line).join(', ')}`);

    return res.json({
      success: true,
      station: {
        id:      station.code,
        name:    station.name,
        address: station.address,
        lat:     station.latitude,
        lng:     station.longitude
      },
      total_lines: lines.length,
      lines,
      synced_at: new Date().toISOString()
    });

  } catch (err) {
    console.error(`[STATION] Erro na sincronização de ${stopId}:`, err.message);
    return res.status(500).json({ success: false, error: 'Erro interno na sincronização' });
  }
};

// ============================================================
// pairTotem — POST /api/v1/transport/totem/pair
// ============================================================
export const pairTotem = async (req, res) => {
  const { pin } = req.body;
  console.log(`[API] Tentativa de pareamento (Activation Key). PIN: ${pin}`);

  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

  try {
    const { data: keyData, error: keyErr } = await supabase
      .from('activation_keys')
      .select('*, totens(*)')
      .eq('codigo', pin)
      .eq('utilizado', false)
      .single();

    if (keyErr || !keyData) {
      console.error('[API] PIN inválido, expirado ou já utilizado:', pin);
      return res.status(404).json({ error: 'PIN inválido ou já utilizado' });
    }

    const totem = keyData.totens;
    if (!totem) return res.status(404).json({ error: 'Totem não associado a esta chave' });

    console.log(`[API] Totem encontrado via MDM: ${totem.nome}. Registrando...`);
    await supabase.from('activation_keys').update({ utilizado: true }).eq('id', keyData.id);
    await supabase.from('totens').update({ status: 'online', ultima_conexao: new Date().toISOString(), token: keyData.token }).eq('id', totem.id);

    return res.json({
      totemId:    totem.id,
      token:      keyData.token,
      cidade:     totem.cidade || 'Serra',
      nome:       totem.nome,
      themeColor: '#2D9B5A',
      status:     'active'
    });
  } catch (err) {
    console.error('[API] Erro interno:', err.message);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

// ============================================================
// syncTotem — GET /api/v1/transport/totem/:totemId/sync
// ============================================================
export const syncTotem = async (req, res) => {
  const { totemId } = req.params;

  if (!supabase) return res.status(500).json({ error: 'Supabase não configurado' });

  try {
    await supabase.from('totens').update({ ultima_conexao: new Date().toISOString(), status: 'online' }).eq('id', totemId);

    const { data: commands } = await supabase
      .from('totem_commands')
      .select('*')
      .eq('totem_id', totemId)
      .eq('status', 'pending');

    if (commands && commands.length > 0) {
      for (const cmd of commands) {
        await supabase.from('totem_commands').update({ status: 'completed', executed_at: new Date().toISOString() }).eq('id', cmd.id);
      }
    }

    const { data: config } = await supabase.from('totem_config').select('*').eq('totem_id', totemId).single();

    const { data: campanhasGlobais } = await supabase.from('campanhas').select('*').eq('status', 'ativa');
    
    let todasAsCampanhas = [];
    const agora = new Date();
    const horaAtual = agora.getHours();
    // YYYY-MM-DD
    const hojeStr = agora.toISOString().split('T')[0];
    
    if (campanhasGlobais) {
      todasAsCampanhas = campanhasGlobais.filter(c => {
        const alvo = c.totens_alvo || {};
        
        // 1. Verifica se o Totem é alvo
        const isTarget = (alvo.tipo === 'todos') || (alvo.tipo === 'individual' && Array.isArray(alvo.ids) && (alvo.ids.includes(totemId.toString()) || alvo.ids.includes(parseInt(totemId))));
        if (!isTarget) return false;
        
        // 2. Verifica as Datas
        if (alvo.data_inicio && hojeStr < alvo.data_inicio) return false;
        if (alvo.data_fim && hojeStr > alvo.data_fim) return false;
        
        // 3. Verifica o Horário
        if (alvo.horarios) {
          if (alvo.horarios === 'comercial' && (horaAtual < 8 || horaAtual >= 18)) return false;
          if (alvo.horarios === 'manha' && (horaAtual < 6 || horaAtual >= 9)) return false;
          if (alvo.horarios === 'tarde' && (horaAtual < 17 || horaAtual >= 20)) return false;
          // 'integral' is always true
        }
        
        return true;
      });
    }

    let announcements = [];
    let activeCampaign = null;
    
    // Incrementa exibições da campanha sorteada
    if (todasAsCampanhas.length > 0) {
      // Pick one randomly or by logic (here we just pick the first or random)
      const c = todasAsCampanhas[Math.floor(Math.random() * todasAsCampanhas.length)];
      
      announcements.push({ id: c.id, text: c.nome + ' - ' + (c.descricao || '') });
      const mUrl = (c.totens_alvo && c.totens_alvo.arquivo_url) ? c.totens_alvo.arquivo_url : null;
      activeCampaign = { title: c.nome, mediaUrl: mUrl, type: c.formato || 'image' };
      
      // Assíncrono: atualiza o contador de exibição
      supabase.rpc('increment_exibicoes', { campanha_id: c.id }).then(() => {}).catch(() => {});
    } else {
      announcements.push({ id: 99, text: 'Prefeitura da Serra - Cidade Inteligente' });
      activeCampaign = { title: 'Cidade Inteligente', mediaUrl: null, type: 'image' };
    }

    // Busca dados de trânsito reais via getTotemTransitData inline
    let transitData = { lines: [], vehicles: [], arrivals: [], stop: null };
    try {
      const { data: totemStopLink } = await supabase
        .from('totem_stops')
        .select('stop_id')
        .eq('totem_id', totemId)
        .eq('active', true)
        .eq('is_primary', true)
        .single();

      const stopId = totemStopLink?.stop_id || 'ST-TL01';
      {
        const { data: stopRoutes } = await supabase
          .from('stop_routes')
          .select('route_id, direction, routes(codigo, nome, route_color)')
          .eq('stop_id', stopId)
          .eq('active', true);


        const routeIds = (stopRoutes || []).map(sr => sr.route_id);
        let vehicles = [], arrivals = [];

        if (TRANSIT_DATA_MODE === 'mock') {
          vehicles = MOCK_VEHICLES.filter(v => routeIds.includes(v.route_id));
          arrivals = MOCK_ARRIVALS.filter(a => a.stop_id === stopId && routeIds.includes(a.route_id));
        } else {
          if (routeIds.length > 0) {
            const { data: vd } = await supabase.from('vehicle_positions').select('*').in('route_id', routeIds);
            vehicles = vd || [];
            const { data: ad } = await supabase.from('arrivals').select('*').eq('stop_id', stopId).in('route_id', routeIds).eq('active', true).order('eta_minutes');
            arrivals = ad || [];
          }
        }

        const { data: st } = await supabase.from('bus_stops').select('*').eq('code', stopId).single();
        transitData = {
          stop: st ? { id: st.code, name: st.name, lat: st.latitude, lng: st.longitude } : null,
          lines: (stopRoutes || []).map(sr => {
            const r = sr.routes || {};
            const arrival = arrivals.find(a => a.route_id === sr.route_id);
            return {
              route_id:    sr.route_id,
              line:        r.codigo || sr.route_id,
              name:        r.nome || '',
              color:       r.route_color || '3B82F6',
              direction:   sr.direction || '',
              eta_minutes: arrival?.eta_minutes ?? null,
              distance_km: arrival?.distance_km ?? null,
              status:      arrival?.status || 'no_data'
            };
          }).sort((a, b) => (a.eta_minutes ?? 999) - (b.eta_minutes ?? 999)),
          vehicles,
          arrivals
        };

        console.log(`[TOTEM] Sync ${totemId}: ${transitData.lines.length} linhas, ${transitData.vehicles.length} veículos`);
      }
    } catch (te) {
      console.warn('[TOTEM] Aviso ao buscar trânsito no sync:', te.message);
    }

    return res.json({
      timestamp:   new Date().toISOString(),
      totemId,
      mode:        TRANSIT_DATA_MODE,
      commands:    commands || [],
      configSync: {
        themeColor:    config ? (config.tema === 'escuro' ? '#1A1A2E' : '#FFFFFF') : '#2D9B5A',
        config:        config || {},
        announcements,
        campaign:      activeCampaign
      },
      transit: transitData
    });

  } catch (err) {
    console.error('[API] Erro interno na sincronização:', err.message);
    return res.status(500).json({ error: 'Erro interno na sincronização' });
  }
};
