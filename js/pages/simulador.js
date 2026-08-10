window.Pages = window.Pages || {};

// ════════════════════════════════════════════════════════════
// SIMULADOR DO TOTEM — Dados Reais via API / Supabase
// ════════════════════════════════════════════════════════════
Pages.simulador = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;

  // Carrega totens e estações reais
  const [totens, busStops] = await Promise.all([
    window.AppData.getTotens ? window.AppData.getTotens() : [],
    window.AppData.getBusStops ? window.AppData.getBusStops() : []
  ]);

  main.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:20px; height:100%;">
      <div class="card" style="background:white; border-radius:12px; padding:20px; display:flex; align-items:center; gap:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1); flex-wrap:wrap;">
        <div style="font-weight:600; font-size:16px;">Selecione o Totem para Simular:</div>
        <select id="sim-totem-select" class="form-input form-select" style="flex:1; max-width:360px; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" onchange="Pages.onSimuladorTotemChange(this.value)">
          <option value="">Selecione um Totem...</option>
          ${totens.map(t => `<option value="${t.id}">${t.nome} (${t.status})</option>`).join('')}
        </select>

        <div style="font-weight:600; font-size:16px; color:#6B7280;">ou</div>

        <div style="font-weight:600; font-size:16px;">Selecione a Estação:</div>
        <select id="sim-stop-select" class="form-input form-select" style="flex:1; max-width:360px; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" onchange="Pages.onSimuladorStopChange(this.value)">
          <option value="">Selecione uma Estação...</option>
          ${busStops.map(s => `<option value="${s.code}">${s.name}</option>`).join('')}
          ${busStops.length === 0 ? `
            <option value="ST-TL01">Terminal Laranjeiras</option>
            <option value="ST-SM02">Shopping Montserrat</option>
            <option value="ST-CM03">Carone Mall</option>
            <option value="ST-HDS06">Hospital Dório Silva</option>
          ` : ''}
        </select>

        <button class="btn btn-primary" onclick="Pages.iniciarSimulador()" style="padding:10px 20px; white-space:nowrap;">
          ▶ Iniciar Simulador
        </button>
      </div>

      <div id="sim-status-bar" style="display:none; padding:12px 20px; background:#EFF6FF; border:1px solid #BFDBFE; border-radius:8px; font-size:13px; color:#1E40AF; display:flex; align-items:center; gap:10px;">
        <span id="sim-status-text">Carregando dados da estação...</span>
      </div>

      <div id="simulador-container" style="flex:1; background:#F9FAFB; border-radius:12px; display:flex; justify-content:center; align-items:flex-start; overflow:hidden; padding:40px; box-shadow:inset 0 2px 10px rgba(0,0,0,0.05); min-height:800px;">
        <div style="text-align:center; color:#9CA3AF;">
          ${window.Components ? window.Components.icon('monitor', 64) : '🖥️'}
          <div style="margin-top:16px; font-size:16px;">Selecione um Totem ou Estação acima para iniciar o simulador.</div>
          <div style="margin-top:8px; font-size:13px; color:#6B7280;">Os dados exibidos serão apenas das linhas vinculadas à estação selecionada.</div>
        </div>
      </div>
    </div>
  `;

  window._simCurrentStopId = null;
  window._simCurrentTotemId = null;
  window._simInterval = null;
};

Pages.onSimuladorTotemChange = async function(totemId) {
  if (!totemId) return;
  document.getElementById('sim-stop-select').value = '';
  window._simCurrentTotemId = totemId;
  window._simCurrentStopId = null;
};

Pages.onSimuladorStopChange = function(stopId) {
  if (!stopId) return;
  document.getElementById('sim-totem-select').value = '';
  window._simCurrentStopId = stopId;
  window._simCurrentTotemId = null;
};

Pages.iniciarSimulador = async function() {
  const totemId = window._simCurrentTotemId || document.getElementById('sim-totem-select').value;
  const stopId  = window._simCurrentStopId  || document.getElementById('sim-stop-select').value;

  if (!totemId && !stopId) {
    alert('Selecione um Totem ou uma Estação para simular.');
    return;
  }

  const statusBar  = document.getElementById('sim-status-bar');
  const statusText = document.getElementById('sim-status-text');
  statusBar.style.display = 'flex';
  statusText.textContent  = '🔄 Buscando dados da estação...';

  try {
    let transitData;
    let stationName = 'Estação';

    if (totemId) {
      // Via Totem ID — busca estação vinculada
      transitData = await window.AppData.getTotemTransitData(totemId);
      stationName = transitData.stop?.name || transitData.totem_name || 'Totem';
    } else {
      // Via Stop ID — busca direto
      const stopRoutes = await window.AppData.getRoutesByStop(stopId);
      const routeIds   = stopRoutes.map(sr => sr.route_id);
      const [vehicles, arrivals, station] = await Promise.all([
        window.AppData.getVehiclesByRoutes(routeIds),
        window.AppData.getArrivalsByStop(stopId),
        window.AppData.getBusStopByCode(stopId)
      ]);
      stationName = station?.name || stopId;
      const lines = stopRoutes.map(sr => {
        const r = sr.routes || {};
        const arrival = arrivals.find(a => a.route_id === sr.route_id);
        return {
          route_id: sr.route_id, line: r.codigo || sr.route_id, name: r.nome || '',
          color: r.route_color || '3B82F6', direction: sr.direction || '',
          eta_minutes: arrival?.eta_minutes ?? null, distance_km: arrival?.distance_km ?? null,
          status: arrival?.status || 'no_data'
        };
      }).sort((a, b) => (a.eta_minutes ?? 999) - (b.eta_minutes ?? 999));
      transitData = { stop: station, lines, vehicles, arrivals };
    }

    const totalLinhas = transitData.lines?.length || 0;
    if (totalLinhas === 0) {
      statusText.textContent = '⚠️ Nenhuma linha vinculada a esta estação. Configure em Gerenciar Totens.';
      statusBar.style.background = '#FFFBEB';
      statusBar.style.borderColor = '#FDE68A';
      statusBar.style.color = '#92400E';
    } else {
      statusText.textContent = `✅ ${totalLinhas} linha(s) carregada(s) para ${stationName}`;
      statusBar.style.background = '#ECFDF5';
      statusBar.style.borderColor = '#A7F3D0';
      statusBar.style.color = '#065F46';
    }

    Pages.renderSimuladorTotemFrame(stationName, transitData);

    // Auto-atualização a cada 30s
    if (window._simInterval) clearInterval(window._simInterval);
    window._simInterval = setInterval(() => Pages.iniciarSimulador(), 30000);

  } catch (err) {
    console.error('[SIMULADOR] Erro:', err);
    statusText.textContent = '❌ Erro ao carregar dados: ' + err.message;
    statusBar.style.background = '#FEF2F2';
    statusBar.style.borderColor = '#FECACA';
    statusBar.style.color = '#991B1B';
  }
};

Pages.renderSimuladorTotemFrame = function(stationName, transitData) {
  const container = document.getElementById('simulador-container');
  if (!container) return;

  const lines    = transitData.lines    || [];
  const vehicles = transitData.vehicles || [];

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

  // Monta lista de ônibus — APENAS os vinculados à estação
  const busRows = lines.length === 0
    ? `<div style="padding:60px 40px; text-align:center; color:#9CA3AF; font-size:36px;">Nenhuma linha cadastrada para esta estação.</div>`
    : lines.map(l => {
        const etaLabel = l.eta_minutes !== null ? `${l.eta_minutes} min` : 'Sem previsão';
        const distLabel = l.distance_km !== null ? `${l.distance_km.toFixed(1)} km` : '';
        const bgColor  = '#' + (l.color || '3B82F6').replace('#','');
        const statusDot = l.status === 'delayed' ? '🔴' : l.status === 'on_time' ? '🟢' : '⚪';
        return `
          <div style="display:flex; align-items:center; padding:28px 40px; border-bottom:2px solid #eee; gap:28px;">
            <span style="background:#${bgColor}; color:white; padding:14px 20px; border-radius:10px; font-weight:700; font-size:38px; min-width:120px; text-align:center; letter-spacing:1px;">${l.line}</span>
            <div style="flex:1;">
              <div style="font-size:36px; font-weight:600; color:#1A1A2E;">${l.name || l.direction || 'Destino'}</div>
              ${distLabel ? `<div style="font-size:24px; color:#6B7280; margin-top:4px;">${distLabel}</div>` : ''}
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700; font-size:44px; color:#1A1A2E;">${etaLabel}</div>
              <div style="font-size:20px; color:#6B7280;">${statusDot} ${l.status === 'delayed' ? 'Atrasado' : l.status === 'on_time' ? 'No horário' : ''}</div>
            </div>
          </div>`;
      }).join('');

  container.innerHTML = `
    <!-- Frame do Totem Físico 1080×1920 (scale 0.35) -->
    <div style="width:1080px; height:1920px; transform:scale(0.35); transform-origin:center top; background:#1A1A2E; overflow:hidden; font-family:'Inter', sans-serif; color:white; border:32px solid #111; border-radius:72px; box-sizing:border-box; display:flex; flex-direction:column; box-shadow:0 40px 100px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5);">

      <!-- Topo -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:32px 40px; background:#1A1A2E; flex-shrink:0;">
        <div>
          <div style="font-weight:700; font-size:40px;">SERRA</div>
          <div style="font-size:28px; color:#A3B8B0;">${stationName.toUpperCase()}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:60px;">${timeStr}</div>
          <div style="font-size:24px; color:#A3B8B0;">${dateStr}</div>
        </div>
      </div>

      <!-- Corpo -->
      <div style="flex:1; background:white; display:flex; flex-direction:column; overflow:hidden;">
        <div style="background:#2D9B5A; padding:20px 40px; font-weight:700; font-size:32px; color:white; display:flex; justify-content:space-between; flex-shrink:0;">
          <span>PRÓXIMOS ÔNIBUS</span>
          <span style="font-size:22px; opacity:0.85;">TEMPO REAL</span>
        </div>

        <!-- Lista de linhas — SOMENTE da estação -->
        <div style="background:white; color:#1A1A2E; flex:1; overflow:hidden;">
          ${busRows}
        </div>

        <!-- Área de publicidade -->
        <div style="height:580px; background:#000; position:relative; overflow:hidden; flex-shrink:0;">
          <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #1E3A8A, #3B82F6); color:white; flex-direction:column;">
            <div style="font-size:80px; margin-bottom:30px;">🚌</div>
            <div style="font-size:60px; font-weight:800; margin-bottom:16px; text-align:center;">TRANSPORTE INTELIGENTE</div>
            <div style="font-size:36px; font-weight:500;">Prefeitura da Serra</div>
          </div>
        </div>
      </div>

      <!-- Rodapé -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:28px 40px; background:#1A1A2E; border-top:2px solid #333; flex-shrink:0;">
        <div style="font-size:28px;"><strong style="color:white;">SerraBus</strong> <span style="color:#2D9B5A; font-weight:300;">CONECT</span></div>
        <div style="font-size:24px; color:#A3B8B0;">📶 Wi-Fi Grátis</div>
      </div>
    </div>
  `;
};
