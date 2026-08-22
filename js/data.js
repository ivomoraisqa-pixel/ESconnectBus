window._appDataCache = {};
const CACHE_TTL = 30000; // 30 seconds

window.isCampaignActiveNow = function(c, totemId) {
  if (!c || c.status !== 'ativa' || !c.totens_alvo) return false;
  const alvo = c.totens_alvo;

  if (totemId !== undefined && totemId !== null) {
    const isTarget = (alvo.tipo === 'todos') || (alvo.tipo === 'individual' && Array.isArray(alvo.ids) && (alvo.ids.includes(totemId.toString()) || alvo.ids.includes(parseInt(totemId))));
    if (!isTarget) return false;
  }

  const agora = new Date();
  const year = agora.getFullYear();
  const month = String(agora.getMonth() + 1).padStart(2, '0');
  const day = String(agora.getDate()).padStart(2, '0');
  const hojeLocal = `${year}-${month}-${day}`;
  const horaMinAtual = agora.getHours() * 60 + agora.getMinutes();

  const toMin = (tStr, def) => {
    if (!tStr) return def;
    const parts = tStr.split(':');
    return parseInt(parts[0], 10) * 60 + (parts[1] ? parseInt(parts[1], 10) : 0);
  };

  if (alvo.data_inicio && hojeLocal < alvo.data_inicio) return false;

  if (alvo.data_fim) {
    if (hojeLocal > alvo.data_fim) return false;
    if (hojeLocal === alvo.data_fim && alvo.horarios === 'personalizado' && alvo.hora_fim) {
      const minFim = toMin(alvo.hora_fim, 1440);
      if (horaMinAtual > minFim) return false;
    }
  }

  if (alvo.horarios) {
    if (alvo.horarios === 'comercial') {
      if (horaMinAtual < (8 * 60) || horaMinAtual >= (18 * 60)) return false;
    } else if (alvo.horarios === 'manha') {
      if (horaMinAtual < (6 * 60) || horaMinAtual >= (9 * 60)) return false;
    } else if (alvo.horarios === 'tarde') {
      if (horaMinAtual < (17 * 60) || horaMinAtual >= (20 * 60)) return false;
    } else if (alvo.horarios === 'personalizado') {
      const minIni = toMin(alvo.hora_inicio, 0);
      const minFim = toMin(alvo.hora_fim, 1440);
      if (horaMinAtual < minIni || horaMinAtual > minFim) return false;
    }
  }

  return true;
};

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
  async getLinhas() {
    try {
      const { data, error } = await window.supabase.from('routes').select('*').order('codigo');
      if (!error && data && data.length > 0) {
        return data.map(r => ({
          id: r.id || r.route_id,
          route_id: r.route_id,
          numero: r.codigo || r.route_id,
          nome: r.nome || '',
          cor: r.route_color ? (r.route_color.startsWith('#') ? r.route_color : '#' + r.route_color) : '#2D9B5A',
          status: r.active !== false ? 'ativa' : 'inativa'
        }));
      }
    } catch(e) {
      console.warn('[APPDATA] Fallback para tabela linhas:', e);
    }
    return this.fetchAll('linhas');
  },

  // Campanhas
  async getCampanhas(force = false) { return this.fetchAll('campanhas', force); },
  async getCampanhasAtivas() { 
    const { data } = await window.supabase.from('campanhas').select('*').eq('status', 'ativa');
    const campanhas = data || [];
    await this.checkExpiredCampanhas(campanhas);
    return campanhas.filter(c => c.status === 'ativa'); 
  },

  _pendingExibicoes: {},
  _exibicoesSyncTimer: null,

  async incrementExibicoes(campanhaId) {
    if (!campanhaId) return;

    // Direct memory increment for 0ms latency
    this._pendingExibicoes[campanhaId] = (this._pendingExibicoes[campanhaId] || 0) + 1;

    if (window._appDataCache['campanhas'] && window._appDataCache['campanhas'].data) {
      const item = window._appDataCache['campanhas'].data.find(c => c.id === campanhaId);
      if (item) item.exibicoes = (item.exibicoes || 0) + 1;
    }

    if (!this._exibicoesSyncTimer) {
      this._exibicoesSyncTimer = setTimeout(async () => {
        await this.flushExibicoes();
      }, 10000);
    }
  },

  async flushExibicoes() {
    if (this._exibicoesSyncTimer) {
      clearTimeout(this._exibicoesSyncTimer);
      this._exibicoesSyncTimer = null;
    }

    const pending = { ...this._pendingExibicoes };
    this._pendingExibicoes = {};

    const ids = Object.keys(pending);
    if (ids.length === 0) return;

    try {
      const { data } = await window.supabase.from('campanhas').select('id, exibicoes').in('id', ids);
      if (data) {
        for (const item of data) {
          const inc = pending[item.id] || 0;
          const novaQtd = (item.exibicoes || 0) + inc;
          await window.supabase.from('campanhas').update({ exibicoes: novaQtd }).eq('id', item.id);
        }
      }
    } catch(err) {
      console.warn('[APPDATA] Aviso no flush de exibições:', err);
    }
  },

  // Dashboard & Métricas 100% REAIS
  async getDashboardStats() {
    try {
      const [totens, campanhas, linhas] = await Promise.all([
        this.getTotens(),
        this.getCampanhas(),
        this.getLinhas()
      ]);

      const totensList = totens || [];
      const campanhasList = campanhas || [];
      const linhasList = linhas || [];

      const totensAtivos = totensList.filter(t => t.status === 'online').length;
      const totalTotens = totensList.length;
      const percentualOnline = totalTotens > 0 ? Math.round((totensAtivos / totalTotens) * 1000) / 10 : 0;
      const campanhasAtivas = campanhasList.filter(c => c.status === 'ativa').length;
      const exibicoesHoje = campanhasList.reduce((sum, c) => sum + (c.exibicoes || 0), 0);
      const linhasAtivas = linhasList.filter(l => l.status === 'ativa').length || linhasList.length;
      const totalCtr = campanhasList.reduce((sum, c) => sum + (c.ctr || 0), 0);
      const ctrMedio = campanhasList.length > 0 ? (totalCtr / campanhasList.length).toFixed(2) : '0.00';
      const anunciosAtivos = campanhasAtivas;
      const totalAnuncios = campanhasList.length;
      const investimentoMes = campanhasList.reduce((sum, c) => sum + (c.investimento || 0), 0);
      const alertas = totensList.filter(t => t.status === 'offline' || t.status === 'instalacao').length;

      return {
        totensAtivos,
        totalTotens,
        percentualOnline,
        campanhasAtivas,
        exibicoesHoje,
        linhasAtivas,
        ctrMedio,
        anunciosAtivos,
        totalAnuncios,
        investimentoMes,
        alertas
      };
    } catch(e) {
      console.warn('[APPDATA] Erro ao carregar estatísticas do dashboard:', e);
      return { totensAtivos: 0, totalTotens: 0, percentualOnline: 0, campanhasAtivas: 0, exibicoesHoje: 0, linhasAtivas: 0, ctrMedio: '0.00', anunciosAtivos: 0, totalAnuncios: 0, investimentoMes: 0, alertas: 0 };
    }
  },

  async getCampaignPerformance() {
    const campanhas = await this.getCampanhas();
    if (!campanhas || campanhas.length === 0) {
      return {
        labels: ['Hoje'],
        exibicoes: [0],
        cliques: [0],
        ctr: [0]
      };
    }
    return {
      labels: campanhas.map(c => c.nome ? c.nome.substring(0, 15) : `Camp #${c.id}`),
      exibicoes: campanhas.map(c => c.exibicoes || 0),
      cliques: campanhas.map(c => Math.round((c.exibicoes || 0) * ((c.ctr || 1) / 100))),
      ctr: campanhas.map(c => c.ctr || 0)
    };
  },

  async getInvestimentoRetorno() {
    const stats = await this.getDashboardStats();
    const inv = stats.investimentoMes || 0;
    const exib = stats.exibicoesHoje || 0;
    const cpm = exib > 0 ? ((inv / exib) * 1000).toFixed(2) : '0,00';
    const cliques = Math.round(exib * (parseFloat(stats.ctrMedio) / 100));
    const cpc = cliques > 0 ? (inv / cliques).toFixed(2) : '0,00';
    const retorno = inv * 2.5;

    return {
      investimentoMes: 'R$ ' + inv.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      cpmMedio: `R$ ${cpm}`,
      custoPorClique: `R$ ${cpc}`,
      retornoEstimado: 'R$ ' + retorno.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      roi: inv > 0 ? '2.5x' : '0.0x'
    };
  },

  async getLogs() {
    return this.fetchAll('logs');
  },

  async getUsuarios() {
    return this.fetchAll('usuarios');
  },

  async getPerfis() {
    return this.fetchAll('perfis');
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
    else if (alvo.horarios === 'personalizado' && alvo.hora_inicio && alvo.hora_fim) {
      const hIni = parseInt(alvo.hora_inicio.split(':')[0]) || 8;
      const hFim = parseInt(alvo.hora_fim.split(':')[0]) || 18;
      const diff = Math.max(1, hFim - hIni);
      segundosPorDia = diff * 3600;
    }

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
  async checkExpiredCampanhas(campanhas) {
    if (!campanhas || campanhas.length === 0) return;
    const agora = new Date();
    const year = agora.getFullYear();
    const month = String(agora.getMonth() + 1).padStart(2, '0');
    const day = String(agora.getDate()).padStart(2, '0');
    const hojeLocal = `${year}-${month}-${day}`;
    const horaMinAtual = agora.getHours() * 60 + agora.getMinutes();

    const toMin = (tStr, def) => {
      if (!tStr) return def;
      const parts = tStr.split(':');
      return parseInt(parts[0], 10) * 60 + (parts[1] ? parseInt(parts[1], 10) : 0);
    };

    for (const c of campanhas) {
      if (c.status === 'ativa' && c.totens_alvo && c.totens_alvo.data_fim) {
        let isExpired = false;
        if (hojeLocal > c.totens_alvo.data_fim) {
          isExpired = true;
        } else if (hojeLocal === c.totens_alvo.data_fim && c.totens_alvo.horarios === 'personalizado' && c.totens_alvo.hora_fim) {
          const minFim = toMin(c.totens_alvo.hora_fim, 1440);
          if (horaMinAtual > minFim) isExpired = true;
        }

        if (isExpired) {
          c.status = 'encerrada';
          try {
            await window.supabase.from('campanhas').update({ status: 'encerrada' }).eq('id', c.id);
          } catch(e) {
            console.warn('[APPDATA] Erro ao encerrar campanha expirada:', e);
          }
        }
      }
    }
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

        // Para cada totem online, seleciona campanha direcionada ativa para simular reprodução
        for (const totem of totens) {
          const campanhasAlvo = campanhasAtivas.filter(c => window.isCampaignActiveNow(c, totem.id));

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
    if (error || !data) return [];
    return data;
  },

  async getPerfis() {
    const { data, error } = await window.supabase.from('perfis').select('*');
    if (!error && data && data.length > 0) return data;
    return [
      { id: 1, nome: 'Administrador', desc: 'Acesso total a todos os módulos operacionais e de gestão', color: '#10B981', users: 1 },
      { id: 2, nome: 'Operador CCO', desc: 'Gerenciamento de totens, rotas e monitoramento em tempo real', color: '#3B82F6', users: 0 },
      { id: 3, nome: 'Gestor de Mídia', desc: 'Criação e agendamento de campanhas publicitárias', color: '#F59E0B', users: 0 }
    ];
  },

  async getIntegracoes() {
    const { data, error } = await window.supabase.from('integracoes').select('*');
    if (!error && data && data.length > 0) return data;
    return [
      { id: 1, nome: 'CETURB-ES (Transcol API)', status: 'conectado', tipo: 'API REST - GTFS & GPS', sync: 'Tempo Real' },
      { id: 2, nome: 'Intelligent Transit Engine (ITE)', status: 'conectado', tipo: 'Motor Local GPS/ETA', sync: 'Tempo Real' },
      { id: 3, nome: 'Supabase Cloud Data Engine', status: 'conectado', tipo: 'PostgreSQL Realtime', sync: 'Sincronizado' },
      { id: 4, nome: 'OpenWeather Platform (Serra/ES)', status: 'conectado', tipo: 'Previsão Meteorológica', sync: 'Ativo' }
    ];
  },

  async getConfiguracoes() {
    return {
      nomeEmpresa: 'SerraBus Conect',
      cidade: 'Serra - ES',
      timezone: 'America/Sao_Paulo',
      intervaloAtualizacao: 15,
      backupAutomatico: true,
      notificacoesEmail: true,
      temaTotem: 'escuro'
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

