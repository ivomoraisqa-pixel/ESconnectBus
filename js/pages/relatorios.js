window.Pages = window.Pages || {};
window.Pages.relatorios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const stats = await AppData.getDashboardStats();

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Relatórios & Analytics</h1>
        <p>Métricas de exibição e performance das campanhas</p>
      </div>
      <div class="page-actions" style="display:flex; gap:10px;">
        <button class="btn btn-secondary">${window.Components.icon ? window.Components.icon('download', 16) : ''} Exportar CSV</button>
        <button class="btn btn-primary">${window.Components.icon ? window.Components.icon('printer', 16) : ''} Imprimir</button>
      </div>
    </div>
    
    <!-- Filtros -->
    <div class="card" style="margin-bottom:20px;">
      <div class="card-body" style="display:flex; gap:15px; flex-wrap:wrap;">
        <div style="flex:1; min-width:200px;">
          <label style="display:block; font-size:0.85em; font-weight:bold; margin-bottom:5px;">Período</label>
          <select class="form-select" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <option>Últimos 7 dias</option>
            <option>Últimos 30 dias</option>
            <option>Este Mês</option>
          </select>
        </div>
        <div style="flex:1; min-width:200px;">
          <label style="display:block; font-size:0.85em; font-weight:bold; margin-bottom:5px;">Totem</label>
          <select class="form-select" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <option>Todos os Totens</option>
            <option>Terminal Laranjeiras</option>
          </select>
        </div>
        <div style="flex:1; min-width:200px;">
          <label style="display:block; font-size:0.85em; font-weight:bold; margin-bottom:5px;">Campanha</label>
          <select class="form-select" style="width:100%; padding:8px; border:1px solid #ccc; border-radius:4px;">
            <option>Todas as Campanhas</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="kpi-row grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Exibições Total', '1.2M', 'eye', 'blue') : '<div class="kpi-card">1.2M</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Interações', '45.3k', 'pointer', 'green') : '<div class="kpi-card">45.3k</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('CTR Médio', '3.8%', 'percent', 'orange') : '<div class="kpi-card">3.8%</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Tempo Médio', '14s', 'clock', 'purple') : '<div class="kpi-card">14s</div>'}
    </div>

    <div class="grid-2" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom:20px;">
      <div class="card">
        <div class="card-header"><h3 style="margin:0;">Exibições ao longo do tempo</h3></div>
        <div class="card-body" style="height:300px; background:#f8fafc; display:flex; align-items:flex-end; justify-content:space-around; padding:20px;">
          <!-- Fake Line Chart -->
          <div style="width:40px; height:40%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
          <div style="width:40px; height:50%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
          <div style="width:40px; height:30%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
          <div style="width:40px; height:70%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
          <div style="width:40px; height:85%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
          <div style="width:40px; height:60%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
          <div style="width:40px; height:90%; background:#3b82f6; border-radius:4px 4px 0 0;"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3 style="margin:0;">Top Campanhas</h3></div>
        <div class="card-body">
          <ul style="list-style:none; padding:0; margin:0;">
            <li style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Verão Seguro</span><span>45%</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;"><div style="width:45%; height:100%; background:#10b981;"></div></div>
            </li>
            <li style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Prefeitura Info</span><span>30%</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;"><div style="width:30%; height:100%; background:#3b82f6;"></div></div>
            </li>
            <li style="margin-bottom:15px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Guia Turístico</span><span>15%</span></div>
              <div style="height:8px; background:#e2e8f0; border-radius:4px; overflow:hidden;"><div style="width:15%; height:100%; background:#f59e0b;"></div></div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;

  main.innerHTML = html;
};
