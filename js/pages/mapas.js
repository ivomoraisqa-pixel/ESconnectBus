window.Pages = window.Pages || {};
window.Pages.mapas = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  const totens = window.AppData ? (await window.AppData.getTotens() || []) : [];
  const busStops = window.AppData ? (await window.AppData.getBusStops() || []) : [];
  const linhas = window.AppData ? (await window.AppData.getLinhas() || []) : [];

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Mapas e Pontos de Parada</h1>
        <p>Gestão geoespacial da malha de transporte e cobertura de totens na Serra</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.Router.navigate('totens')">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Novo Totem
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Pontos Cadastrados',
        value: busStops.length > 0 ? busStops.length.toLocaleString('pt-BR') : '1.970',
        subtitle: 'Paradas Mapeadas na Serra',
        icon: window.Components.icon('map-pin', 24),
        iconBg: '#DBEAFE',
        iconColor: '#1E40AF',
        borderColor: '#3B82F6'
      }) : `<div class="kpi-card">Pontos: ${busStops.length}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Totens Instalados',
        value: totens.length.toString(),
        subtitle: 'Dispositivos Conectados',
        icon: window.Components.icon('monitor', 24),
        iconBg: '#D1FAE5',
        iconColor: '#065F46',
        borderColor: '#10B981'
      }) : `<div class="kpi-card">Totens: ${totens.length}</div>`}

      ${window.Components.kpiCard ? window.Components.kpiCard({
        title: 'Rotas Transcol',
        value: linhas.length.toString(),
        subtitle: 'Linhas Integradas',
        icon: window.Components.icon('git-branch', 24),
        iconBg: '#EDE9FE',
        iconColor: '#6B21A8',
        borderColor: '#8B5CF6'
      }) : `<div class="kpi-card">Linhas: ${linhas.length}</div>`}
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <div class="card-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">Mapa da Rede de Transporte e Totens</h3>
        <div style="display:flex; gap:16px; font-size:12px; align-items:center;">
          <span style="display:flex; align-items:center; gap:6px;"><span style="width:12px; height:12px; border-radius:50%; background:#10B981; display:inline-block;"></span> Totem Online</span>
          <span style="display:flex; align-items:center; gap:6px;"><span style="width:10px; height:10px; border-radius:50%; background:#3B82F6; display:inline-block;"></span> Ponto de Ônibus</span>
        </div>
      </div>
      <div class="card-body" style="padding:0;">
        <div id="mapas-leaflet-container" style="width:100%; height:520px; border-radius:0 0 12px 12px;"></div>
      </div>
    </div>
  `;

  main.innerHTML = html;

  setTimeout(() => {
    if (!window.L) return;
    const mapEl = document.getElementById('mapas-leaflet-container');
    if (!mapEl) return;

    const map = L.map('mapas-leaflet-container').setView([-20.2108, -40.2573], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    }).addTo(map);

    // Add Bus Stops (points)
    busStops.slice(0, 300).forEach(bs => {
      if (!bs.latitude || !bs.longitude) return;
      L.circleMarker([bs.latitude, bs.longitude], {
        radius: 4,
        fillColor: '#3B82F6',
        color: '#ffffff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.7
      }).addTo(map).bindPopup(`<b>${bs.name || bs.code}</b><br/>${bs.address || 'Serra - ES'}`);
    });

    // Add Totems (larger green markers)
    totens.forEach(t => {
      const lat = t.lat || t.latitude || -20.2108;
      const lng = t.lng || t.longitude || -40.2573;
      const totemIcon = L.divIcon({
        className: 'totem-map-pin',
        html: `<div style="background:#10B981; color:white; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 6px rgba(0,0,0,0.4); font-size:14px;">🚏</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      L.marker([lat, lng], { icon: totemIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif; min-width:180px;">
            <strong style="color:#10B981; font-size:14px;">${t.nome}</strong><br/>
            <span style="font-size:12px; color:#6B7280;">${t.localizacao || ''}</span><br/>
            <span style="font-size:11px; font-weight:600; color:#065F46; background:#D1FAE5; padding:2px 6px; border-radius:4px; margin-top:4px; display:inline-block;">Status: ${t.status || 'online'}</span>
          </div>
        `);
    });
  }, 200);
};
