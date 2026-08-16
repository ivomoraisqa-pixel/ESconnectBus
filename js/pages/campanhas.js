window.Pages = window.Pages || {};
Pages.campanhas = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  const stats = await window.AppData.getDashboardStats();
  const campanhas = await window.AppData.getCampanhas();
  window._campanhasList = campanhas; // Store globally for preview
  const campaignPerformance = window.AppData.getCampaignPerformance ? await window.AppData.getCampaignPerformance() : window.AppData.campaignPerformance;
  const invData = await window.AppData.getInvestimentoRetorno();
  const totens = window.AppData.getTotens ? await window.AppData.getTotens() : [];
  
  main.innerHTML = `
    <!-- KPI Row -->
    <div class="kpi-row" style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-bottom:24px;">
      ${Components.kpiCard({icon:Components.icon('megaphone',24),iconBg:'#D1FAE5',iconColor:'#065F46',title:'Campanhas Ativas',value:stats.campanhasAtivas,subtitle:'de '+campanhas.length+' campanhas',extra:'<div class="kpi-progress" style="background:#E5E7EB;height:6px;border-radius:3px;margin-top:12px;"><div class="kpi-progress-bar" style="background:#10B981;height:100%;width:'+(stats.campanhasAtivas/campanhas.length*100)+'%'+';border-radius:3px;"></div></div>',borderColor:'#10B981'})}
      ${Components.kpiCard({icon:Components.icon('bar-chart',24),iconBg:'#DBEAFE',iconColor:'#1E40AF',title:'Exibições Hoje',value:stats.exibicoesHoje.toLocaleString('pt-BR'),trend:'up',trendValue:'+12,5%',subtitle:'vs. ontem',borderColor:'#3B82F6'})}
      ${Components.kpiCard({icon:Components.icon('eye',24),iconBg:'#FEF3C7',iconColor:'#92400E',title:'CTR Médio',value:stats.ctrMedio + '%',trend:'up',trendValue:'+0,35%',subtitle:'vs. ontem',borderColor:'#F59E0B'})}
      ${Components.kpiCard({icon:Components.icon('image',24),iconBg:'#FCE7F3',iconColor:'#9D174D',title:'Anúncios Ativos',value:stats.anunciosAtivos,subtitle:'de '+stats.totalAnuncios+' anúncios',borderColor:'#EC4899'})}
      ${Components.kpiCard({icon:Components.icon('chart',24),iconBg:'#CFFAFE',iconColor:'#155E75',title:'Investimento (Mês)',value:'R$ ' + stats.investimentoMes.toLocaleString('pt-BR', {minimumFractionDigits:2}),trend:'up',trendValue:'+8,2%',subtitle:'vs. mês anterior',borderColor:'#06B6D4'})}
    </div>
    
    <!-- Tabs + Filters + Table + Totem Preview -->
    <div class="campaigns-layout" style="display:grid;grid-template-columns:1fr 320px;gap:24px;">
      <div>
        <!-- Tabs -->
        <div class="card" style="background:white;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <div class="card-body" style="padding:0;">
            <div class="tabs" id="campaign-tabs" style="display:flex;border-bottom:1px solid #E5E7EB;background:#F9FAFB;border-radius:8px 8px 0 0;">
              <div class="tab-item active" onclick="Pages.filterCampanhas('todas')" style="padding:12px 20px;font-size:13px;font-weight:500;cursor:pointer;border-bottom:2px solid #3B82F6;color:#3B82F6;">Todas</div>
              <div class="tab-item" onclick="Pages.filterCampanhas('ativa')" style="padding:12px 20px;font-size:13px;font-weight:500;cursor:pointer;color:#6B7280;">Ativas</div>
              <div class="tab-item" onclick="Pages.filterCampanhas('agendada')" style="padding:12px 20px;font-size:13px;font-weight:500;cursor:pointer;color:#6B7280;">Agendadas</div>
              <div class="tab-item" onclick="Pages.filterCampanhas('pausada')" style="padding:12px 20px;font-size:13px;font-weight:500;cursor:pointer;color:#6B7280;">Pausadas</div>
              <div class="tab-item" onclick="Pages.filterCampanhas('encerrada')" style="padding:12px 20px;font-size:13px;font-weight:500;cursor:pointer;color:#6B7280;">Encerradas</div>
            </div>
            <!-- Filters -->
            <div class="filter-bar" style="padding:12px 20px;display:flex;gap:12px;align-items:center;border-bottom:1px solid #E5E7EB;">
              ${Components.searchBar('Buscar campanhas...', 'campaign-search')}
              ${Components.filterSelect('filter-totem', ['Todos os totens'], 'Todos os totens')}
              ${Components.filterSelect('filter-formato', ['Todos os formatos', 'Imagem', 'Vídeo', 'HTML/Interativo'], 'Todos os formatos')}
              <button class="btn btn-secondary" style="padding:8px 12px;border:1px solid #D1D5DB;border-radius:6px;background:white;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;">${Components.icon('filter', 16)} Filtros</button>
            </div>
            <!-- Table -->
              <table class="data-table" style="width:100%;border-collapse:collapse;text-align:left;font-size:13px;">
                <thead>
                  <tr style="border-bottom:1px solid #E5E7EB;color:#6B7280;background:#F9FAFB;">
                    <th style="padding:12px 20px;font-weight:600;">Campanha</th>
                    <th style="padding:12px 20px;font-weight:600;">Período / Rotação</th>
                    <th style="padding:12px 20px;font-weight:600;">Totens Alvo</th>
                    <th style="padding:12px 20px;font-weight:600;">Progresso / Meta</th>
                    <th style="padding:12px 20px;font-weight:600;color:#2563EB;">Exibições Real-Time</th>
                    <th style="padding:12px 20px;font-weight:600;color:#059669;">Estimativa Total (Fim)</th>
                    <th style="padding:12px 20px;font-weight:600;">Investimento</th>
                    <th style="padding:12px 20px;font-weight:600;">Ações</th>
                  </tr>
                </thead>
                <tbody id="campanhas-tbody"></tbody>
              </table>
            <!-- Pagination -->
            <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #E5E7EB;">
              <span style="font-size:13px;color:#6B7280;">Mostrando 1 a ${Math.min(5, campanhas.length)} de ${campanhas.length} campanhas</span>
              <div class="pagination" style="display:flex;gap:4px;">
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">«</div>
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">‹</div>
                <div class="pagination-item active" style="padding:4px 10px;border:1px solid #3B82F6;background:#3B82F6;color:white;border-radius:4px;cursor:pointer;">1</div>
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">2</div>
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">3</div>
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">4</div>
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">›</div>
                <div class="pagination-item" style="padding:4px 10px;border:1px solid #E5E7EB;border-radius:4px;cursor:pointer;">»</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Totem Preview Sidebar -->
      <div class="card totem-preview-card" style="background:white;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);align-self:start;">
        <div class="card-header" style="padding:16px 20px;border-bottom:1px solid #F3F4F6;font-weight:600;display:flex;justify-content:space-between;align-items:center;">
          Preview do Totem 
          <select id="preview-totem-select" onchange="window.Pages.atualizarTotemPreview()" style="font-size:12px; padding:4px 8px; border:1px solid #E5E7EB; border-radius:4px; max-width:160px; outline:none;">
            ${totens.map(t => {
              const regiao = t.localizacao ? t.localizacao.split(',')[0].toUpperCase() : 'SERRA';
              const local = t.nome.toUpperCase();
              return `<option value="${regiao}|${local}">${t.nome}</option>`;
            }).join('')}
            ${totens.length === 0 ? '<option value="SERRA|CARONE MALL">Totem Carone Mall</option>' : ''}
          </select>
        </div>
        <div class="card-body" style="padding:20px;background:#F9FAFB;display:flex;justify-content:center;">
          <div class="totem-mini-preview" id="totem-preview" style="width:200px;box-shadow:0 10px 25px rgba(0,0,0,0.15);border-radius:12px;border:6px solid #374151;">
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Charts Row -->
    <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:24px;">
      <!-- Performance Chart -->
      <div class="card" style="background:white;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:16px 20px;border-bottom:1px solid #F3F4F6;font-weight:600;display:flex;justify-content:space-between;">
          Desempenho
          <div style="display:flex;gap:12px;font-size:12px;font-weight:400;">
            <span style="color:#6B7280;">● Exibições</span>
            <span style="color:#3B82F6;">● Cliques</span>
          </div>
        </div>
        <div class="card-body" style="padding:20px;">
          <canvas id="campaign-performance-chart" height="200"></canvas>
        </div>
      </div>
      
      <!-- Ad Formats Donut -->
      <div class="card" style="background:white;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:16px 20px;border-bottom:1px solid #F3F4F6;font-weight:600;">Formatos de Anúncios</div>
        <div class="card-body" style="padding:20px;display:flex;flex-direction:column;align-items:center;">
          <canvas id="formats-donut" width="180" height="180"></canvas>
        </div>
      </div>
      
      <!-- Investment Return -->
      <div class="card" style="background:white;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:16px 20px;border-bottom:1px solid #F3F4F6;font-weight:600;">Investimento x Retorno</div>
        <div class="card-body" style="padding:20px;">
          <div id="investment-data"></div>
        </div>
      </div>
    </div>
  `;
  
  // Populate campaigns table
  Pages.renderCampanhasTable(campanhas.slice(0, 5));
  
  // Render charts
  setTimeout(() => {
    Charts.bar('campaign-performance-chart', {
      labels: campaignPerformance.labels,
      datasets: [
        { label: 'Exibições', data: campaignPerformance.exibicoes, color: '#E5E7EB' },
        { label: 'Cliques', data: campaignPerformance.cliques, color: '#3B82F6' }
      ]
    });
    
    Charts.donut('formats-donut', [
      { label: 'Imagem', value: 12, color: '#3B82F6' },
      { label: 'Vídeo', value: 8, color: '#EF4444' },
      { label: 'HTML/Interativo', value: 4, color: '#F59E0B' }
    ], { text: '24', subtext: 'Anúncios' });
  }, 100);
  
  // Render investment data
  document.getElementById('investment-data').innerHTML = `
    <div class="investment-table">
      ${Object.entries({
        'Investimento (Mês)': invData.investimentoMes,
        'CPM Médio': invData.cpmMedio,
        'Custo por Clique': invData.custoPorClique,
        'Retorno Estimado': invData.retornoEstimado,
        'ROI': invData.roi
      }).map(([k,v]) => `
        <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #F3F4F6;">
          <span style="color:#6B7280;font-size:13px;">${k}</span>
          <span style="font-weight:600;font-size:13px;${k==='ROI'?'color:#10B981':k==='Retorno Estimado'?'color:#2D9B5A':''}">${v}</span>
        </div>
      `).join('')}
    </div>
  `;
  
  // Render totem mini preview
  Pages.renderTotemPreview();

  if (window.Pages.campanhasInterval) clearInterval(window.Pages.campanhasInterval);
  window.Pages.campanhasInterval = setInterval(async () => {
    if (window.Router.currentPage === 'campanhas') {
      const freshCampanhas = await window.AppData.getCampanhas(true);
      window._campanhasList = freshCampanhas;
      Pages.renderCampanhasTable(freshCampanhas);
    } else {
      clearInterval(window.Pages.campanhasInterval);
    }
  }, 3000);
};

