window.Pages = window.Pages || {};
window.Pages.linhas = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const appLinhas = (await window.AppData.getLinhas()) || [];
  const totalLinhas = appLinhas.length;
  const ativas = appLinhas.filter(l => l.status === 'ativa').length;

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Linhas de Ônibus</h1>
        <p>Gerenciamento das rotas e itinerários municipais e metropolitanos da Serra</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.addLinha()">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Nova Linha
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Total de Linhas',
        value: totalLinhas.toString(),
        subtitle: 'Cadastradas no Sistema',
        icon: window.Components.icon('bus', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        borderColor: '#3B82F6'
      }) : `<div class="kpi-card">Total: ${totalLinhas}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Linhas em Operação',
        value: ativas.toString(),
        subtitle: 'Ativas nos Totens',
        icon: window.Components.icon('check', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        borderColor: '#10B981'
      }) : `<div class="kpi-card">Ativas: ${ativas}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Integração Transcol',
        value: '100%',
        subtitle: 'Conexão em Tempo Real',
        icon: window.Components.icon('refresh-cw', 24),
        iconBg: '#EDE9FE',
        iconColor: '#6B21A8',
        borderColor: '#8B5CF6'
      }) : '<div class="kpi-card">Integração: 100%</div>'}
    </div>

    <div class="card">
      <div class="card-header filter-bar" style="display: flex; gap: 10px; align-items: center; justify-content: space-between;">
        <div style="display: flex; gap: 10px; flex: 1;">
          <input type="text" id="search-linhas-input" class="form-input" placeholder="Buscar por número ou nome da linha..." oninput="window.filterLinhasTable()" style="max-width:350px;">
        </div>
      </div>
      <div class="card-body" style="padding:0; overflow-x:auto;">
        <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding:14px 20px;">Linha</th>
              <th>Itinerário / Destino</th>
              <th>Cor Identificadora</th>
              <th>Status</th>
              <th style="text-align: right; padding-right:20px;">Ações</th>
            </tr>
          </thead>
          <tbody id="linhas-table-body">
            ${appLinhas.length === 0 ? `
              <tr><td colspan="5" style="text-align:center; padding:30px; color:#6b7280;">Nenhuma linha encontrada no banco de dados.</td></tr>
            ` : appLinhas.map(l => {
              const cor = l.cor || '#2D9B5A';
              return `
                <tr style="border-bottom: 1px solid #F3F4F6;" class="linha-row" data-search="${(l.numero + ' ' + l.nome).toLowerCase()}">
                  <td style="padding: 12px 20px;">
                    <span style="background:${cor}; color:#fff; padding:6px 12px; border-radius:6px; font-weight:700; font-size:13px; display:inline-block; min-width:48px; text-align:center;">
                      ${l.numero || l.route_id || 'N/A'}
                    </span>
                  </td>
                  <td><strong>${l.nome || 'Linha Transcol'}</strong></td>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="width:14px; height:14px; border-radius:50%; background:${cor}; display:inline-block; border:1px solid #ccc;"></span>
                      <span style="font-size:12px; color:#64748b;">${cor}</span>
                    </div>
                  </td>
                  <td>${window.Components.badge ? window.Components.badge(l.status || 'ativa') : (l.status || 'ativa')}</td>
                  <td style="text-align: right; padding-right:20px;">
                    <button class="btn-icon" title="Ver no Mapa" onclick="window.Router.navigate('mapa-operacional')">${window.Components.icon ? window.Components.icon('eye', 16) : 'Ver'}</button>
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

  window.filterLinhasTable = function() {
    const q = (document.getElementById('search-linhas-input')?.value || '').toLowerCase();
    document.querySelectorAll('.linha-row').forEach(row => {
      const txt = row.getAttribute('data-search') || '';
      row.style.display = txt.includes(q) ? '' : 'none';
    });
  };

  window.addLinha = function() {
    alert('As linhas são sincronizadas automaticamente com a API oficial CETURB / Transcol.');
  };
};
