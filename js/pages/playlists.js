window.Pages = window.Pages || {};
window.Pages.playlists = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const playlists = window.AppData ? (await window.AppData.getPlaylists() || []) : [];
  const totens = window.AppData ? (await window.AppData.getTotens() || []) : [];
  const total = playlists.length;
  const totensCount = totens.length;

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Playlists de Mídia</h1>
        <p>Agrupamento e ordem de veiculação de anúncios para os totens</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.Router.navigate('campanhas')">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Gerenciar Campanhas
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Total de Playlists',
        value: total.toString(),
        subtitle: 'Grades Programadas',
        icon: window.Components.icon('list', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        borderColor: '#3B82F6'
      }) : `<div class="kpi-card">Total: ${total}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Totens Vinculados',
        value: totensCount.toString(),
        subtitle: 'Dispositivos no Ar',
        icon: window.Components.icon('monitor', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        borderColor: '#10B981'
      }) : `<div class="kpi-card">Totens: ${totensCount}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Modo de Reprodução',
        value: 'Dinâmico',
        subtitle: 'GPS & Segmentação',
        icon: window.Components.icon('layers', 24),
        iconBg: '#EDE9FE',
        iconColor: '#6B21A8',
        borderColor: '#8B5CF6'
      }) : '<div class="kpi-card">Modo: Dinâmico</div>'}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 style="margin:0;">Grades de Exibição Ativas</h3>
      </div>
      <div class="card-body" style="padding:0; overflow-x:auto;">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding:14px 20px;">Nome da Playlist</th>
              <th>Itens</th>
              <th>Totens Vinculados</th>
              <th>Duração Total</th>
              <th>Status</th>
              <th style="text-align: right; padding-right:20px;">Ações</th>
            </tr>
          </thead>
          <tbody>
            ${playlists.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align:center; padding:32px; color:#6B7280;">
                  <div style="font-size:24px; margin-bottom:8px;">📋</div>
                  Nenhuma playlist personalizada criada. A veiculação opera no modo <strong>Direcionamento por Campanha</strong>.
                </td>
              </tr>
            ` : playlists.map(p => `
              <tr style="border-bottom: 1px solid #F3F4F6;">
                <td style="padding: 12px 20px;"><strong>${p.nome}</strong></td>
                <td>${p.itens || 0}</td>
                <td>${p.totens || totensCount}</td>
                <td>${p.duracao || '2m 00s'}</td>
                <td>${window.Components.badge ? window.Components.badge(p.status || 'ativa') : (p.status || 'ativa')}</td>
                <td style="text-align: right; padding-right:20px;">
                  <button class="btn-icon" title="Editar">${window.Components.icon ? window.Components.icon('edit', 16) : 'Edit'}</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  main.innerHTML = html;
};