Pages.renderCampanhasTable = function(campanhas) {
  const tbody = document.getElementById('campanhas-tbody');
  if (!tbody) return;
  tbody.innerHTML = campanhas.map(c => {
    const estTotal = window.AppData.calcularEstimativaExibicoes ? window.AppData.calcularEstimativaExibicoes(c, campanhas, 6) : 1000;
    const exibReal = c.exibicoes || 0;
    const pct = Math.min(100, Math.round((exibReal / Math.max(1, estTotal)) * 100));

    return `
      <tr style="border-bottom:1px solid #F3F4F6;">
        <td style="padding:12px 20px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:8px;background:${c.status==='ativa'?'#2D9B5A':'#6B7280'};display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">📢</div>
            <div>
              <div style="font-weight:600;color:#1A1A2E;">${c.nome}</div>
              <div style="font-size:12px;color:#6B7280;">${c.descricao || ''}</div>
            </div>
          </div>
        </td>
        <td style="padding:12px 20px;">
          <div style="color:#1A1A2E;">${c.periodo || (c.data_inicio && c.data_fim ? c.data_inicio + ' - ' + c.data_fim : 'Não definido')}</div>
          <div style="font-size:12px;color:#6B7280;">${c.totens_alvo?.tempo_exibicao || 15}s por rotação</div>
        </td>
        <td style="padding:12px 20px;"><strong>${(c.totens_alvo?.tipo === 'individual' && Array.isArray(c.totens_alvo.ids)) ? c.totens_alvo.ids.length : 'Todos'}</strong></td>
        <td style="padding:12px 20px;">
          <div style="color:#1A1A2E; font-weight:600;">${pct}%</div>
          <div style="font-size:12px;color:#10B981;">Meta: ${estTotal.toLocaleString('pt-BR')}</div>
        </td>
        <td style="padding:12px 20px;color:#2563EB;font-weight:800;font-size:15px;">
          ⚡ ${exibReal.toLocaleString('pt-BR')}
        </td>
        <td style="padding:12px 20px;color:#059669;font-weight:700;">
          🎯 ${estTotal.toLocaleString('pt-BR')}
        </td>
        <td style="padding:12px 20px;color:#1A1A2E;">R$ ${(c.investimento || 0).toFixed(2).replace('.', ',')}</td>
        <td style="padding:12px 20px;">${Components.actionButtons([
          {icon:'eye',title:'Visualizar',onclick:`window.Pages.verCampanhaPreview(${c.id})`},
          {icon:'edit',title:'Editar',onclick:`window.Pages.editarCampanha(${c.id})`},
          {icon:c.status==='ativa'?'pause-circle':'play-circle',title:c.status==='ativa'?'Pausar':'Ativar',onclick:`window.Pages.toggleCampanha(${c.id}, '${c.status}')`},
          {icon:'trash',title:'Excluir',color:'#EF4444',onclick:`window.Pages.excluirCampanha(${c.id})`}
        ])}</td>
      </tr>
    `;
  }).join('');
};

