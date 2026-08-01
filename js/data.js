window.AppData = {
  // Helper API Genérica para queries simples
  async fetchAll(table) {
    const { data, error } = await window.supabase.from(table).select('*').order('created_at', { ascending: false });
    if (error) {
      console.error(`Erro ao carregar ${table}:`, error);
      return [];
    }
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
  async getCampanhas() { return this.fetchAll('campanhas'); },
  async getCampanhasAtivas() { 
    const { data } = await window.supabase.from('campanhas').select('*').eq('status', 'ativa');
    return data || []; 
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
  }
};
