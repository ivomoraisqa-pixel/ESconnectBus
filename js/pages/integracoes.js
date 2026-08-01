window.Pages = window.Pages || {};
window.Pages.integracoes = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const integracoes = await AppData.getIntegracoes();

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Integrações (APIs)</h1>
        <p>Conexões com serviços externos e fontes de dados</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="alert('Modal: Nova API')">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Adicionar Conexão
        </button>
      </div>
    </div>
    
    <div class="grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
      ${integracoes.map(i => `
        <div class="card">
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
              <div style="width:48px; height:48px; background:#f1f5f9; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#3b82f6;">
                ${window.Components.icon ? window.Components.icon('link', 24) : 'API'}
              </div>
              ${window.Components.badge ? window.Components.badge(i.status) : i.status}
            </div>
            <h3 style="margin:0 0 5px 0;">${i.nome}</h3>
            <p style="color:#64748b; font-size:0.9em; margin:0 0 15px 0;">${i.tipo}</p>
            <div style="font-size:0.85em; color:#94a3b8; margin-bottom:20px;">Última sincronização: ${i.sync}</div>
            
            <div style="display:flex; gap:10px; border-top:1px solid #eee; padding-top:15px;">
              <button class="btn btn-secondary" style="flex:1;">Configurar</button>
              <button class="btn btn-secondary btn-icon" title="Testar Conexão">${window.Components.icon ? window.Components.icon('refresh-cw', 16) : 'T'}</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  main.innerHTML = html;
};