Pages.filterCampanhas = async function(status) {
  document.querySelectorAll('#campaign-tabs .tab-item').forEach((tab, i) => {
    const tabStatus = ['todas','ativa','agendada','pausada','encerrada'][i];
    if(tabStatus === status) {
      tab.classList.add('active');
      tab.style.borderBottom = '2px solid #3B82F6';
      tab.style.color = '#3B82F6';
    } else {
      tab.classList.remove('active');
      tab.style.borderBottom = 'none';
      tab.style.color = '#6B7280';
    }
  });
  const filtered = window.AppData.getCampanhasByStatus ? await window.AppData.getCampanhasByStatus(status) : await window.AppData.getCampanhas().then(c => status === 'todas' ? c : c.filter(x => x.status === status));
  Pages.renderCampanhasTable(filtered.slice(0, 5));
};

Pages.renderTotemPreview = function() {
  const preview = document.getElementById('totem-preview');
  if (!preview) return;
  preview.innerHTML = `
    <div style="background:#1A1A2E;border-radius:4px;overflow:hidden;color:white;font-family:Inter,sans-serif;font-size:10px;">
      <div style="display:flex;justify-content:space-between;padding:8px 10px;">
        <div><strong id="preview-totem-cidade">SERRA</strong><br><span id="preview-totem-local" style='font-size:8px;'>CARONE MALL</span></div>
        <div style="text-align:right;"><strong>${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</strong><br><span style='font-size:8px;'>${new Date().toLocaleDateString('pt-BR')}</span></div>
      </div>
      <div style="background:#2D9B5A;padding:4px 10px;font-weight:700;font-size:9px;">PRÓXIMOS ÔNIBUS</div>
      <div style="background:white;color:#1A1A2E;">
        ${[{n:'523',d:'TERMINAL LARANJEIRAS',t:'1 min',c:'#2D9B5A'},{n:'507',d:'CENTRO / VITÓRIA',t:'5 min',c:'#3B82F6'},{n:'814',d:'JACARAÍPE',t:'11 min',c:'#8B5CF6'},{n:'850',d:'SERRA DOURADA',t:'18 min',c:'#F97316'},{n:'519',d:'CARAPINA',t:'22 min',c:'#06B6D4'}].map(b => `
          <div style="display:flex;align-items:center;padding:4px 8px;border-bottom:1px solid #eee;gap:6px;">
            <span style="background:${b.c};color:white;padding:2px 6px;border-radius:3px;font-weight:700;font-size:8px;">${b.n}</span>
            <span style="flex:1;font-size:8px;font-weight:600;">${b.d}</span>
            <span style="font-weight:700;font-size:9px;">${b.t}</span>
          </div>
        `).join('')}
      </div>
      <div style="padding:6px 10px;text-align:center;">
        <div style="font-size:8px;font-weight:600;">MAPA DE LINHAS</div>
        <div style="height:60px;background:#e5e7eb;border-radius:4px;margin-top:4px;"></div>
      </div>
      <div style="display:flex;justify-content:space-around;padding:6px;font-size:7px;">
        <span>⏱ Tempo real</span><span>✓ Confiável</span><span>📶 Conectado</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 10px;font-size:7px;border-top:1px solid #333;">
        <span><strong>SerraBus</strong> CONECT</span>
        <span>📶 Wi-Fi Grátis</span>
      </div>
    </div>
  `;
  window.Pages.atualizarTotemPreview();
};

