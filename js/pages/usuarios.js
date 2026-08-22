window.Pages = window.Pages || {};
window.Pages.usuarios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const usuarios = (await window.AppData.getUsuarios()) || [];
  const total = usuarios.length;
  const ativos = usuarios.filter(u => u.status === 'ativo').length;
  const admins = usuarios.filter(u => (u.perfil || '').toLowerCase().includes('admin')).length;

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Usuários e Operadores</h1>
        <p>Gerenciamento de acessos e credenciais do SerraBus Conect</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addUsuario()">
          ${window.Components.icon ? window.Components.icon('user-plus', 16) : ''} Novo Usuário
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Total de Usuários',
        value: total.toString(),
        subtitle: 'Cadastrados no Sistema',
        icon: window.Components.icon('users', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        borderColor: '#3B82F6'
      }) : `<div class="kpi-card">Total: ${total}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Usuários Ativos',
        value: ativos.toString(),
        subtitle: 'Com Acesso Liberado',
        icon: window.Components.icon('check', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        borderColor: '#10B981'
      }) : `<div class="kpi-card">Ativos: ${ativos}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Administradores',
        value: admins.toString(),
        subtitle: 'Acesso Total',
        icon: window.Components.icon('shield', 24),
        iconBg: '#EDE9FE',
        iconColor: '#6B21A8',
        borderColor: '#8B5CF6'
      }) : `<div class="kpi-card">Admins: ${admins}</div>`}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 style="margin:0;">Lista de Usuários</h3>
      </div>
      <div class="card-body" style="padding:0; overflow-x:auto;">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding:14px 20px;">Nome</th>
              <th>E-mail</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Último Acesso</th>
              <th style="text-align: right; padding-right:20px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${usuarios.length === 0 ? `
              <tr><td colspan="6" style="text-align:center; padding:30px; color:#6B7280;">Nenhum usuário cadastrado.</td></tr>
            ` : usuarios.map(u => {
              const ultimoAcesso = u.ultimo_acesso ? new Date(u.ultimo_acesso).toLocaleString('pt-BR') : 'Nunca';
              return `
                <tr style="border-bottom: 1px solid #F3F4F6;">
                  <td style="padding: 12px 20px; display:flex; align-items:center; gap:10px;">
                    <div style="width:36px; height:36px; border-radius:50%; background:#2D9B5A; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:14px;">
                      ${(u.nome || 'U').charAt(0).toUpperCase()}
                    </div>
                    <strong>${u.nome || 'Usuário'}</strong>
                  </td>
                  <td>${u.email || '-'}</td>
                  <td><span style="background:#F1F5F9; color:#475569; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:600;">${u.perfil || 'Operador'}</span></td>
                  <td>${window.Components.badge ? window.Components.badge(u.status || 'ativo') : (u.status || 'ativo')}</td>
                  <td style="color:#64748B; font-size:13px;">${ultimoAcesso}</td>
                  <td style="text-align: right; padding-right:20px;">
                    <button class="btn-icon" title="Editar">${window.Components.icon ? window.Components.icon('edit', 16) : 'Edit'}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addUsuario = function() {
    alert('Para cadastrar novos operadores, acesse a gestão de permissões ou Supabase Auth.');
  };
};
