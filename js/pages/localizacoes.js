window.Pages = window.Pages || {};
window.Pages.localizacoes = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Localizações</h1>
        <p>Mapa e endereços dos totens instalados</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addLocalizacao()">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Nova Localização
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Total Localizações', 45, 'map-pin', 'blue') : '<div class="kpi-card">Total: 45</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Cobertura', '82%', 'globe', 'green') : '<div class="kpi-card">Cobertura: 82%</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Novos Pontos', 3, 'plus', 'purple') : '<div class="kpi-card">Novos: 3</div>'}
    </div>

    <div class="grid-2" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;">Mapa de Distribuição</h3>
        </div>
        <div class="card-body" style="padding:0; background:#f0f2f5; min-height:400px; position:relative; overflow:hidden;">
          <!-- SVG Map Simulation -->
          <svg width="100%" height="400" viewBox="0 0 800 400" style="background:#e5e9f0;">
            <path d="M100,50 Q200,10 300,80 T500,50 T700,100" fill="none" stroke="#ccc" stroke-width="2"/>
            <circle cx="150" cy="60" r="6" fill="#10B981" />
            <circle cx="280" cy="75" r="6" fill="#10B981" />
            <circle cx="450" cy="55" r="6" fill="#EF4444" />
            <circle cx="650" cy="90" r="6" fill="#10B981" />
            <text x="160" y="65" font-size="12" fill="#333">Terminal Laranjeiras</text>
            <text x="290" y="80" font-size="12" fill="#333">Praça Encontro</text>
            <text x="460" y="60" font-size="12" fill="#333">Shopping Montserrat</text>
          </svg>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;">Lista de Endereços</h3>
        </div>
        <div class="card-body" style="padding: 0;">
          <ul style="list-style:none; margin:0; padding:0;">
            <li style="padding: 15px; border-bottom: 1px solid #eee; display:flex; align-items:center; gap:10px;">
              ${window.Components.icon ? window.Components.icon('map-pin', 20) : ''}
              <div>
                <strong>Terminal Laranjeiras</strong><br>
                <small style="color:#666;">Av. Eudes Scherrer Souza</small>
              </div>
            </li>
            <li style="padding: 15px; border-bottom: 1px solid #eee; display:flex; align-items:center; gap:10px;">
              ${window.Components.icon ? window.Components.icon('map-pin', 20) : ''}
              <div>
                <strong>Praça Encontro das Águas</strong><br>
                <small style="color:#666;">Jacaraípe, Serra - ES</small>
              </div>
            </li>
            <li style="padding: 15px; border-bottom: 1px solid #eee; display:flex; align-items:center; gap:10px;">
              ${window.Components.icon ? window.Components.icon('map-pin', 20) : ''}
              <div>
                <strong>Shopping Montserrat</strong><br>
                <small style="color:#666;">Colina de Laranjeiras</small>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addLocalizacao = function() {
    alert('Abrir modal de Nova Localização');
  };
};