Pages.atualizarTotemPreview = function() {
  const select = document.getElementById('preview-totem-select');
  if(!select) return;
  const val = select.value.split('|');
  const cidade = document.getElementById('preview-totem-cidade');
  const local = document.getElementById('preview-totem-local');
  if(cidade && local) {
    cidade.innerText = val[0] || 'SERRA';
    local.innerText = val[1] || 'CARONE MALL';
  }
};

Pages.verCampanhaPreview = function(id) {
  if(!window._campanhasList) return;
  const c = window._campanhasList.find(x => x.id === id);
  if(!c) return;
  
  // Highlight the row temporarily or just show the preview
  const preview = document.getElementById('totem-preview');
  if(!preview) return;
  
  // Update the media area within the preview
  // We'll replace the static map/ad section with the selected campaign's media
  const parts = c.descricao ? c.descricao.split('|') : [];
  const clienteStr = parts[0] ? parts[0].replace('Cliente: ', '').trim() : 'Anunciante';
  
  // Inject an overlay or replace the content of the preview to show the campaign
  const mapArea = preview.querySelector('div[style*="MAPA DE LINHAS"]')?.parentElement;
  if(mapArea) {
    mapArea.innerHTML = `
      <div style="height:100px; background:#000; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:10px;">
        <div style="color:#F59E0B; font-weight:800; font-size:11px;">${c.nome.toUpperCase()}</div>
        <div style="font-weight:600; font-size:8px; margin-top:4px;">${clienteStr}</div>
        <div style="width:100%; height:40px; background:#374151; margin-top:8px; border-radius:4px; display:flex; align-items:center; justify-content:center; font-size:8px; color:#9CA3AF;">[ MÍDIA: ${c.formato ? c.formato.toUpperCase() : 'IMAGEM'} ]</div>
      </div>
    `;
  }
  
  // Also simulate a visual pulse on the preview container
  preview.style.transform = 'scale(1.02)';
  preview.style.boxShadow = '0 0 0 4px #3B82F6, 0 10px 25px rgba(0,0,0,0.15)';
  setTimeout(() => {
    preview.style.transform = 'scale(1)';
    preview.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
  }, 300);
};


