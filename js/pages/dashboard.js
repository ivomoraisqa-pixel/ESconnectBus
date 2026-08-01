window.Pages = window.Pages || {};
Pages.dashboard = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  const stats = await window.AppData.getDashboardStats();
  const totens = await window.AppData.getTotens();
  const atualizacoes = await window.AppData.getAtualizacoes();
  const campanhas = await window.AppData.getCampanhas();
  
  main.innerHTML = `
    <!-- KPI Row: 5 cards -->
    <div class="kpi-row">
      ${Components.kpiCard({
        icon: Components.icon('monitor', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        title: 'Totens Ativos',
        value: '28',
        subtitle: 'de 32 totens',
        extra: '<div style="background:#E5E7EB;height:6px;border-radius:3px;margin-top:12px;"><div style="background:#10B981;height:100%;width:87.5%;border-radius:3px;"></div></div>',
        tag: '87.5% online',
        tagColor: '#10B981',
        borderColor: '#10B981'
      })}
      ${Components.kpiCard({
        icon: Components.icon('bar-chart', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        title: 'Exibições Hoje',
        value: '152.430',
        trend: 'up',
        trendValue: '+12,5%',
        subtitle: 'vs. ontem',
        variant: 'blue'
      })}
      ${Components.kpiCard({
        icon: Components.icon('bus', 24),
        iconBg: '#FEF3C7',
        iconColor: '#92400E',
        title: 'Linhas Ativas',
        value: '45',
        subtitle: '5 atualizações hoje',
        variant: 'orange'
      })}
      ${Components.kpiCard({
        icon: Components.icon('megaphone', 24),
        iconBg: '#FCE7F3',
        iconColor: '#9D174D',
        title: 'Campanhas Ativas',
        value: '12',
        subtitle: '3 terminam hoje',
        variant: 'red'
      })}
      ${Components.kpiCard({
        icon: Components.icon('alert-triangle', 24),
        iconBg: '#FEE2E2',
        iconColor: '#991B1B',
        title: 'Alertas',
        value: '3',
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
            <div id="dashboard-map"></div>
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
      { label: 'Online', value: 28, color: '#10B981' },
      { label: 'Offline', value: 3, color: '#EF4444' },
      { label: 'Instalação', value: 1, color: '#F59E0B' }
    ], { text: '28', subtext: 'Total' });
  }, 100);
  
  // Render status legend
  document.getElementById('status-legend').innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;">
      <div class="legend-item" style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:8px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#10B981"></span> Online</span> <strong>28 <span style="color:#6B7280;font-weight:400;">(87,5%)</span></strong></div>
      <div class="legend-item" style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:8px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#EF4444"></span> Offline</span> <strong>3 <span style="color:#6B7280;font-weight:400;">(9,4%)</span></strong></div>
      <div class="legend-item" style="display:flex;justify-content:space-between;"><span style="display:flex;align-items:center;gap:8px;"><span class="status-dot" style="width:10px;height:10px;border-radius:50%;background:#F59E0B"></span> Instalação</span> <strong>1 <span style="color:#6B7280;font-weight:400;">(3,1%)</span></strong></div>
    </div>
  `;
  
  // Render recent totems
  const tbody = document.getElementById('recent-totems-body');
  totens.slice(0, 5).forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td>${t.nome}</td>
        <td>${t.localizacao}</td>
        <td>${Components.badge(t.status)}</td>
        <td>${t.ultimaConexao}</td>
        <td>${t.versao}</td>
        <td>${Components.actionButtons([{icon:'eye',title:'Ver'},{icon:'edit',title:'Editar'},{icon:'settings',title:'Config'}])}</td>
      </tr>
    `;
  });
  
  // Render recent updates
  const updatesContainer = document.getElementById('recent-updates');
  atualizacoes.forEach(u => {
    const iconBg = u.tipo === 'linha' ? '#DBEAFE' : u.tipo === 'mapa' ? '#EDE9FE' : u.tipo === 'campanha' ? '#FEF3C7' : '#CFFAFE';
    const iconSvg = u.tipo === 'linha' ? Components.icon('bus', 18) : u.tipo === 'mapa' ? Components.icon('map-pin', 18) : u.tipo === 'campanha' ? Components.icon('megaphone', 18) : Components.icon('info', 18);
    updatesContainer.innerHTML += Components.updateItem({
      icon: iconSvg,
      iconBg: iconBg,
      title: u.titulo,
      subtitle: u.descricao,
      badge: u.badge,
      badgeColor: u.badgeColor
    });
  });
  
  // Render best campaigns
  const bestCampaigns = document.getElementById('best-campaigns');
  campanhas.slice(0, 3).forEach(c => {
    bestCampaigns.innerHTML += `
      <div class="campaign-perf-item" style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;">
        <div style="width:40px;height:40px;border-radius:10px;background:${c.id===1?'#2D9B5A':c.id===2?'#DC2626':c.id===3?'#3B82F6':'#6B7280'};display:flex;align-items:center;justify-content:center;color:white;font-size:16px;">📢</div>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:13px;">${c.nome}</div>
          <div style="font-size:12px;color:#6B7280;">${c.totens} totens</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px;font-weight:600;">${(c.exibicoes || 0).toLocaleString('pt-BR')} exibições</div>
          <div style="font-size:12px;color:#10B981;">CTR ${(c.ctr || 0).toFixed(2).replace('.', ',')}%</div>
        </div>
      </div>
    `;
  });
  
  // Render simple map
  renderDashboardMap(totens);
};

function renderDashboardMap(totens) {
  const container = document.getElementById('dashboard-map');
  if (!container) return;
  const mapHtml = `
    <svg width="100%" height="100%" viewBox="0 0 400 300" style="background:#e8f4f0;">
      <rect width="400" height="300" fill="#E8F0E8" rx="8"/>
      <line x1="50" y1="100" x2="350" y2="150" stroke="#ccc" stroke-width="2"/>
      <line x1="100" y1="50" x2="200" y2="280" stroke="#ccc" stroke-width="2"/>
      <line x1="200" y1="30" x2="350" y2="200" stroke="#ccc" stroke-width="1.5"/>
      <text x="80" y="80" font-size="11" fill="#666" font-family="Inter, sans-serif">SERRA</text>
      <text x="280" y="200" font-size="11" fill="#666" font-family="Inter, sans-serif">VITÓRIA</text>
      <text x="180" y="260" font-size="10" fill="#888" font-family="Inter, sans-serif">MANGUEIRAL</text>
      ${totens.slice(0, 15).map((t, i) => {
        const x = 60 + (i * 22) % 280;
        const y = 60 + (i * 37) % 200;
        const color = t.status === 'online' ? '#10B981' : t.status === 'offline' ? '#EF4444' : '#F59E0B';
        return `<circle cx="${x}" cy="${y}" r="5" fill="${color}" stroke="white" stroke-width="2"/>`;
      }).join('')}
    </svg>
  `;
  container.innerHTML = mapHtml;
  container.style.height = '100%';
}
