window.Pages = window.Pages || {};
Pages.dashboard = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  
  const stats = await window.AppData.getDashboardStats();
  const totens = await window.AppData.getTotens();
  const campanhas = await window.AppData.getCampanhas();
  const logs = await window.AppData.getLogs();
  
  const online = totens.filter(t => t.status === 'online').length;
  const offline = totens.filter(t => t.status === 'offline').length;
  const instalacao = totens.filter(t => t.status === 'instalacao').length;
  const total = totens.length;
  
  main.innerHTML = `
    <!-- KPI Row: 5 cards -->
    <div class="kpi-row">
      ${Components.kpiCard({
        icon: Components.icon('monitor', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        title: 'Totens Ativos',
        value: `${stats.totensAtivos || 0} / ${stats.totalTotens || 0}`,
        subtitle: 'Total de totens',
        tag: 'Online',
        tagColor: '#10B981',
        borderColor: '#10B981'
      })}
      ${Components.kpiCard({
        icon: Components.icon('bar-chart', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        title: 'Exibições Hoje',
        value: stats.exibicoesHoje ? stats.exibicoesHoje.toLocaleString('pt-BR') : '0',
        subtitle: 'Total diário',
        variant: 'blue'
      })}
      ${Components.kpiCard({
        icon: Components.icon('bus', 24),
        iconBg: '#FEF3C7',
        iconColor: '#92400E',
        title: 'Linhas Ativas',
        value: stats.linhasAtivas ? stats.linhasAtivas.toString() : '0',
        subtitle: 'Em operação',
        variant: 'orange'
      })}
      ${Components.kpiCard({
        icon: Components.icon('megaphone', 24),
        iconBg: '#FCE7F3',
        iconColor: '#9D174D',
        title: 'Campanhas Ativas',
        value: stats.campanhasAtivas ? stats.campanhasAtivas.toString() : '0',
        subtitle: 'Rodando agora',
        variant: 'red'
      })}
      ${Components.kpiCard({
        icon: Components.icon('alert-triangle', 24),
        iconBg: '#FEE2E2',
        iconColor: '#991B1B',
        title: 'Alertas',
        value: stats.alertas ? stats.alertas.toString() : '0',
        subtitle: 'Requerem atenção',
        variant: 'red'
      })}
    </div>
    
    <!-- Middle Row: Map + Donut Chart + Recent Updates -->
    <div class="grid-dashboard-map">
      <!-- Map Card -->
      <div class="card" style="grid-column: span 1;">
        <div class="card-header">Mapa dos Totens</div>
        <div class="card-body">
          <div id="map-container" style="height:300px;background:#e5e7eb;border-radius:8px;position:relative;overflow:hidden;">
            <div id="dashboard-map" style="height:300px;width:100%;"></div>
          </div>
          <div class="map-legend" style="display:flex;gap:16px;margin-top:12px;justify-content:center;font-size:13px;">
            <span class="legend-item" style="display:flex;align-items:center;gap:6px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#10B981"></span> Online</span>
            <span class="legend-item" style="display:flex;align-items:center;gap:6px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#EF4444"></span> Offline</span>
            <span class="legend-item" style="display:flex;align-items:center;gap:6px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#F59E0B"></span> Instalação</span>
          </div>
        </div>
      </div>
      
      <!-- Status Donut -->
      <div class="card">
        <div class="card-header">Status dos Totens</div>
        <div class="card-body" style="display:flex;flex-direction:column;align-items:center;">
          <canvas id="status-donut" width="200" height="200"></canvas>
          <div id="status-legend" style="margin-top:24px;width:100%;"></div>
        </div>
        <div class="card-footer"><a href="#totens">Ver todos os totens →</a></div>
      </div>
      
      <!-- Recent Updates -->
      <div class="card">
        <div class="card-header">Atualizações Recentes</div>
        <div class="card-body" id="recent-updates"></div>
        <div class="card-footer"><a href="#logs">Ver todas as atualizações →</a></div>
      </div>
    </div>
    
    <!-- Bottom Row: Recent Totems table + Best Campaigns -->
    <div class="grid-2">
      <!-- Recent Totems -->
      <div class="card">
        <div class="card-header">Totens Recentes</div>
        <div class="card-body" style="padding:0;overflow-x:auto;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nome do Totem</th>
                <th>Localização</th>
                <th>Status</th>
                <th>Última Conexão</th>
                <th>Versão</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="recent-totems-body"></tbody>
          </table>
        </div>
        <div class="card-footer"><a href="#totens">Ver todos os totens →</a></div>
      </div>
      
      <!-- Best Performing Campaigns -->
      <div class="card">
        <div class="card-header">Campanhas com Melhor Desempenho</div>
        <div class="card-body" id="best-campaigns"></div>
        <div class="card-footer"><a href="#campanhas">Ver todas as campanhas →</a></div>
      </div>
    </div>
  `;
  
  // Render donut chart
  setTimeout(() => {
    Charts.donut('status-donut', [
      { label: 'Online', value: online, color: '#10B981' },
      { label: 'Offline', value: offline, color: '#EF4444' },
      { label: 'Instalação', value: instalacao, color: '#F59E0B' }
    ], { text: total.toString(), subtext: 'Total' });
  }, 100);
  
  // Render status legend
  const pctOnline = total ? ((online / total) * 100).toFixed(1).replace('.', ',') : '0,0';
  const pctOffline = total ? ((offline / total) * 100).toFixed(1).replace('.', ',') : '0,0';
  const pctInst = total ? ((instalacao / total) * 100).toFixed(1).replace('.', ',') : '0,0';

  document.getElementById('status-legend').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
      <div class="legend-item" style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:8px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#10B981"></span> Online</span> <strong>${online} <span style="color:#6B7280;font-weight:400;">(${pctOnline}%)</span></strong></div>
      <div class="legend-item" style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:8px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#EF4444"></span> Offline</span> <strong>${offline} <span style="color:#6B7280;font-weight:400;">(${pctOffline}%)</span></strong></div>
      <div class="legend-item" style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:8px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#F59E0B"></span> Instalação</span> <strong>${instalacao} <span style="color:#6B7280;font-weight:400;">(${pctInst}%)</span></strong></div>
    </div>
  `;
  
  // Render recent totems
  const tbody = document.getElementById('recent-totems-body');
  totens.slice(0, 5).forEach(t => {
    const ultimaConexaoFormatada = t.ultima_conexao ? new Date(t.ultima_conexao).toLocaleString('pt-BR') : 'Nunca';
    const acoesHtml = `
      <div style="display:flex;gap:4px;">
        <button class="btn-icon" title="Visualizar" onclick="window.TotensController.openDetalhesModal('${encodeURIComponent(JSON.stringify(t)).replace(/'/g, '%27')}')">${Components.icon('eye', 16)}</button>
        <button class="btn-icon" title="Ir para Totens" onclick="window.Router.navigate('totens')">${Components.icon('edit', 16)}</button>
        <button class="btn-icon" title="Gerar Acesso" onclick="window.TotensController.fireAction && window.TotensController.fireAction('Gerar Acesso')">${Components.icon('link', 16)}</button>
      </div>
    `;
    
    tbody.innerHTML += `
      <tr>
        <td>${t.nome || '-'}</td>
        <td>${t.localizacao || '-'}</td>
        <td>${Components.badge(t.status)}</td>
        <td>${ultimaConexaoFormatada}</td>
        <td>${t.versao || '-'}</td>
        <td>${acoesHtml}</td>
      </tr>
    `;
  });
  
  // Render recent updates from logs
  const updatesContainer = document.getElementById('recent-updates');
  if (!logs || logs.length === 0) {
    updatesContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: #6b7280;">Nenhum log recente.</div>';
  } else {
    logs.slice(0, 5).forEach(l => {
      updatesContainer.innerHTML += Components.updateItem({
        icon: Components.icon('info', 18),
        iconBg: '#CFFAFE',
        title: l.acao || 'Log',
        subtitle: l.detalhes || '',
        badge: l.data ? new Date(l.data).toLocaleDateString('pt-BR') : '',
        badgeColor: '#E5E7EB'
      });
    });
  }
  
  // Render best campaigns
  const bestCampaigns = document.getElementById('best-campaigns');
  if (!campanhas || campanhas.length === 0) {
    bestCampaigns.innerHTML = '<div style="padding: 16px; text-align: center; color: #6b7280;">Nenhuma campanha encontrada.</div>';
  } else {
    campanhas.slice(0, 3).forEach((c, index) => {
      const colors = ['#2D9B5A', '#DC2626', '#3B82F6'];
      const bgColor = colors[index % colors.length];
      bestCampaigns.innerHTML += `
        <div class="campaign-perf-item" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;">
          <div style="width:40px;height:40px;border-radius:10px;background:${bgColor};display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">📢</div>
          <div style="flex:1;">
            <div style="font-weight:600;font-size:13px;">${c.nome || '-'}</div>
            <div style="font-size:12px;color:#6B7280;">${c.totens || 0} totens</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:13px;font-weight:600;">${(c.exibicoes || 0).toLocaleString('pt-BR')} exibições</div>
            <div style="font-size:12px;color:#10B981;">CTR ${(c.ctr || 0).toFixed(2).replace('.', ',')}%</div>
          </div>
        </div>
      `;
    });
  }
  
  // Render Leaflet map
  setTimeout(() => {
    renderDashboardMap(totens);
  }, 200);
};

function renderDashboardMap(totens) {
  const container = document.getElementById('dashboard-map');
  if (!container || !window.L) return;

  // Initialize Leaflet Map
  const map = L.map('dashboard-map').setView([-20.2108, -40.2573], 12);
  
  // CartoDB Dark Tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);

  // Add markers
  totens.forEach(t => {
    const lat = t.latitude || -20.2108;
    const lng = t.longitude || -40.2573;
    
    let color = '#F59E0B'; // instalacao
    if (t.status === 'online') color = '#10B981';
    else if (t.status === 'offline') color = '#EF4444';
    
    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      fillColor: color,
      color: '#fff',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(map);
    
    marker.bindPopup(`<b>${t.nome || 'Totem'}</b><br/>Status: ${t.status}`);
  });
}