Pages.novaCampanha = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  
  // Carrega lista real de totens para o dropdown
  const totensList = window.AppData.getTotens ? await window.AppData.getTotens() : [];
  
  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    headerActions.innerHTML = `<button class="btn btn-secondary" onclick="window.Router.navigate('campanhas')">${window.Components ? window.Components.icon('arrow-left', 16) : ''} Voltar</button>`;
  }

  main.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px;">
      
      <!-- Formulário -->
      <div class="card" style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:20px; border-bottom:1px solid #E5E7EB; font-weight:600; font-size:16px;">
          Configuração da Campanha
        </div>
        <div class="card-body" style="padding:24px;">
          <form id="form-nova-campanha" onsubmit="window.Pages.salvarCampanha(event)">
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Cliente / Anunciante</label>
                <input id="nc-cliente" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" placeholder="Ex: Supermercados Carone">
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Nome da Campanha</label>
                <input id="nc-nome" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" placeholder="Ex: Ofertas de Fim de Ano">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Tipo de Mídia</label>
                <select id="nc-tipo" required class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
                  <option value="imagem">Imagem Estática</option>
                  <option value="video">Vídeo</option>
                  <option value="html">HTML5 / Interativo</option>
                </select>
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Valor do Anúncio (R$)</label>
                <input id="nc-investimento" type="number" step="0.01" min="0" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" placeholder="Ex: 1500.00">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Data de Início</label>
                <input id="nc-inicio" type="date" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Data de Término</label>
                <input id="nc-fim" type="date" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Horários de Exibição</label>
                <select id="nc-horarios" class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" onchange="window.Pages.toggleCustomHours(this.value)">
                  <option value="comercial">Horário Comercial (08h - 18h)</option>
                  <option value="manha">Pico Manhã (06h - 09h)</option>
                  <option value="tarde">Pico Tarde (17h - 20h)</option>
                  <option value="integral">Integral (24h)</option>
                  <option value="personalizado">⏰ Personalizado (Escolher Horário)</option>
                </select>

                <div id="custom-hours-container" style="display:none; margin-top:10px; padding:10px; background:#F3F4F6; border-radius:6px; border:1px dashed #3B82F6;">
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div>
                      <label style="font-size:11px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Hora de Início</label>
                      <input type="time" id="nc-hora-inicio" value="08:00" class="form-input" style="width:100%; padding:6px; border:1px solid #D1D5DB; border-radius:4px;">
                    </div>
                    <div>
                      <label style="font-size:11px; font-weight:600; color:#374151; display:block; margin-bottom:4px;">Hora de Término</label>
                      <input type="time" id="nc-hora-fim" value="18:00" class="form-input" style="width:100%; padding:6px; border:1px solid #D1D5DB; border-radius:4px;">
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Tempo de Exibição (Segundos)</label>
                <select id="nc-tempo-exibicao" class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
                  <option value="5">5 Segundos (Muito Rápido)</option>
                  <option value="10">10 Segundos</option>
                  <option value="15" selected>15 Segundos (Padrão)</option>
                  <option value="20">20 Segundos</option>
                  <option value="30">30 Segundos</option>
                  <option value="60">60 Segundos (1 min)</option>
                </select>
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Prioridade no Rotativo</label>
                <select id="nc-prioridade" class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
                  <option value="alta">Alta (Mais Inserções)</option>
                  <option value="media">Média</option>
                  <option value="baixa">Baixa</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Alvo da Campanha</label>
              <div style="display:flex; gap:16px; margin-bottom: 12px;">
                <label style="display:flex; align-items:center; gap:8px; font-size:14px;">
                  <input type="radio" name="alvo" value="todos" checked onchange="window.Pages.toggleTargetDropdown(this.value)"> Todos os Totens
                </label>
                <label style="display:flex; align-items:center; gap:8px; font-size:14px;">
                  <input type="radio" name="alvo" value="individual" onchange="window.Pages.toggleTargetDropdown(this.value)"> Totens Específicos
                </label>
              </div>
              
              <div id="target-dropdown-container" style="display:none; padding:12px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:6px;">
                <label style="font-size:12px; font-weight:600; display:block; margin-bottom:8px; color:#4B5563;">Selecione os Totens (Segure CTRL para múltiplos):</label>
                <select id="nc-target-list" multiple class="form-input form-select" style="width:100%; height:120px; padding:8px; border:1px solid #D1D5DB; border-radius:4px;">
                  ${totensList.map(t => `<option value="${t.id}">${t.nome} (${t.status})</option>`).join('')}
                </select>
                <div style="font-size:11px; color:#6B7280; margin-top:4px;">Apenas totens selecionados receberão a atualização de mídia desta campanha.</div>
              </div>
            </div>

            <div style="margin-bottom:24px;">
              <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Upload da Mídia (1080x1920 / Imagem ou Vídeo MP4, WEBM, MOV)</label>
              <label for="nc-midia" id="nc-midia-label" style="display:block; border:2px dashed #D1D5DB; border-radius:8px; padding:32px; text-align:center; cursor:pointer; background:#F9FAFB; transition: all 0.2s;" 
                onmouseover="this.style.borderColor='#3B82F6'" onmouseout="this.style.borderColor='#D1D5DB'"
                ondragover="event.preventDefault(); this.style.borderColor='#3B82F6'; this.style.background='#EFF6FF';" 
                ondragleave="event.preventDefault(); this.style.borderColor='#D1D5DB'; this.style.background='#F9FAFB';" 
                ondrop="event.preventDefault(); this.style.borderColor='#D1D5DB'; this.style.background='#F9FAFB'; const input = document.getElementById('nc-midia'); input.files = event.dataTransfer.files; input.dispatchEvent(new Event('change'));">
                ${window.Components ? window.Components.icon('upload-cloud', 32) : '📤'}
                <div id="nc-midia-text" style="margin-top:12px; font-weight:500; color:#3B82F6;">Clique para selecionar ou arraste o arquivo</div>
                <div style="font-size:12px; color:#6B7280; margin-top:4px;">Suporta JPG, PNG, GIF, MP4, WEBM, MOV até 50MB</div>
                <input type="file" id="nc-midia" accept="image/*,video/*,.mp4,.webm,.mov,.mkv,.avi" style="width:0.1px; height:0.1px; opacity:0; overflow:hidden; position:absolute; z-index:-1;" 
                  onchange="window.Pages.handleMediaUpload(this)">
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #E5E7EB; padding-top:20px;">
              <button type="button" class="btn btn-secondary" onclick="window.Router.navigate('campanhas')" style="padding:10px 20px;">Cancelar</button>
              <button type="submit" id="nc-btn-salvar" class="btn btn-primary" style="padding:10px 24px; background:#2D9B5A; border:none; color:white; font-weight:600; font-size:14px;">Criar Campanha</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Preview do Totem -->
      <div class="card" style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:20px; border-bottom:1px solid #E5E7EB; font-weight:600; font-size:16px; display:flex; justify-content:space-between; align-items:center;">
          Preview em Tempo Real
          <span style="font-size:12px; font-weight:400; padding:4px 8px; background:#DBEAFE; color:#1E40AF; border-radius:12px;">Alternância Simulada</span>
        </div>
        <div class="card-body" style="padding:24px 0; background:#F9FAFB; display:flex; justify-content:center; overflow:hidden;">
          
          <!-- Contêiner de Dimensão Real do Scale -->
          <div style="width:270px; height:480px; position:relative;">
            
            <!-- Elemento Físico do Totem (1080x1920) -->
            <div style="width:1080px; height:1920px; transform:scale(0.25); transform-origin:top left; position:absolute; top:0; left:0; background:#1A1A2E; overflow:hidden; font-family:'Inter', sans-serif; color:white; border:24px solid #111; border-radius:64px; box-sizing:border-box; display:flex; flex-direction:column; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
              
              <!-- Header do Totem -->
              <div style="display:flex; justify-content:space-between; padding:32px 40px; background:#1A1A2E;">
                <div>
                  <div style="font-weight:700; font-size:48px;">SERRA</div>
                  <div style="font-size:32px; color:#A3B8B0;">CARONE MALL</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:700; font-size:64px;">14:30</div>
                  <div style="font-size:28px; color:#A3B8B0;">23 de Maio, 2025</div>
                </div>
              </div>

              <!-- Container Dinâmico (Muda entre Mapa e Ad) -->
              <div id="preview-content-area" style="flex:1; position:relative; background:white;">
                
                <!-- View 1: Mapa (GTFS) -->
                <div id="preview-view-mapa" style="position:absolute; inset:0; display:flex; flex-direction:column; transition:opacity 0.5s;">
                  <div style="background:#2D9B5A; padding:24px 40px; font-weight:700; font-size:36px; color:white;">PRÓXIMOS ÔNIBUS</div>
                  <div style="background:white; color:#1A1A2E; flex:1;">
                    <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
                      <span style="background:#2D9B5A; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">523</span>
                      <span style="flex:1; font-size:42px; font-weight:600;">TERMINAL LARANJEIRAS</span>
                      <span style="font-weight:700; font-size:48px;">2 min</span>
                    </div>
                    <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
                      <span style="background:#3B82F6; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">507</span>
                      <span style="flex:1; font-size:42px; font-weight:600;">CENTRO / VITÓRIA</span>
                      <span style="font-weight:700; font-size:48px;">5 min</span>
                    </div>
                  </div>
                  <!-- Fake Map Area -->
                  <div style="height:700px; background:#e5e7eb; position:relative; border-top:4px solid #E5E7EB;">
                    <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:48px; color:#9CA3AF; font-weight:600;">MAPA DE LINHAS EM TEMPO REAL</div>
                  </div>
                </div>

                <!-- View 2: Publicidade -->
                <div id="preview-view-ad" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:#000; opacity:0; transition:opacity 0.5s; z-index:10;">
                  <div style="text-align:center; color:white;">
                    <div style="font-size:80px; font-weight:800; margin-bottom:40px; color:#F59E0B;">OFERTAS DE FIM DE ANO</div>
                    <div style="font-size:48px; font-weight:600; margin-bottom:60px;">Supermercados Carone</div>
                    <div style="width:600px; height:600px; background:#374151; border-radius:40px; margin:0 auto; display:flex; align-items:center; justify-content:center; font-size:36px; color:#9CA3AF;">[ Área de Mídia ]</div>
                  </div>
                </div>

              </div>

              <!-- Footer -->
              <div style="display:flex; justify-content:space-between; align-items:center; padding:32px 40px; background:#1A1A2E; border-top:2px solid #333;">
                <div style="font-size:32px;"><strong style="color:white;">SerraBus</strong> <span style="color:#2D9B5A; font-weight:300;">CONECT</span></div>
                <div style="font-size:32px; color:#A3B8B0;">📶 Wi-Fi Grátis</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Start animation loop for the preview
  if (window.previewInterval) clearInterval(window.previewInterval);
  let showAd = false;
  window.previewInterval = setInterval(() => {
    const vMap = document.getElementById('preview-view-mapa');
    const vAd = document.getElementById('preview-view-ad');
    if (!vMap || !vAd) {
      clearInterval(window.previewInterval);
      return;
    }
    showAd = !showAd;
    if (showAd) {
      vMap.style.opacity = '0';
      vAd.style.opacity = '1';
    } else {
      vMap.style.opacity = '1';
      vAd.style.opacity = '0';
    }
  }, 4000);

  // Pre-fill form if editing
  if (window._editCampanhaId && window._editCampanhaData) {
    const c = window._editCampanhaData;
    let cliente = '';
    let prioridade = 'alta';
    if (c.descricao) {
       const p = c.descricao.split('|');
       if(p[0]) cliente = p[0].replace('Cliente: ', '').trim();
       if(p[1]) prioridade = p[1].replace('Prioridade: ', '').trim();
    }
    if (document.getElementById('nc-cliente')) document.getElementById('nc-cliente').value = cliente;
    if (document.getElementById('nc-nome')) document.getElementById('nc-nome').value = c.nome;
    if (document.getElementById('nc-tipo')) document.getElementById('nc-tipo').value = c.formato || 'imagem';
    if (document.getElementById('nc-prioridade')) document.getElementById('nc-prioridade').value = prioridade;
    if (document.getElementById('nc-investimento')) document.getElementById('nc-investimento').value = c.investimento || 1500;
    
    if (c.totens_alvo) {
      if (document.getElementById('nc-inicio')) document.getElementById('nc-inicio').value = c.totens_alvo.data_inicio || '';
      if (document.getElementById('nc-fim')) document.getElementById('nc-fim').value = c.totens_alvo.data_fim || '';
      if (document.getElementById('nc-horarios')) {
        document.getElementById('nc-horarios').value = c.totens_alvo.horarios || 'integral';
        window.Pages.toggleCustomHours(c.totens_alvo.horarios || 'integral');
      }
      if (c.totens_alvo.horarios === 'personalizado') {
        if (c.totens_alvo.hora_inicio && document.getElementById('nc-hora-inicio')) document.getElementById('nc-hora-inicio').value = c.totens_alvo.hora_inicio;
        if (c.totens_alvo.hora_fim && document.getElementById('nc-hora-fim')) document.getElementById('nc-hora-fim').value = c.totens_alvo.hora_fim;
      }
      if (document.getElementById('nc-tempo-exibicao')) document.getElementById('nc-tempo-exibicao').value = c.totens_alvo.tempo_exibicao || 15;
      
      const radios = document.getElementsByName("alvo");
      for(let r of radios) {
        if(r.value === c.totens_alvo.tipo) {
           r.checked = true;
           window.Pages.toggleTargetDropdown(r.value);
        }
      }
      
      if (c.totens_alvo.tipo === 'individual' && c.totens_alvo.ids) {
        const select = document.getElementById("nc-target-list");
        if (select) {
          for (let opt of select.options) {
            if (c.totens_alvo.ids.includes(opt.value)) opt.selected = true;
          }
        }
      }
    }
  }
};

