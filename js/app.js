(function() {
  'use strict';
  
  window.Pages = window.Pages || {};
  
  // Register all routes
  const pages = {
    'dashboard': { render: Pages.dashboard, title: 'Painel Geral', subtitle: 'Visão geral dos totens e operações' },
    'totens': { render: Pages.totens, title: 'Totens', subtitle: 'Gerencie todos os totens do sistema' },
    'localizacoes': { render: Pages.localizacoes, title: 'Localizações', subtitle: 'Localizações dos totens no mapa' },
    'linhas': { render: Pages.linhas, title: 'Linhas de Ônibus', subtitle: 'Gerencie as linhas de ônibus' },

    'mapas': { render: Pages.mapas, title: 'Mapas e Pontos', subtitle: 'Gerencie mapas e pontos de parada' },
    'informativos': { render: Pages.informativos, title: 'Informativos', subtitle: 'Gerencie informativos exibidos nos totens' },
    'campanhas': { render: Pages.campanhas, title: 'Campanhas de Publicidade', subtitle: 'Crie e gerencie campanhas exibidos nos totens', headerActions: `<button class="btn btn-primary" onclick="window.Router.navigate('nova-campanha')">${window.Components ? window.Components.icon('plus', 16) : ''} Nova Campanha</button>` },
    'nova-campanha': { render: Pages.novaCampanha, title: 'Nova Campanha', subtitle: 'Criar e programar nova campanha com preview em tempo real' },
    'anuncios': { render: Pages.anuncios, title: 'Anúncios', subtitle: 'Gerencie anúncios de campanhas' },

    'relatorios': { render: Pages.relatorios, title: 'Relatórios de Exibição', subtitle: 'Relatórios detalhados de exibição' },
    'usuarios': { render: Pages.usuarios, title: 'Usuários', subtitle: 'Gerencie os usuários do sistema' },
    'perfis': { render: Pages.perfis, title: 'Perfis e Permissões', subtitle: 'Gerencie perfis de acesso' },
    'configuracoes': { render: Pages.configuracoes, title: 'Configurações Gerais', subtitle: 'Configurações do sistema' },
    'integracoes': { render: Pages.integracoes, title: 'Integrações', subtitle: 'Gerencie integrações com APIs externas' },
    'logs': { render: Pages.logs, title: 'Logs do Sistema', subtitle: 'Registros de atividades do sistema' },
    'informativos-novo': { render: Pages.informativosNovo, title: 'Novo Informativo', subtitle: 'Criar informativo da prefeitura' },
    'simulador': { render: Pages.simulador, title: 'Simulador do Totem', subtitle: 'Simulação idêntica ao dispositivo físico' },
    'mapa-operacional': { render: Pages.mapaOperacional, title: 'Mapa Operacional', subtitle: 'Visão global em tempo real' },
    'designer': { render: Pages.designer, title: 'Designer de Layout', subtitle: 'Editor visual de layout do totem com drag & drop' }
  };
  
  Object.keys(pages).forEach(key => window.Router.register(key, pages[key]));
  
  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    window.Router.init();
  });
})();
