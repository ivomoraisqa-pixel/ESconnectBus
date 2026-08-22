window.Pages = window.Pages || {};
window.Pages.horarios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  // Fetch totens for the dropdown
  const totens = window.AppData ? (await window.AppData.getTotens() || []) : [];
  
  const options = totens.map(t => `<option value="${t.id}">${t.nome || t.name} (${t.localizacao || 'Serra'})</option>`).join('');
  
  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Horários e Tempo Real</h1>
        <p>Previsões e chegadas de ônibus em tempo real por Totem / Estação de Embarque</p>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-body" style="display:flex; gap:16px; align-items:flex-end;">
        <div style="flex:1;">
          <label class="form-label" style="display:block; margin-bottom:8px; font-weight:600; color:#1A1A2E;">Selecione o Totem / Estação</label>
          <select id="horarios-ponto-select" class="form-input" style="width:100%; padding:10px; border:1px solid #D1D5DB; border-radius:8px; background:#fff;">
            <option value="">Selecione um totem para ver os horários em tempo real...</option>
            ${options}
          </select>
        </div>
        <button class="btn btn-primary" onclick="window.Pages.loadHorarios()" style="padding:10px 20px;">
          ${window.Components.icon ? window.Components.icon('refresh-cw', 16) : ''} Consultar Horários
        </button>
      </div>
    </div>
    
    <div id="horarios-loading" style="display:none; padding:40px; text-align:center; color:#6B7280;">
      <div style="font-size:28px; margin-bottom:8px;">⏳</div>
      Consultando previsões em tempo real...
    </div>

    <div id="horarios-resultados" style="display:none;">
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; display:flex; align-items:center; gap:10px;">
            Painel de Chegadas em Tempo Real
            <span class="status-dot" style="width:10px; height:10px; background:#10B981; border-radius:50%; display:inline-block; animation: pulse 2s infinite;"></span>
          </h3>
          <span id="horarios-station-name" style="font-size:13px; color:#6B7280; font-weight:500;"></span>
        </div>
        <div class="card-body">
          <div class="grid-3" id="horarios-cards-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 15px;">
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;">Todas as Linhas que Passam neste Ponto</h3>
        </div>
        <div class="card-body" style="padding:0; overflow-x:auto;">
          <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="background:#F9FAFB; border-bottom:2px solid #E5E7EB;">
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Linha</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Itinerário / Destino</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Previsão (ETA)</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Distância</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Status da Operação</th>
              </tr>
            </thead>
            <tbody id="horarios-table-body">
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    </style>
  `;

  main.innerHTML = html;

  // Auto-seleciona primeiro totem se existir
  if (totens.length > 0) {
    const select = document.getElementById('horarios-ponto-select');
    if (select) {
      select.value = totens[0].id;
      window.Pages.loadHorarios();
    }
  }
};

window.Pages.loadHorarios = async function() {
  const select = document.getElementById('horarios-ponto-select');
  if(!select || !select.value) {
    alert("Por favor, selecione um ponto ou totem.");
    return;
  }

  const totemId = select.value;
  const loadingEl = document.getElementById('horarios-loading');
  const resultsEl = document.getElementById('horarios-resultados');
  
  if (loadingEl) loadingEl.style.display = 'block';
  if (resultsEl) resultsEl.style.display = 'none';

  let data = null;
  try {
    const res = await fetch(`http://localhost:3000/api/v1/transport/totem/${totemId}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) data = await res.json();
  } catch(_) {}

  if (!data && window.AppData && window.AppData.getTotemTransitData) {
    try {
      data = await window.AppData.getTotemTransitData(totemId);
    } catch(e) {
      console.warn('[HORARIOS] Falha ao obter dados:', e);
    }
  }

  if (loadingEl) loadingEl.style.display = 'none';
  if (resultsEl) resultsEl.style.display = 'block';

  const stationName = data?.stop?.name || data?.totem_name || 'Totem Selecionado';
  const stLabel = document.getElementById('horarios-station-name');
  if (stLabel) stLabel.textContent = `Ponto: ${stationName}`;

  const cardsContainer = document.getElementById('horarios-cards-container');
  const tableBody = document.getElementById('horarios-table-body');
  
  const lines = data?.lines || [];

  if (lines.length === 0) {
    if (cardsContainer) cardsContainer.innerHTML = '<div style="color:#6B7280; padding:20px;">Nenhuma linha vinculada a este ponto no momento.</div>';
    if (tableBody) tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#6B7280;">Sem horários programados.</td></tr>';
    return;
  }

  // Render top 3 ETA cards
  const topArrivals = lines.filter(l => l.eta_minutes !== null).slice(0, 3);
  if (cardsContainer) {
    if (topArrivals.length === 0) {
      cardsContainer.innerHTML = lines.slice(0, 3).map(l => `
        <div style="background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
          <div style="font-size:1.1em; font-weight:bold; color:#0F172A; margin-bottom:8px;">${l.line || l.route_id} - ${l.name || l.direction || ''}</div>
          <div>
            <div style="color:#64748b; font-size:0.85em;">Status:</div>
            <div style="font-size:1.4em; font-weight:bold; color:#3B82F6;">Programado</div>
          </div>
        </div>
      `).join('');
    } else {
      cardsContainer.innerHTML = topArrivals.map(l => {
        const isArriving = l.eta_minutes <= 3;
        const color = isArriving ? '#10B981' : (l.eta_minutes > 15 ? '#EF4444' : '#F59E0B');
        return `
          <div style="background:#f8fafc; padding:16px; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
            <div style="font-size:1.1em; font-weight:bold; color:#0F172A; margin-bottom:8px;">${l.line || l.route_id} - ${l.name || l.direction || ''}</div>
            <div>
              <div style="color:#64748b; font-size:0.85em;">Previsão de Chegada:</div>
              <div style="font-size:1.8em; font-weight:bold; color:${color};">${l.eta_minutes} min ${l.distance_km ? `<span style="font-size:0.5em; color:#6B7280; font-weight:normal;">(${l.distance_km} km)</span>` : ''}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Render Table
  if (tableBody) {
    tableBody.innerHTML = lines.map(l => {
      const etaLabel = l.eta_minutes !== null ? `${l.eta_minutes} min` : 'Programado';
      const distLabel = l.distance_km !== null ? `${l.distance_km} km` : '-';
      const statusLabel = l.eta_minutes !== null ? (l.eta_minutes <= 3 ? 'Chegando' : 'No Horário') : 'Em Trânsito';
      const badgeBg = l.eta_minutes !== null && l.eta_minutes <= 3 ? '#D1FAE5' : '#DBEAFE';
      const badgeColor = l.eta_minutes !== null && l.eta_minutes <= 3 ? '#065F46' : '#1E40AF';
      const cor = l.color ? (l.color.startsWith('#') ? l.color : '#' + l.color) : '#2D9B5A';

      return `
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 16px;">
            <span style="background:${cor}; color:#fff; padding:4px 10px; border-radius:6px; font-weight:700; font-size:12px;">
              ${l.line || l.route_id}
            </span>
          </td>
          <td style="padding: 12px 16px;"><strong>${l.name || l.direction || 'Transcol'}</strong></td>
          <td style="padding: 12px 16px; font-weight:600;">${etaLabel}</td>
          <td style="padding: 12px 16px; color:#6B7280;">${distLabel}</td>
          <td style="padding: 12px 16px;">
            <span style="color:${badgeColor}; font-weight:600; background:${badgeBg}; padding:4px 8px; border-radius:4px; font-size:12px;">
              ${statusLabel}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }
};
