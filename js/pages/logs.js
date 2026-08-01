window.Pages = window.Pages || {};
window.Pages.logs = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const logs = await AppData.getLogs();

  const getColor = (tipo) => {
    switch(tipo) {
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Logs do Sistema</h1>
        <p>Registro de eventos, erros e auditoria de ações</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-secondary">
          ${window.Components.icon ? window.Components.icon('download', 16) : ''} Exportar Logs
        </button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header filter-bar" style="display: flex; gap: 10px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex: 1;">
          <input type="text" placeholder="Buscar em logs..." class="form-input" style="padding:8px; border:1px solid #ccc; border-radius:4px; min-width:250px;">
          <select class="form-select" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
            <option>Todos os Tipos</option>
            <option>Erros (Error)</option>
            <option>Avisos (Warning)</option>
            <option>Informativos (Info)</option>
            <option>Sucesso (Success)</option>
          </select>
          <input type="date" class="form-input" style="padding:8px; border:1px solid #ccc; border-radius:4px;">
        </div>
      </div>
      <div class="card-body">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse; font-family: monospace; font-size: 0.9em;">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Tipo</th>
              <th>Mensagem</th>
              <th>Usuário / Origem</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(l => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; color:#64748b;">${l.data}</td>
                <td>
                  <span style="background:${getColor(l.tipo)}20; color:${getColor(l.tipo)}; padding:2px 8px; border-radius:12px; font-weight:bold; text-transform:uppercase; font-size:0.8em;">
                    ${l.tipo}
                  </span>
                </td>
                <td>${l.msg}</td>
                <td>${l.user}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-footer" style="padding-top: 15px;">
        ${window.Components.pagination ? window.Components.pagination(1, 10) : ''}
      </div>
    </div>
  `;

  main.innerHTML = html;
};
