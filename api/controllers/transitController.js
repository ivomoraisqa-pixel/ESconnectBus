import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Se as chaves não estiverem no .env da API, avisar
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

// ==========================================
// SIMULADOR GLOBAL GTFS-RT (ESTADO EM MEMÓRIA)
// ==========================================
const globalFleet = [
  { vehicle_id: 'V-523-01', route_id: '523', line: '523', lat: -20.1200, lng: -40.3000, dir: 'Terminal Laranjeiras', speed: 45 },
  { vehicle_id: 'V-507-02', route_id: '507', line: '507', lat: -20.1300, lng: -40.3100, dir: 'Centro / Vitória', speed: 50 },
  { vehicle_id: 'V-814-03', route_id: '814', line: '814', lat: -20.1250, lng: -40.3050, dir: 'Cascata', speed: 38 },
  { vehicle_id: 'V-850-04', route_id: '850', line: '850', lat: -20.1180, lng: -40.2900, dir: 'Eldorado', speed: 42 },
  { vehicle_id: 'V-519-05', route_id: '519', line: '519', lat: -20.1400, lng: -40.3200, dir: 'T. Itaparica', speed: 55 },
  { vehicle_id: 'V-878-06', route_id: '878', line: '878', lat: -20.1220, lng: -40.2950, dir: 'Manguinhos', speed: 40 },
  { vehicle_id: 'V-832-07', route_id: '832', line: '832', lat: -20.1280, lng: -40.3150, dir: 'Vila Nova', speed: 35 },
  { vehicle_id: 'V-504-08', route_id: '504', line: '504', lat: -20.1150, lng: -40.3010, dir: 'T. Ibes', speed: 48 }
];

// Motor de física rudimentar para atualizar posições a cada segundo (Simulando GPS Worker)
setInterval(() => {
  globalFleet.forEach(bus => {
    // Adiciona um ruído randômico na direção para simular o ônibus andando na rua
    bus.lat += (Math.random() - 0.5) * 0.0005;
    bus.lng += (Math.random() - 0.5) * 0.0005;
  });
}, 2000);

export const getGlobalVehicles = (req, res) => {
  // Retorna a foto atual do mapa de calor do CCO
  return res.json({
    timestamp: new Date().toISOString(),
    total_active: globalFleet.length,
    vehicles: globalFleet
  });
};

