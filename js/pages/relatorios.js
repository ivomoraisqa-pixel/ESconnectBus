window.Pages = window.Pages || {};
window.Pages.relatorios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const stats = await AppData.getDashboardStats();
  const campanhas = await AppData.getCampanhas();
  const totalExibicoes = campanhas.reduce((acc, curr) => acc + (curr.exibicoes || 0), 0);

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Relatórios & Analytics</h1>
        <p>Métricas reais de exibição das campanhas</p>
      </div>
      <div class="page-actions" style="display:flex; gap:10px;">
        <button class="btn btn-secondary">${window.Components && window.Components.icon ? window.Components.icon('download', 16) : '⬇️'} Exportar CSV</button>
        <button class="btn btn-primary" onclick="window.print()">${window.Components && window.Components.icon ? window.Components.icon('printer', 16) : '🖨️'} Imprimir</button>
      </div>
    </div>
    
    <div class="kpi-row grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components && window.Components.kpiCard ? window.Components.kpiCard({icon: window.Components.icon('eye', 24), iconBg: '#DBEAFE', iconColor: '#1E40AF', title: 'Exibições Total', value: totalExibicoes.toLocaleString(), subtitle: 'Todas campanhas', borderColor: '#3B82F6'}) : '<div class="card"><div class="card-body">Exibições Total: ' + totalExibicoes + '</div></div>'}
      ${window.Components && window.Components.kpiCard ? window.Components.kpiCard({icon: window.Components.icon('megaphone', 24), iconBg: '#D1FAE5', iconColor: '#065F46', title: 'Campanhas', value: campanhas.length, subtitle: 'Cadastradas', borderColor: '#10B981'}) : '<div class="card"><div class="card-body">Campanhas: ' + campanhas.length + '</div></div>'}
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div class="card-header">
        <h3 style="margin:0;">Relatório de Exibição por Campanha</h3>
      </div>
      <div class="card-body" style="padding: 0;">
        <table style="width:100%; border-collapse: collapse; text-align: left;">
          <thead style="background: #F3F4F6; border-bottom: 1px solid #E5E7EB;">
            <tr>
              <th style="padding: 12px 20px; color: #6B7280; font-size: 12px; text-transform: uppercase;">Campanha</th>
              <th style="padding: 12px 20px; color: #6B7280; font-size: 12px; text-transform: uppercase;">Período Programado</th>
              <th style="padding: 12px 20px; color: #6B7280; font-size: 12px; text-transform: uppercase;">Status</th>
              <th style="padding: 12px 20px; color: #6B7280; font-size: 12px; text-transform: uppercase;">Qtd. de Exibições</th>
            </tr>
          </thead>
          <tbody>
            ${campanhas.map(c => {
              const statusColors = {
                'ativa': 'bg-green text-green-dark',
                'pausada': 'bg-yellow text-yellow-dark',
                'encerrada': 'bg-red text-red-dark'
              };
              const statusClass = statusColors[c.status] || 'bg-gray text-gray-dark';
              return `
                <tr style="border-bottom: 1px solid #F3F4F6;">
                  <td style="padding: 15px 20px; font-weight: 500;">${c.nome}</td>
                  <td style="padding: 15px 20px; color: #4B5563;">${c.periodo || 'N/A'}</td>
                  <td style="padding: 15px 20px;">
                    <span class="badge ${statusClass}">${c.status.toUpperCase()}</span>
                  </td>
                  <td style="padding: 15px 20px; font-weight: bold; font-size: 16px; color: #3B82F6;">
                    ${(c.exibicoes || 0).toLocaleString()}
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="4" style="padding:20px; text-align:center; color:#9ca3af;">Nenhuma campanha encontrada.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  main.innerHTML = html;
};
