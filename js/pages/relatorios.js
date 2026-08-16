window.Pages = window.Pages || {};

Pages.relatoriosInterval = null;

window.Pages.relatorios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  if (window.Pages.relatoriosInterval) clearInterval(window.Pages.relatoriosInterval);

  const renderReport = async () => {
    const totensList = window.AppData.getTotens ? await window.AppData.getTotens() : [];
    const totalTotensCount = totensList.length || 6;
    const campanhas = window.AppData.getCampanhas ? await window.AppData.getCampanhas(true) : [];

    const totalExibicoesReal = campanhas.reduce((acc, curr) => acc + (curr.exibicoes || 0), 0);
    const totalProjetadoGeral = campanhas.reduce((acc, curr) => {
      const est = window.AppData.calcularEstimativaExibicoes ? window.AppData.calcularEstimativaExibicoes(curr, campanhas, totalTotensCount) : 1000;
      return acc + est;
    }, 0);

    let html = `
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <div class="page-title">
          <h1 style="font-size:24px; font-weight:700; color:#111827; margin:0;">Relatórios & Analytics de Exibição</h1>
          <p style="color:#6B7280; font-size:14px; margin:4px 0 0 0;">Métricas em tempo real e estimativa de projeção até o término da campanha</p>
        </div>
        <div class="page-actions" style="display:flex; gap:10px;">
          <button class="btn btn-secondary" onclick="window.Router.handleRoute()">${window.Components && window.Components.icon ? window.Components.icon('refresh-cw', 16) : '🔄'} Atualizar</button>
          <button class="btn btn-primary" onclick="window.print()">${window.Components && window.Components.icon ? window.Components.icon('printer', 16) : '🖨️'} Imprimir Relatório</button>
        </div>
      </div>
      
      <div class="kpi-row grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;">
        <div class="card" style="background:white; border-radius:12px; padding:20px; border-left:4px solid #3B82F6; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="font-size:12px; font-weight:600; color:#6B7280; text-transform:uppercase;">Exibições Real-Time</div>
          <div style="font-size:28px; font-weight:800; color:#1E40AF; margin-top:8px; display:flex; align-items:center; gap:8px;">
            <span style="width:10px; height:10px; border-radius:50%; background:#10B981; display:inline-block; animation:pulse 1.5s infinite;"></span>
            ${totalExibicoesReal.toLocaleString('pt-BR')}
          </div>
          <div style="font-size:12px; color:#6B7280; margin-top:4px;">Inserções efetuadas até agora</div>
        </div>

        <div class="card" style="background:white; border-radius:12px; padding:20px; border-left:4px solid #10B981; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="font-size:12px; font-weight:600; color:#6B7280; text-transform:uppercase;">Projeção Total Estimada</div>
          <div style="font-size:28px; font-weight:800; color:#065F46; margin-top:8px;">
            ${totalProjetadoGeral.toLocaleString('pt-BR')}
          </div>
          <div style="font-size:12px; color:#6B7280; margin-top:4px;">Meta total até o fim das campanhas</div>
        </div>

        <div class="card" style="background:white; border-radius:12px; padding:20px; border-left:4px solid #F59E0B; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="font-size:12px; font-weight:600; color:#6B7280; text-transform:uppercase;">Campanhas no Ar</div>
          <div style="font-size:28px; font-weight:800; color:#92400E; margin-top:8px;">
            ${campanhas.filter(c => c.status === 'ativa').length}
          </div>
          <div style="font-size:12px; color:#6B7280; margin-top:4px;">De ${campanhas.length} cadastradas</div>
        </div>

        <div class="card" style="background:white; border-radius:12px; padding:20px; border-left:4px solid #8B5CF6; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div style="font-size:12px; font-weight:600; color:#6B7280; text-transform:uppercase;">Média por Totem / Dia</div>
          <div style="font-size:28px; font-weight:800; color:#5B21B6; margin-top:8px;">
            ${Math.round(totalProjetadoGeral / (totalTotensCount * 30)).toLocaleString('pt-BR')}
          </div>
          <div style="font-size:12px; color:#6B7280; margin-top:4px;">Considerando ${totalTotensCount} totens ativos</div>
        </div>
      </div>

      <div class="card" style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1); margin-bottom:20px; overflow:hidden;">
        <div class="card-header" style="padding:20px; border-bottom:1px solid #E5E7EB; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:16px; font-weight:600; color:#111827;">Relatório Detalhado de Exibições e Projeções</h3>
          <span style="font-size:12px; color:#10B981; font-weight:600; display:flex; align-items:center; gap:6px;">
            ● Atualização Automática em Tempo Real (3s)
          </span>
        </div>
        <div class="card-body" style="padding: 0;">
          <table style="width:100%; border-collapse: collapse; text-align: left;">
            <thead style="background: #F9FAFB; border-bottom: 1px solid #E5E7EB;">
              <tr>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Campanha</th>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Período & Horário</th>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Tempo / Totens</th>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Status</th>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Exibições Real-Time</th>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Estimativa Total (Fim)</th>
                <th style="padding: 14px 20px; color: #4B5563; font-size: 12px; font-weight:600; text-transform: uppercase;">Progresso</th>
              </tr>
            </thead>
            <tbody>
              ${campanhas.map(c => {
                const statusColors = {
                  'ativa': 'background:#ECFDF5; color:#059669; border:1px solid #A7F3D0;',
                  'pausada': 'background:#FEF3C7; color:#D97706; border:1px solid #FDE68A;',
                  'encerrada': 'background:#FEF2F2; color:#DC2626; border:1px solid #FECACA;'
                };
                const statusStyle = statusColors[c.status] || 'background:#F3F4F6; color:#4B5563; border:1px solid #E5E7EB;';
                
                const alvo = c.totens_alvo || {};
                const tempoSeg = alvo.tempo_exibicao || 15;
                const totensTxt = (alvo.tipo === 'individual' && Array.isArray(alvo.ids)) ? `${alvo.ids.length} Toten(s)` : 'Todos Totens';
                const horarioTxt = alvo.horarios === 'comercial' ? 'Comercial (08h-18h)' : alvo.horarios === 'manha' ? 'Pico Manhã (06h-09h)' : alvo.horarios === 'tarde' ? 'Pico Tarde (17h-20h)' : 'Integral (24h)';

                const exibReal = c.exibicoes || 0;
                const estTotal = window.AppData.calcularEstimativaExibicoes ? window.AppData.calcularEstimativaExibicoes(c, campanhas, totalTotensCount) : 1000;
                const pct = Math.min(100, Math.round((exibReal / Math.max(1, estTotal)) * 100));

                return `
                  <tr style="border-bottom: 1px solid #F3F4F6;">
                    <td style="padding: 16px 20px; font-weight: 600; color:#111827;">
                      <div>${c.nome}</div>
                      <div style="font-size:12px; color:#6B7280; font-weight:400;">${c.descricao || ''}</div>
                    </td>
                    <td style="padding: 16px 20px; color: #374151; font-size:13px;">
                      <div style="font-weight:500;">${c.periodo || 'Não definido'}</div>
                      <div style="font-size:11px; color:#6B7280;">${horarioTxt}</div>
                    </td>
                    <td style="padding: 16px 20px; color: #374151; font-size:13px;">
                      <div><strong style="color:#2563EB;">${tempoSeg}s</strong> por rotação</div>
                      <div style="font-size:11px; color:#6B7280;">Target: ${totensTxt}</div>
                    </td>
                    <td style="padding: 16px 20px;">
                      <span style="padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; ${statusStyle}">
                        ${c.status.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding: 16px 20px; font-weight: 800; font-size: 17px; color: #2563EB;">
                      ⚡ ${exibReal.toLocaleString('pt-BR')}
                    </td>
                    <td style="padding: 16px 20px; font-weight: 800; font-size: 17px; color: #059669;">
                      🎯 ${estTotal.toLocaleString('pt-BR')}
                    </td>
                    <td style="padding: 16px 20px; width:140px;">
                      <div style="font-size:12px; font-weight:700; color:#374151; margin-bottom:4px;">${pct}%</div>
                      <div style="width:100%; height:8px; background:#E5E7EB; border-radius:4px; overflow:hidden;">
                        <div style="width:${pct}%; height:100%; background:${pct >= 100 ? '#10B981' : '#3B82F6'}; border-radius:4px; transition:width 0.3s;"></div>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="7" style="padding:20px; text-align:center; color:#9ca3af;">Nenhuma campanha encontrada.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    main.innerHTML = html;
  };

  await renderReport();

  // Auto-refresh do relatório a cada 3 segundos
  window.Pages.relatoriosInterval = setInterval(() => {
    if (window.Router.currentPage === 'relatorios') {
      renderReport();
    } else {
      clearInterval(window.Pages.relatoriosInterval);
    }
  }, 3000);
};
