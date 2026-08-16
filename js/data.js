window._appDataCache = {};
const CACHE_TTL = 30000; // 30 seconds

window.AppData = {
  // Helper API Genérica para queries simples
  async fetchAll(table, force = false) {
    const now = Date.now();
    if (!force && window._appDataCache[table] && (now - window._appDataCache[table].time < CACHE_TTL)) {
      return window._appDataCache[table].data;
    }
    const { data, error } = await window.supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(`Erro ao carregar ${table}:`, error);
      return [];
    }
    window._appDataCache[table] = { time: now, data: data };
    return data;
  },

  // Totens
  async getTotens() { return this.fetchAll('totens'); },
  async getOnlineTotens() { 
    const { data } = await window.supabase.from('totens').select('*').eq('status', 'online');
    return data || []; 
  },
  async getOfflineTotens() { 
    const { data } = await window.supabase.from('totens').select('*').eq('status', 'offline');
    return data || []; 
  },

  // Linhas
  async getLinhas() { return this.fetchAll('linhas'); },

  // Campanhas
  async getCampanhas(force = false) { return this.fetchAll('campanhas', force); },
  async getCampanhasAtivas() { 
    const { data } = await window.supabase.from('campanhas').select('*').eq('status', 'ativa');
    return data || []; 
  },
  async incrementExibicoes(campanhaId) {
    if (!campanhaId) return;
    try {
      const { data } = await window.supabase.from('campanhas').select('exibicoes').eq('id', campanhaId).single();
      if (data) {
        const novaQtd = (data.exibicoes || 0) + 1;
        await window.supabase.from('campanhas').update({ exibicoes: novaQtd }).eq('id', campanhaId);
        if (window._appDataCache['campanhas'] && window._appDataCache['campanhas'].data) {
          const item = window._appDataCache['campanhas'].data.find(c => c.id === campanhaId);
          if (item) item.exibicoes = novaQtd;
        }
      }
    } catch(err) {
      console.warn('[APPDATA] Aviso ao incrementar exibição:', err);
    }
  },
  calcularEstimativaExibicoes(c, todasCampanhas = [], totalTotensCount = 6) {
    const alvo = c.totens_alvo || {};
    
    // 1. Número de Totens Alvo
    let numTotens = totalTotensCount;
    if (alvo.tipo === 'individual' && Array.isArray(alvo.ids) && alvo.ids.length > 0) {
      numTotens = alvo.ids.length;
    }

    // 2. Horas por dia em segundos
    let segundosPorDia = 86400; // integral (24h)
    if (alvo.horarios === 'comercial') segundosPorDia = 10 * 3600; // 10h (08h - 18h)
    else if (alvo.horarios === 'manha') segundosPorDia = 3 * 3600; // 3h (06h - 09h)
    else if (alvo.horarios === 'tarde') segundosPorDia = 3 * 3600; // 3h (17h - 20h)

    // 3. Dias da campanha
    let dias = 30;
    if (alvo.data_inicio && alvo.data_fim) {
      const d1 = new Date(alvo.data_inicio);
      const d2 = new Date(alvo.data_fim);
      const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      if (!isNaN(diff) && diff > 0) dias = diff;
    } else if (c.dias_restantes) {
      dias = parseInt(c.dias_restantes);
    }

    // 4. Tempo de Exibição desta campanha (segundos)
    const tempoExibicaoProprio = alvo.tempo_exibicao ? parseInt(alvo.tempo_exibicao) : 15;

    // 5. Cálculo de compartilhamento com outras campanhas ativas
    let campanhasConcorrentes = todasCampanhas.filter(outra => outra.status === 'ativa');
    if (campanhasConcorrentes.length === 0) campanhasConcorrentes = [c];

    let tempoCicloTotal = 0;
    campanhasConcorrentes.forEach(comp => {
      const compTempo = (comp.totens_alvo && comp.totens_alvo.tempo_exibicao) ? parseInt(comp.totens_alvo.tempo_exibicao) : 15;
      tempoCicloTotal += compTempo + 15; // 15s do painel principal por transição
    });

    if (tempoCicloTotal <= 0) tempoCicloTotal = 30;

    // Inserções por dia por totem
    const insercoesPorDiaPorTotem = segundosPorDia / tempoCicloTotal;
    
    // Total estimado no ciclo de vida
    const totalEstimado = Math.round(numTotens * insercoesPorDiaPorTotem * dias);
    return totalEstimado;
  },
  startBackgroundPlaybackEngine() {
    if (window._bgPlaybackEngineStarted) return;
    window._bgPlaybackEngineStarted = true;

    setInterval(async () => {
      try {
        const [totens, campanhasAtivas] = await Promise.all([
          this.getOnlineTotens(),
          this.getCampanhasAtivas()
        ]);

        if (!totens || totens.length === 0 || !campanhasAtivas || campanhasAtivas.length === 0) return;

        const agora = new Date();
        const horaAtual = agora.getHours();
        const hojeStr = agora.toISOString().split('T')[0];

        // Para cada totem online, seleciona campanha direcionada ativa para simular reprodução
        for (const totem of totens) {
          const campanhasAlvo = campanhasAtivas.filter(c => {
            if (!c.totens_alvo) return false;
            const alvo = c.totens_alvo;

            const isTarget = (alvo.tipo === 'todos') || (alvo.tipo === 'individual' && Array.isArray(alvo.ids) && (alvo.ids.includes(totem.id.toString()) || alvo.ids.includes(parseInt(totem.id))));
            if (!isTarget) return false;

            if (alvo.data_inicio && hojeStr < alvo.data_inicio) return false;
            if (alvo.data_fim && hojeStr > alvo.data_fim) return false;

            if (alvo.horarios) {
              if (alvo.horarios === 'comercial' && (horaAtual < 8 || horaAtual >= 18)) return false;
              if (alvo.horarios === 'manha' && (horaAtual < 6 || horaAtual >= 9)) return false;
              if (alvo.horarios === 'tarde' && (horaAtual < 17 || horaAtual >= 20)) return false;
            }
            return true;
          });

          if (campanhasAlvo.length > 0) {
            const cItem = campanhasAlvo[Math.floor(Math.random() * campanhasAlvo.length)];
            await this.incrementExibicoes(cItem.id);
          }
        }

        // Invalida cache local de campanhas para que as telas leiam dados atualizados
        delete window._appDataCache['campanhas'];
      } catch (err) {
        console.warn('[BG-ENGINE] Aviso no motor de exibição:', err);
      }
    }, 4000);
  },
  async getCampanhasByStatus(s) { 
    if(s === 'todas') return this.getCampanhas();
    const { data } = await window.supabase.from('campanhas').select('*').eq('status', s);
    return data || []; 
  },

  // Anúncios
  async getAnuncios() { return this.fetchAll('anuncios'); },

  // Atualizações / Atividades
  async getAtualizacoes() { return this.fetchAll('atualizacoes'); },

  // Usuários
  async getUsuarios() { return this.fetchAll('usuarios'); },

  // Logs
  async getLogs() { return this.fetchAll('logs'); },

  // Como o supabase ainda não tem tabelas para essas configs fixas menores (poderia ter, mas para simular o app vamos manter algumas mockadas ou assumir a mesma estrutura)
  // Por simplicidade na demonstração, caso a tabela não exista, vamos tratar a exceção e retornar mock para as configurações menos vitais:
  
  async getInformativos() {
    const { data, error } = await window.supabase.from('informativos').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao buscar informativos:', error);
      return [];
    }
    return data || [];
  },

  async createInformativo(info) {
    const { data, error } = await window.supabase.from('informativos').insert([info]);
    if (error) throw error;
    return data;
  },

  async updateInformativo(id, info) {
    const { data, error } = await window.supabase.from('informativos').update(info).eq('id', id);
    if (error) throw error;
    return data;
  },

  async deleteInformativo(id) {
    const { error } = await window.supabase.from('informativos').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async createCampanha(campanha) {
    const totens_alvo = campanha.totens_alvo;
    
    // Sanitização rigorosa (Engenharia de Dados): 
    // Filtramos apenas as colunas que realmente existem no banco, 
    // ignorando campos de formulários velhos que possam estar em cache.
    const safeData = {
      nome: campanha.nome,
      descricao: campanha.descricao || (campanha.cliente ? `Cliente: ${campanha.cliente}` : null),
      periodo: campanha.periodo || (campanha.data_inicio ? `${campanha.data_inicio} - ${campanha.data_fim}` : null),
      dias_restantes: campanha.dias_restantes || 30,
      progresso: campanha.progresso || 0,
      totens: campanha.totens || 0,
      totens_alvo: campanha.totens_alvo,
      anuncios: campanha.anuncios || 0,
      exibicoes: campanha.exibicoes || 0,
      ctr: campanha.ctr || 0,
      status: campanha.status || 'ativa',
      formato: campanha.formato || campanha.tipo || 'imagem',
      investimento: campanha.investimento || 0
    };

    const { data, error } = await window.supabase.from('campanhas').insert([safeData]).select();
    if (error) throw error;

    if (totens_alvo && totens_alvo.tipo === 'individual' && totens_alvo.ids && data && data.length > 0) {
      const idCampanha = data[0].id;
      const links = totens_alvo.ids.map(id => ({
          totem_id: parseInt(id),
          campanha_id: idCampanha,
          ativo: true
      }));
      await window.supabase.from('totem_campaigns').insert(links);
    }
    return data;
  },

  async updateCampanha(id, campanha) {
    const totens_alvo = campanha.totens_alvo;
    
    const safeData = {};
    const allowed = ['nome', 'descricao', 'periodo', 'dias_restantes', 'progresso', 'totens', 'totens_alvo', 'anuncios', 'exibicoes', 'ctr', 'status', 'formato', 'investimento'];
    
    for (let key of allowed) {
      if (campanha[key] !== undefined) safeData[key] = campanha[key];
    }
    // Mapeamento de fallback de campos cacheados
    if(campanha.cliente && !safeData.descricao) safeData.descricao = `Cliente: ${campanha.cliente}`;
    if(campanha.data_inicio && !safeData.periodo) safeData.periodo = `${campanha.data_inicio} - ${campanha.data_fim}`;
    if(campanha.tipo && !safeData.formato) safeData.formato = campanha.tipo;

    const { data, error } = await window.supabase.from('campanhas').update(safeData).eq('id', id).select();
    if (error) throw error;

    if (totens_alvo) {
      // Deleta vínculos antigos
      await window.supabase.from('totem_campaigns').delete().eq('campanha_id', id);
      // Cria novos
      if (totens_alvo.tipo === 'individual' && totens_alvo.ids) {
        const links = totens_alvo.ids.map(tid => ({
            totem_id: parseInt(tid),
            campanha_id: id,
            ativo: true
        }));
        await window.supabase.from('totem_campaigns').insert(links);
      }
    }
    return data;
  },

  async deleteCampanha(id) {
    // Cascata configurada no DB já deve deletar de totem_campaigns, mas garantimos via app também
    await window.supabase.from('totem_campaigns').delete().eq('campanha_id', id);
    const { error } = await window.supabase.from('campanhas').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async sendRemoteCommand(totemId, command, payload = {}) {
    const { data, error } = await window.supabase.from('totem_commands').insert([{
      totem_id: totemId,
      comando: command,
      payload: payload,
      status: 'pending'
    }]);
    if (error) throw error;
    return data;
  },

  async getPlaylists() {
    const { data, error } = await window.supabase.from('playlists').select('*');
    if (error) return [
      { id: 1, nome: 'Playlist Principal', descricao: 'Conteúdo padrão', itens: 8, totens: 28, status: 'ativa', duracao: '2min 30s' }
    ];
    return data;
  },

  async getPerfis() {
    const { data, error } = await window.supabase.from('perfis').select('*');
    if (error) return [
      { id: 1, nome: 'Administrador', descricao: 'Acesso total ao sistema', usuarios: 2, permissoes: ['totens', 'campanhas', 'usuarios'] }
    ];
    return data;
  },

  async getIntegracoes() {
    const { data, error } = await window.supabase.from('integracoes').select('*');
    if (error) return [
      { id: 1, nome: 'API de Transporte CETURB', status: 'conectado', ultimaSync: '23/05/2025 10:45', tipo: 'API REST' }
    ];
    return data;
  },

  async getConfiguracoes() {
    return {
      nomeEmpresa: 'SerraBus Conect',
      timezone: 'America/Sao_Paulo',
      intervaloAtualizacao: 30,
      backupAutomatico: true,
      notificacoesEmail: true,
      temaTotem: 'escuro'
    };
  },

  // Funções Agregadoras de Dashboard (Dashboard Stats)
  async getDashboardStats() {
    const totens = await this.getTotens();
    const campanhas = await this.getCampanhas();
    const linhas = await this.getLinhas();
    const anuncios = await this.getAnuncios();
    
    const online = totens.filter(t => t.status === 'online').length;
    
    return {
      totensAtivos: online,
      totalTotens: totens.length,
      percentualOnline: totens.length ? Math.round((online / totens.length) * 1000)/10 : 0,
      exibicoesHoje: campanhas.reduce((acc, curr) => acc + (curr.exibicoes || 0), 0),
      exibicoesTrend: 12.5,
      linhasAtivas: linhas.length,
      atualizacoesHoje: 5,
      campanhasAtivas: campanhas.filter(c => c.status === 'ativa').length,
      campanhasTerminam: 3,
      alertas: totens.filter(t => t.status === 'offline').length,
      ctrMedio: 2.18,
      ctrTrend: 0.35,
      anunciosAtivos: anuncios.filter(a => a.status === 'ativo').length,
      totalAnuncios: anuncios.length,
      investimentoMes: campanhas.reduce((acc, curr) => acc + (curr.investimento || 0), 0),
      investimentoTrend: 8.2
    };
  },

  getCampaignPerformance() {
    return {
      labels: ['17/05', '18/05', '19/05', '20/05', '21/05', '22/05', '23/05'],
      exibicoes: [42000, 45000, 38000, 52000, 48000, 55000, 60000],
      cliques: [850, 920, 780, 1050, 980, 1120, 1250],
      ctr: [2.0, 2.04, 2.05, 2.02, 2.04, 2.04, 2.08]
    };
  },

  async getInvestimentoRetorno() {
    const stats = await this.getDashboardStats();
    return {
      investimentoMes: 'R$ ' + stats.investimentoMes.toLocaleString('pt-BR', {minimumFractionDigits:2}),
      cpmMedio: 'R$ 12,20',
      custoPorClique: 'R$ 0,35',
      retornoEstimado: 'R$ 45.230,00',
      roi: '2,44x'
    };
  },

  // ═══════════════════════════════════════════════════
  // TRÂNSITO — Estação × Linhas × GPS × ETA
  // ═══════════════════════════════════════════════════

  /** Lista todas as estações (bus_stops) */
  async getBusStops(force = false) {
    const table = 'bus_stops';
    const now = Date.now();
    if (!force && window._appDataCache[table] && (now - window._appDataCache[table].time < CACHE_TTL)) {
      return window._appDataCache[table].data;
    }
    const { data, error } = await window.supabase.from('bus_stops').select('*').eq('active', true).order('name').limit(5000);
    if (error) { console.error('[STATION] Erro ao buscar estações:', error); return []; }
    window._appDataCache[table] = { time: now, data: data };
    return data || [];
  },

  /** Busca uma estação pelo code */
  async getBusStopByCode(code) {
    const { data, error } = await window.supabase.from('bus_stops').select('*').eq('code', code).single();
    if (error) return null;
    return data;
  },

  /** Retorna as linhas vinculadas a uma estação via stop_routes */
  async getRoutesByStop(stopId, force = false) {
    const cacheKey = 'stop_routes_' + stopId;
    const now = Date.now();
    if (!force && window._appDataCache[cacheKey] && (now - window._appDataCache[cacheKey].time < CACHE_TTL)) {
      return window._appDataCache[cacheKey].data;
    }
    const { data, error } = await window.supabase
      .from('stop_routes')
      .select('route_id, direction, stop_sequence, routes(route_id, codigo, nome, route_color, route_short_name)')
      .eq('stop_id', stopId)
      .eq('active', true);
    if (error) { console.error('[ROUTE] Erro ao buscar linhas da estação:', error); return []; }
    window._appDataCache[cacheKey] = { time: now, data: data || [] };
    return data || [];
  },

  /** Busca a estação principal vinculada a um totem */
  async getTotemPrimaryStop(totemId) {
    const { data, error } = await window.supabase
      .from('totem_stops')
      .select('stop_id, is_primary, bus_stops(code, name, address, latitude, longitude)')
      .eq('totem_id', totemId)
      .eq('is_primary', true)
      .eq('active', true)
      .single();
    if (error) return null;
    return data;
  },

  /** Vincula (ou atualiza) uma estação a um totem */
  async setTotemStop(totemId, stopCode) {
    // Remove vínculos primários anteriores
    await window.supabase.from('totem_stops').update({ active: false }).eq('totem_id', totemId).eq('is_primary', true);
    // Cria novo vínculo
    const { data, error } = await window.supabase
      .from('totem_stops')
      .upsert([{ totem_id: totemId, stop_id: stopCode, is_primary: true, active: true }], { onConflict: 'totem_id,stop_id' })
      .select();
    if (error) throw error;
    return data;
  },

  /** Busca chegadas (arrivals) para uma estação */
  async getArrivalsByStop(stopId) {
    const { data, error } = await window.supabase
      .from('arrivals')
      .select('*')
      .eq('stop_id', stopId)
      .eq('active', true)
      .order('eta_minutes', { ascending: true });
    if (error) { console.error('[ETA] Erro ao buscar ETAs:', error); return []; }
    return data || [];
  },

  /** Busca veículos de um conjunto de route_ids */
  async getVehiclesByRoutes(routeIds) {
    if (!routeIds || routeIds.length === 0) return [];
    const { data, error } = await window.supabase
      .from('vehicle_positions')
      .select('*')
      .in('route_id', routeIds);
    if (error) { console.error('[VEHICLE] Erro ao buscar veículos:', error); return []; }
    return data || [];
  },

  /** Sincroniza uma estação via API backend */
  async syncStationViaAPI(stopId) {
    const API_BASE = 'http://localhost:3000';
    try {
      const resp = await fetch(`${API_BASE}/api/transit/sync-station/${stopId}`, { method: 'POST' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.error('[STATION] Erro ao sincronizar via API:', err.message);
      // Fallback: sincroniza direto via Supabase
      const station = await this.getBusStopByCode(stopId);
      if (!station) throw new Error(`Estação '${stopId}' não encontrada`);
      const routes = await this.getRoutesByStop(stopId);
      return {
        success: true,
        station: { id: station.code, name: station.name, lat: station.latitude, lng: station.longitude },
        total_lines: routes.length,
        lines: routes.map(r => ({ route_id: r.route_id, line: r.routes?.codigo || r.route_id, nome: r.routes?.nome || '', direction: r.direction || '' })),
        synced_at: new Date().toISOString(),
        source: 'supabase_fallback'
      };
    }
  },

  /** Busca dados completos de trânsito do totem via API ou direto no Supabase */
  async getTotemTransitData(totemId) {
    const API_BASE = 'http://localhost:3000';
    try {
      const resp = await fetch(`${API_BASE}/api/v1/transport/totem/${totemId}`);
      if (resp.ok) return await resp.json();
    } catch (_) { /* API offline — usa fallback Supabase */ }
    // Fallback via Supabase direto
    const link = await this.getTotemPrimaryStop(totemId);
    if (!link) return { stop: null, lines: [], vehicles: [], arrivals: [], error_transit: 'Totem sem estação vinculada' };
    const stopId = link.stop_id;
    const stopRoutes = await this.getRoutesByStop(stopId);
    const routeIds = stopRoutes.map(sr => sr.route_id);
    const [vehicles, arrivals] = await Promise.all([
      this.getVehiclesByRoutes(routeIds),
      this.getArrivalsByStop(stopId)
    ]);
    return {
      stop: link.bus_stops || { id: stopId },
      lines: stopRoutes.map(sr => {
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
  }
};