Pages.salvarCampanha = async function(e) {
  e.preventDefault();
  const btn = document.getElementById("nc-btn-salvar");
  const oldText = btn.innerHTML;
  btn.innerHTML = "Salvando...";
  btn.disabled = true;
  
  try {
    const radios = document.getElementsByName("alvo");
    let tipoAlvo = "todos";
    for(let r of radios) { if(r.checked) tipoAlvo = r.value; }
    
    let idsAlvo = [];
    if (tipoAlvo === "individual") {
      const select = document.getElementById("nc-target-list");
      for (let opt of select.options) {
        if (opt.selected) idsAlvo.push(opt.value);
      }
      if (idsAlvo.length === 0) {
        alert("Por favor, selecione ao menos um totem.");
        btn.innerHTML = oldText;
        btn.disabled = false;
        return;
      }
    }

    const data_inicio = document.getElementById("nc-inicio").value;
    const data_fim = document.getElementById("nc-fim").value;
    const horarios = document.getElementById("nc-horarios") ? document.getElementById("nc-horarios").value : "integral";
    const hora_inicio = (horarios === 'personalizado' && document.getElementById("nc-hora-inicio")) ? document.getElementById("nc-hora-inicio").value : null;
    const hora_fim = (horarios === 'personalizado' && document.getElementById("nc-hora-fim")) ? document.getElementById("nc-hora-fim").value : null;
    const tempo_exibicao = document.getElementById("nc-tempo-exibicao") ? parseInt(document.getElementById("nc-tempo-exibicao").value) : 15;
    const investimento = document.getElementById("nc-investimento") && document.getElementById("nc-investimento").value ? parseFloat(document.getElementById("nc-investimento").value) : 1500;

    const formataData = (d) => {
       if(!d) return '';
       const partes = d.split('-');
       if(partes.length !== 3) return d;
       return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };
    const periodoFormatado = `${formataData(data_inicio)} - ${formataData(data_fim)}`;

    const data = {
      nome: document.getElementById("nc-nome").value,
      descricao: 'Cliente: ' + document.getElementById("nc-cliente").value + ' | Prioridade: ' + document.getElementById("nc-prioridade").value,
      formato: document.getElementById("nc-tipo").value,
      periodo: periodoFormatado,
      investimento: investimento,
      totens_alvo: { 
        tipo: tipoAlvo, 
        ids: idsAlvo, 
        data_inicio: data_inicio, 
        data_fim: data_fim, 
        horarios: horarios,
        hora_inicio: hora_inicio,
        hora_fim: hora_fim,
        tempo_exibicao: tempo_exibicao
      },
      status: "ativa"
    };

    if (window._campanhaMediaBase64) {
      data.totens_alvo.arquivo_url = window._campanhaMediaBase64;
    }

    if (window._editCampanhaId) {
      await window.AppData.updateCampanha(window._editCampanhaId, data);
      alert("Campanha atualizada com sucesso!");
      window._editCampanhaId = null;
      window._editCampanhaData = null;
    } else {
      data.exibicoes = 0;
      data.investimento = Math.floor(Math.random() * 5000) + 1000;
      await window.AppData.createCampanha(data);
      alert("Campanha salva com sucesso no Supabase!");
    }
    
    window.Router.navigate("campanhas");
    window._campanhaMediaBase64 = null; // Clean up
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar campanha: " + (err.message || JSON.stringify(err)));
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
};

Pages.toggleTargetDropdown = function(value) {
  const container = document.getElementById("target-dropdown-container");
  if (value === "individual") {
    container.style.display = "block";
  } else {
    container.style.display = "none";
  }
};

Pages.handleMediaUpload = function(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  
  document.getElementById('nc-midia-text').innerText = file.name;
  
  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name);
  const tipoSelect = document.getElementById('nc-tipo');
  if (tipoSelect) {
    tipoSelect.value = isVideo ? 'video' : 'imagem';
  }

  const adView = document.getElementById('preview-view-ad');
  if (adView) {
    const fileURL = URL.createObjectURL(file);
    if (isVideo) {
      adView.innerHTML = `<video src="${fileURL}" autoplay loop muted style="width:100%; height:100%; object-fit:cover;"></video>`;
    } else {
      adView.innerHTML = `<div style="width:100%; height:100%; background-image:url(${fileURL}); background-size:cover; background-position:center;"></div>`;
    }
  }

  // Convert to Base64 to save in the JSON payload
  const reader = new FileReader();
  reader.onload = function(e) {
    window._campanhaMediaBase64 = e.target.result;
  };
  reader.onerror = function(err) {
    console.error('Erro ao ler arquivo de mídia:', err);
    alert('Erro ao carregar o arquivo de vídeo. Verifique se o arquivo não está corrompido.');
  };
  reader.readAsDataURL(file);
};