// ==========================================
// CONSULTA TOTEM (API ANTIGA MANTIDA)
// ==========================================
export const getTotemTransitData = async (req, res) => {
  try {
    const { totemId } = req.params;

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase credentials not configured in API .env' });
    }

    const { data: totem, error: totemErr } = await supabase
      .from('totens')
      .select('*')
      .eq('id', totemId)
      .single();

    if (totemErr || !totem) {
      return res.status(404).json({ error: 'Totem not found' });
    }

    const { data: routes } = await supabase.from('routes').select('*').limit(5);

    const mockVehicles = [
      {
        vehicle_id: 'V-1020',
        route_id: routes && routes.length > 0 ? routes[0].route_id : '507',
        line: routes && routes.length > 0 ? routes[0].codigo : '507',
        distance: 1.2, 
        eta: 3, 
        status: 'on_time'
      },
      {
        vehicle_id: 'V-1033',
        route_id: routes && routes.length > 1 ? routes[1].route_id : '523',
        line: routes && routes.length > 1 ? routes[1].codigo : '523',
        distance: 2.5,
        eta: 6,
        status: 'delayed'
      }
    ];

    const responsePayload = {
      stop: totem.localizacao || 'Unknown Stop',
      totem_id: totem.id,
      routes: routes ? routes.map(r => r.codigo || r.route_id) : ['507', '523'],
      vehicles: mockVehicles,
      alerts: [],
      weather: {
        condition: 'Clear',
        temp: 28
      }
    };

    return res.json(responsePayload);
  } catch (error) {
    console.error('Error fetching transit data:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// ==========================================
// PAREAMENTO E SYNC WEB (NOVA ARQUITETURA)
// ==========================================
export const pairTotem = async (req, res) => {
  const { pin } = req.body;
  console.log(`[API] Tentativa de pareamento (Activation Key) recebida. PIN: ${pin}`);
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    // Busca a chave de ativação no banco
    const { data: keyData, error: keyErr } = await supabase
      .from('activation_keys')
      .select('*, totens(*)')
      .eq('codigo', pin)
      .eq('utilizado', false)
      .single();

    if (keyErr || !keyData) {
      console.error(`[API] PIN inválido, expirado ou já utilizado:`, pin);
      return res.status(404).json({ error: 'PIN inválido ou já utilizado' });
    }

    const totem = keyData.totens;
    if (!totem) {
      return res.status(404).json({ error: 'Totem não associado a esta chave de ativação' });
    }

    console.log(`[API] Totem encontrado via MDM: ${totem.nome}. Registrando...`);
    
    // Marca a chave como utilizada e atualiza o totem com o token seguro
    await supabase.from('activation_keys').update({ utilizado: true }).eq('id', keyData.id);
    await supabase.from('totens').update({ status: 'online', ultima_conexao: new Date().toISOString(), token: keyData.token }).eq('id', totem.id);

    // Payload de provisionamento (Bootstrap)
    return res.json({
      totemId: totem.id,
      token: keyData.token, // Token persistente de auth (Device Token)
      cidade: totem.cidade || 'Serra',
      nome: totem.nome,
      themeColor: '#2D9B5A',
      status: 'active'
    });
  } catch(err) {
    console.error(`[API] Erro interno:`, err);
    return res.status(500).json({ error: 'Erro interno' });
  }
};

export const syncTotem = async (req, res) => {
  const { totemId } = req.params;
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    // Opcional em prod: Validar se `token` bate com `totens.token`
    // 1. Atualiza ultima_conexao do totem (Heartbeat)
    await supabase.from('totens').update({ ultima_conexao: new Date().toISOString(), status: 'online' }).eq('id', totemId);

    // 2. Busca Comandos Remotos pendentes (Remote Commands Queue)
    const { data: commands } = await supabase
      .from('totem_commands')
      .select('*')
      .eq('totem_id', totemId)
      .eq('status', 'pending');
      
    if (commands && commands.length > 0) {
      for(let cmd of commands) {
        await supabase.from('totem_commands').update({ status: 'completed', executed_at: new Date().toISOString() }).eq('id', cmd.id);
      }
    }

    // 3. Busca Configurações do Totem (Tema, Fullscreen, Layout)
    const { data: config } = await supabase.from('totem_config').select('*').eq('totem_id', totemId).single();

    // 4. Busca Campanhas via Relacionamento N:N (Módulo Novo de Segmentação)
    const { data: totemCampaigns } = await supabase
      .from('totem_campaigns')
      .select('*, campanhas(*)')
      .eq('totem_id', totemId)
      .eq('ativo', true);
      
    // Também busca campanhas globais que tenham totens_alvo tipo 'todos' (Fallback MVP)
    const { data: campanhasGlobais } = await supabase.from('campanhas').select('*').eq('status', 'ativa');
    const campanhasAlvo = campanhasGlobais ? campanhasGlobais.filter(c => c.totens_alvo && c.totens_alvo.tipo === 'todos') : [];
    
    // Mescla campanhas específicas do N:N com as globais
    let todasAsCampanhas = [];
    if (totemCampaigns) totemCampaigns.forEach(tc => { if(tc.campanhas) todasAsCampanhas.push(tc.campanhas) });
    campanhasAlvo.forEach(c => {
      if(!todasAsCampanhas.find(tc => tc.id === c.id)) todasAsCampanhas.push(c);
    });

    let announcements = [];
    let activeCampaign = null;
    
    if (todasAsCampanhas.length > 0) {
      const c = todasAsCampanhas[0]; // Pega a primeira ativa
      announcements.push({
        id: c.id,
        text: c.nome + ' - ' + (c.descricao || 'Informação da Central')
      });
      activeCampaign = {
        title: c.nome,
        mediaUrl: 'https://images.unsplash.com/photo-1542314831-c6a420325142?auto=format&fit=crop&q=80&w=1080',
        type: 'image'
      };
    } else {
      announcements.push({ id: 99, text: 'Prefeitura da Serra - Cidade Inteligente' });
      activeCampaign = {
        title: 'Cidade Inteligente',
        mediaUrl: 'https://images.unsplash.com/photo-1542314831-c6a420325142?auto=format&fit=crop&q=80&w=1080',
        type: 'image'
      };
    }

    // 5. Busca horários (GTFS Simulados)
    const mockVehicles = [
       { vehicle_id: 'V-RT-01', line: '507', distance: parseFloat((Math.random() * 2 + 0.5).toFixed(1)), eta: Math.floor(Math.random() * 5 + 2) },
       { vehicle_id: 'V-RT-02', line: '523', distance: parseFloat((Math.random() * 3 + 1).toFixed(1)), eta: Math.floor(Math.random() * 8 + 4) },
       { vehicle_id: 'V-RT-03', line: '851', distance: parseFloat((Math.random() * 4 + 2).toFixed(1)), eta: Math.floor(Math.random() * 10 + 6) }
    ];

    // Payload Resposta Final
    return res.json({
      timestamp: new Date().toISOString(),
      totemId,
      commands: commands || [], // Totem Client lerá este array de comandos e executará!
      configSync: {
        themeColor: config ? (config.tema === 'escuro' ? '#1A1A2E' : '#FFFFFF') : '#2D9B5A',
        config: config || {},
        announcements,
        campaign: activeCampaign
      },
      vehicles: mockVehicles
    });
  } catch(err) {
    console.error(`[API] Erro interno na sincronização:`, err);
    return res.status(500).json({ error: 'Erro interno na sincronização' });
  }
};
