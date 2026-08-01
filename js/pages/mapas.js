window.Pages = window.Pages || {};
window.Pages.mapas = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  const totens = window.AppData ? await window.AppData.getTotens() : [];
  const linhas = window.AppData ? await window.AppData.getLinhas() : [];

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Mapas e Pontos</h1>
        <p>Gestão visual de paradas e rotas</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addPonto()">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Adicionar Ponto
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Total Pontos', 350, 'map-pin', 'blue') : '<div class="kpi-card">Pontos: 350</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Rotas Mapeadas', 45, 'git-commit', 'green') : '<div class="kpi-card">Rotas: 45</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Cobertura', '100%', 'check-circle', 'purple') : '<div class="kpi-card">Cobertura: 100%</div>'}
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <div class="card-header">
        <h3 style="margin:0;">Visualização de Rede</h3>
      </div>
      <div class="card-body" style="padding:0; background:#e2e8f0; height:450px; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden;">
        <!-- Simulated Large Map -->
        <svg width="100%" height="100%" viewBox="0 0 1000 500" style="background:#cbd5e1;">
          <!-- Routes -->
          <path d="M50,250 C200,400 400,100 600,300 S900,100 950,250" fill="none" stroke="#3b82f6" stroke-width="4" stroke-dasharray="5,5"/>
          <path d="M100,100 Q400,150 500,250 T800,400" fill="none" stroke="#10b981" stroke-width="4"/>
          <!-- Stops -->
          <g fill="#0f172a" stroke="#fff" stroke-width="2">
            <circle cx="50" cy="250" r="8"/>
            <circle cx="280" cy="220" r="8"/>
            <circle cx="500" cy="250" r="10" fill="#ef4444"/> <!-- Terminal -->
            <circle cx="600" cy="300" r="8"/>
            <circle cx="950" cy="250" r="8"/>
            
            <circle cx="100" cy="100" r="8"/>
            <circle cx="800" cy="400" r="8"/>
          </g>
        </svg>
        <div style="position:absolute; top:20px; right:20px; background:#fff; padding:10px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <div style="display:flex; align-items:center; gap:5px; margin-bottom:5px;"><div style="width:12px; height:12px; border-radius:50%; background:#ef4444;"></div> Terminais</div>
          <div style="display:flex; align-items:center; gap:5px;"><div style="width:12px; height:12px; border-radius:50%; background:#0f172a;"></div> Pontos Comuns</div>
        </div>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addPonto = function() {
    alert('Modal: Adicionar Novo Ponto de Ônibus');
  };
};
