window.Pages = window.Pages || {};
window.Pages.localizacoes = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const totens = window.AppData ? (await window.AppData.getTotens() || []) : [];
  const online = totens.filter(t => t.status === 'online').length;

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Localizações dos Totens</h1>
        <p>Pontos de instalação, geolocalização e cobertura territorial no Município da Serra</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.Router.navigate('totens')">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Novo Totem
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Totens Cadastrados',
        value: totens.length.toString(),
        subtitle: 'Pontos Mapeados',
        icon: window.Components.icon('map-pin', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        borderColor: '#3B82F6'
      }) : `<div class="kpi-card">Total: ${totens.length}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Totens Online',
        value: online.toString(),
        subtitle: 'Operação Ativa',
        icon: window.Components.icon('check', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        borderColor: '#10B981'
      }) : `<div class="kpi-card">Online: ${online}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Município',
        value: 'Serra - ES',
        subtitle: 'Grande Vitória',
        icon: window.Components.icon('globe', 24),
        iconBg: '#EDE9FE',
        iconColor: '#6B21A8',
        borderColor: '#8B5CF6'
      }) : '<div class="kpi-card">Serra - ES</div>'}
    </div>

    <div class="grid-2" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;">Mapa de Distribuição dos Totens</h3>
        </div>
        <div class="card-body" style="padding:0;">
          <div id="localizacoes-leaflet-map" style="width:100%; height:480px; border-radius:0 0 12px 12px;"></div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;">Lista de Endereços</h3>
        </div>
        <div class="card-body" style="padding: 0; max-height:480px; overflow-y:auto;">
          <ul style="list-style:none; margin:0; padding:0;">
            ${totens.length === 0 ? `
              <li style="padding:24px; text-align:center; color:#6B7280;">Nenhum totem cadastrado ainda.</li>
            ` : totens.map(t => {
              const statusColor = t.status === 'online' ? '#10B981' : '#EF4444';
              return `
                <li style="padding: 16px 20px; border-bottom: 1px solid #F3F4F6; display:flex; align-items:flex-start; gap:12px;">
                  <span style="width:10px; height:10px; border-radius:50%; background:${statusColor}; margin-top:6px; flex-shrink:0;"></span>
                  <div style="flex:1;">
                    <strong style="color:#1A1A2E; font-size:14px;">${t.nome}</strong><br>
                    <small style="color:#6B7280; font-size:12px;">${t.localizacao || t.endereco || 'Serra - ES'}</small><br>
                    <span style="font-size:11px; color:#9CA3AF; margin-top:4px; display:inline-block;">ID: #${t.id} • Lat: ${t.lat || t.latitude || '-'} Lng: ${t.lng || t.longitude || '-'}</span>
                  </div>
                </li>
              `;
            }).join('')}
          </ul>
        </div>
      </div>
    </div>
  `;

  main.innerHTML = html;

  setTimeout(() => {
    if (!window.L) return;
    const mapEl = document.getElementById('localizacoes-leaflet-map');
    if (!mapEl) return;

    const map = L.map('localizacoes-leaflet-map').setView([-20.2108, -40.2573], 12);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    totens.forEach(t => {
      const lat = t.lat || t.latitude || -20.2108;
      const lng = t.lng || t.longitude || -40.2573;
      const isOnline = t.status === 'online';
      const color = isOnline ? '#10B981' : '#EF4444';

      const icon = L.divIcon({
        className: 'custom-totem-pin',
        html: `<div style="background:${color}; color:white; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:14px;">🚏</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;">
            <strong style="color:#1A1A2E; font-size:14px;">${t.nome}</strong><br/>
            <span style="font-size:12px; color:#6B7280;">${t.localizacao || ''}</span><br/>
            <span style="font-size:11px; font-weight:600; color:${isOnline ? '#065F46' : '#991B1B'}; background:${isOnline ? '#D1FAE5' : '#FEE2E2'}; padding:2px 6px; border-radius:4px; margin-top:6px; display:inline-block;">Status: ${t.status || 'online'}</span>
          </div>
        `);
    });
  }, 200);
};