Pages.excluirCampanha = async function(id) {
  if(confirm("Tem certeza que deseja excluir esta campanha?")) {
    try {
      await window.AppData.deleteCampanha(id);
      alert("Campanha excluída com sucesso.");
      window.Router.handleRoute(); // Force reload the page content
    } catch(err) {
      console.error(err);
      alert("Erro ao excluir campanha.");
    }
  }
};

Pages.toggleCampanha = async function(id, currentStatus) {
  const newStatus = currentStatus === 'ativa' ? 'pausada' : 'ativa';
  const msg = newStatus === 'pausada' ? 'Pausar esta campanha?' : 'Reativar esta campanha?';
  if(confirm(msg)) {
    try {
      await window.supabase.from('campanhas').update({ status: newStatus }).eq('id', id);
      delete window._appDataCache['campanhas'];
      window.Router.handleRoute();
    } catch(err) {
      console.error(err);
      alert('Erro ao atualizar campanha.');
    }
  }
};

Pages.toggleCustomHours = function(val) {
  const container = document.getElementById("custom-hours-container");
  if (container) {
    container.style.display = (val === "personalizado") ? "block" : "none";
  }
};

Pages.editarCampanha = async function(id) {
  const campanhas = await window.AppData.getCampanhas();
  const c = campanhas.find(x => x.id === id);
  if(c) {
    window._editCampanhaId = id;
    window._editCampanhaData = c;
    window.Router.navigate("nova-campanha");
  }
};
