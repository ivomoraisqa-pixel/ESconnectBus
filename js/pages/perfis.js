window.Pages = window.Pages || {};
window.Pages.perfis = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const perfis = await AppData.getPerfis();

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Perfis e Permissões</h1>
        <p>Controle de acesso granular por módulo</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addPerfil()">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Novo Perfil
        </button>
      </div>
    </div>
    
    <div class="grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px;">
      ${perfis.map(p => `
        <div class="card" style="border-top: 4px solid ${p.color};">
          <div class="card-body">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
              <h3 style="margin:0;">${p.nome}</h3>
              <div style="background:#f1f5f9; padding:4px 8px; border-radius:12px; font-size:0.85em; font-weight:bold;">${p.users} usuários</div>
            </div>
            <p style="color:#64748b; font-size:0.9em; margin-bottom:20px;">${p.desc}</p>
            <div style="display:flex; gap:10px;">
              <button class="btn btn-secondary" style="flex:1;">Editar Permissões</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 style="margin:0;">Matriz de Permissões</h3>
      </div>
      <div class="card-body">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Módulo</th>
              <th style="text-align:center;">Administrador</th>
              <th style="text-align:center;">Operador</th>
              <th style="text-align:center;">Anunciante</th>
            </tr>
          </thead>
          <tbody>
            ${['Totens','Linhas e Horários','Mapas','Anúncios e Mídia','Relatórios','Configurações'].map(mod => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 15px 0;"><strong>${mod}</strong></td>
                <td style="text-align:center;"><input type="checkbox" checked disabled></td>
                <td style="text-align:center;"><input type="checkbox" ${mod !== 'Configurações' ? 'checked' : ''} disabled></td>
                <td style="text-align:center;"><input type="checkbox" ${mod === 'Anúncios e Mídia' || mod === 'Relatórios' ? 'checked' : ''} disabled></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addPerfil = function() {
    alert('Modal: Novo Perfil');
  };
};
