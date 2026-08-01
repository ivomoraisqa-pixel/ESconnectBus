window.Pages = window.Pages || {};
window.Pages.usuarios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const usuarios = await AppData.getUsuarios();

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Usuários</h1>
        <p>Gerenciamento de acessos ao sistema</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addUsuario()">
          ${window.Components.icon ? window.Components.icon('user-plus', 16) : ''} Novo Usuário
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Total Usuários', 12, 'users', 'blue') : '<div class="kpi-card">Total: 12</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Ativos', 10, 'user-check', 'green') : '<div class="kpi-card">Ativos: 10</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Administradores', 2, 'shield', 'purple') : '<div class="kpi-card">Admins: 2</div>'}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 style="margin:0;">Lista de Usuários</h3>
      </div>
      <div class="card-body">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Último Acesso</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.map(u => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; display:flex; align-items:center; gap:10px;">
                  <div style="width:32px; height:32px; border-radius:50%; background:#3b82f6; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold;">${u.nome.charAt(0)}</div>
                  <strong>${u.nome}</strong>
                </td>
                <td>${u.email}</td>
                <td><span style="background:#e2e8f0; padding:4px 8px; border-radius:12px; font-size:0.85em;">${u.perfil}</span></td>
                <td>${window.Components.badge ? window.Components.badge(u.status) : u.status}</td>
                <td>${u.acesso}</td>
                <td style="text-align: right;">
                  <button class="btn-icon" title="Editar">${window.Components.icon ? window.Components.icon('edit', 16) : 'Edit'}</button>
                  <button class="btn-icon" title="Excluir" style="color:#ef4444;">${window.Components.icon ? window.Components.icon('trash', 16) : 'Del'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addUsuario = function() {
    alert('Modal: Adicionar Usuário');
  };
};
