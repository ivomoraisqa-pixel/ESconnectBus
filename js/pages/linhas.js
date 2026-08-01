window.Pages = window.Pages || {};
window.Pages.linhas = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const appLinhas = await window.AppData.getLinhas();
  const linhas = appLinhas ? appLinhas.slice(0, 15) : [
    {numero:'503', nome:'T. Laranjeiras / T. Vila Velha', status:'ativa', update:'10 min atrás'},
    {numero:'800', nome:'T. Laranjeiras / T. Jacaraípe', status:'ativa', update:'2 min atrás'},
    {numero:'878', nome:'T. Laranjeiras / Colina', status:'inativa', update:'1 dia atrás'}
  ];

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Linhas de Ônibus</h1>
        <p>Gerenciamento das rotas e itinerários</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addLinha()">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Nova Linha
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Total Linhas', 45, 'map', 'blue') : '<div class="kpi-card">Total: 45</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Linhas Ativas', 42, 'check', 'green') : '<div class="kpi-card">Ativas: 42</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Atualizações Hoje', 156, 'refresh-cw', 'purple') : '<div class="kpi-card">Atualizações: 156</div>'}
    </div>

    <div class="card">
      <div class="card-header filter-bar" style="display: flex; gap: 10px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex: 1;">
          ${window.Components.searchBar ? window.Components.searchBar('Buscar linha...', 'search-linhas') : '<input type="text" placeholder="Buscar linha...">'}
          ${window.Components.filterSelect ? window.Components.filterSelect('filter-status-linha', [{value:'', label:'Todos Status'},{value:'ativa', label:'Ativa'},{value:'inativa', label:'Inativa'}], 'Status') : ''}
        </div>
      </div>
      <div class="card-body">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Número</th>
              <th>Nome / Destino</th>
              <th>Status</th>
              <th>Última Atualização</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${linhas.map(l => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;"><span style="background:#0F172A; color:#fff; padding:4px 8px; border-radius:4px; font-weight:bold;">${l.numero || 'N/A'}</span></td>
                <td><strong>${l.nome || '-'}</strong></td>
                <td>${window.Components.badge ? window.Components.badge(l.status) : l.status}</td>
                <td>${l.update || l.ultimaAtualizacao || '-'}</td>
                <td style="text-align: right;">
                  ${window.Components.actionButtons ? window.Components.actionButtons([
                    {icon: 'eye', title: 'Ver detalhes', action: `console.log('view')`},
                    {icon: 'edit', title: 'Editar', action: `console.log('edit')`},
                  ]) : '<button class="btn btn-secondary">Ações</button>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="card-footer" style="padding-top: 15px;">
        ${window.Components.pagination ? window.Components.pagination(1, 4) : ''}
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addLinha = function() {
    alert('Modal de adicionar linha');
  };
};
