window.Pages = window.Pages || {};
window.Pages.playlists = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const playlists = window.AppData ? await window.AppData.getPlaylists() : [
    {nome: 'Terminal Central - Padrão', itens: 5, totens: 12, duracao: '2m 30s', status: 'ativa'},
    {nome: 'Campanha Fim de Ano', itens: 2, totens: 32, duracao: '1m 00s', status: 'pausada'}
  ];

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Playlists</h1>
        <p>Agrupamento e ordem de exibição de anúncios</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addPlaylist()">
          ${window.Components.icon ? window.Components.icon('list', 16) : ''} Nova Playlist
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Total Playlists', 15, 'list', 'blue') : '<div class="kpi-card">Total: 15</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Itens Médios/Playlist', 4.5, 'layers', 'purple') : '<div class="kpi-card">Média Itens: 4.5</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Totens Vinculados', 32, 'monitor', 'green') : '<div class="kpi-card">Totens: 32</div>'}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 style="margin:0;">Gerenciar Playlists</h3>
      </div>
      <div class="card-body">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th>Nome da Playlist</th>
              <th>Itens</th>
              <th>Totens Vínculados</th>
              <th>Duração Total</th>
              <th>Status</th>
              <th style="text-align: right;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${playlists.map(p => `
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0;"><strong>${p.nome}</strong></td>
                <td>${p.itens}</td>
                <td>${p.totens}</td>
                <td>${p.duracao}</td>
                <td>${window.Components.badge ? window.Components.badge(p.status) : p.status}</td>
                <td style="text-align: right;">
                  ${window.Components.actionButtons ? window.Components.actionButtons([
                    {icon: 'list', title: 'Gerenciar Itens', action: `console.log('itens')`},
                    {icon: 'edit', title: 'Editar', action: `console.log('edit')`}
                  ]) : '<button class="btn btn-secondary">Editar</button>'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addPlaylist = function() {
    alert('Criar nova playlist modal');
  };
};
