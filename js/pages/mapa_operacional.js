window.Pages = window.Pages || {};

Pages.mapaOperacional = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  
  main.innerHTML = `
    <div style="position:relative; width:100%; height:100%; min-height:800px; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      
      <!-- Filtros Flutuantes (Overlay) -->
      <div style="position:absolute; top:20px; left:20px; z-index:1000; background:white; padding:16px; border-radius:8px; box-shadow:0 4px 6px rgba(0,0,0,0.1); width:320px;">
        <div style="font-weight:700; font-size:16px; margin-bottom:12px; color:#1A1A2E;">Filtros do Mapa</div>
        
        <div style="margin-bottom:12px;">
          <label style="font-size:12px; font-weight:600; color:#6B7280; display:block; margin-bottom:4px;">Camadas</label>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <label style="display:flex; align-items:center; gap:8px; font-size:13px;"><input type="checkbox" id="layer-totens" checked> 🖥️ Totens (Online/Offline)</label>
            <label style="display:flex; align-items:center; gap:8px; font-size:13px;"><input type="checkbox" id="layer-buses" checked> 🚌 Ônibus em Tempo Real</label>
            <label style="display:flex; align-items:center; gap:8px; font-size:13px;"><input type="checkbox" id="layer-stops" checked> 🚏 Pontos de Parada</label>
          </div>
        </div>

        <div>
          <label style="font-size:12px; font-weight:600; color:#6B7280; display:block; margin-bottom:4px;">Buscar</label>
          <input type="text" class="form-input" style="width:100%; padding:8px; border:1px solid #D1D5DB; border-radius:4px;" placeholder="Linha, Bairro ou Totem...">
        </div>
      </div>

      <!-- Container do Mapa -->
      <div id="mapa-operacional-leaflet" style="width:100%; height:100%;"></div>
    </div>
  `;

  setTimeout(async () => {
    const mapEl = document.getElementById('mapa-operacional-leaflet');
    if (!mapEl) return;
    
    if (window.opMap) {
      window.opMap.remove();
    }

    window.opMap = L.map('mapa-operacional-leaflet').setView([-20.1265, -40.3079], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(window.opMap);

    // Criando Grupos de Camadas para os Filtros funcionarem
    const totensLayerGroup = L.layerGroup().addTo(window.opMap);
    const busesLayerGroup = L.layerGroup().addTo(window.opMap);
    const stopsLayerGroup = L.layerGroup().addTo(window.opMap);

    // Eventos dos checkboxes
    document.getElementById('layer-totens').addEventListener('change', (e) => {
      e.target.checked ? window.opMap.addLayer(totensLayerGroup) : window.opMap.removeLayer(totensLayerGroup);
    });
    document.getElementById('layer-buses').addEventListener('change', (e) => {
      e.target.checked ? window.opMap.addLayer(busesLayerGroup) : window.opMap.removeLayer(busesLayerGroup);
    });
    document.getElementById('layer-stops').addEventListener('change', (e) => {
      e.target.checked ? window.opMap.addLayer(stopsLayerGroup) : window.opMap.removeLayer(stopsLayerGroup);
    });

    // 1. Fetch real totens from database
    const totensDB = (window.AppData ? await window.AppData.getTotens() : []) || [];
    const totens = totensDB.length > 0 ? totensDB : [
      { id: '1', lat: -20.1265, lng: -40.3079, nome: 'Terminal Laranjeiras', status: 'online' },
      { id: '2', lat: -20.1365, lng: -40.3179, nome: 'Hospital Dório Silva', status: 'online' },
      { id: '3', lat: -20.1165, lng: -40.2979, nome: 'Shopping Montserrat', status: 'offline' }
    ];

    totens.forEach(t => {
      const nome = t.nome || t.name || 'Totem Desconhecido';
      const color = t.status === 'online' ? '#10B981' : '#EF4444';
      const markerHtml = `<div style="background:${color}; width:20px; height:20px; border-radius:50%; border:3px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`;
      const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [20, 20] });
      
      const tData = encodeURIComponent(JSON.stringify(t)).replace(/'/g, "%27");
      L.marker([t.lat || -20.1265, t.lng || -40.3079], { icon }).addTo(totensLayerGroup)
        .bindPopup(`<b>${nome}</b><br>Status: ${t.status ? t.status.toUpperCase() : 'DESCONHECIDO'}`);
    });

    // 2. Ônibus (Realtime Global GTFS-RT)
    let globalVehicleMarkers = {};

    async function fetchLiveFleet() {
      try {
        const res = await fetch('http://localhost:3000/api/v1/transport/vehicles');
        if(!res.ok) return;
        const data = await res.json();
        
        // Atualiza painel CCO
        const busCountEl = document.querySelector('div:nth-child(2) > div:nth-child(1)');
        if(busCountEl && data.total_active) {
          busCountEl.textContent = data.total_active;
        }

        data.vehicles.forEach(b => {
          if(!globalVehicleMarkers[b.vehicle_id]) {
            const markerHtml = `<div style="background:#3B82F6; color:white; font-size:10px; font-weight:bold; padding:4px 6px; border-radius:4px; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3); white-space:nowrap;">🚌 ${b.line}</div>`;
            const icon = L.divIcon({ html: markerHtml, className: '', iconSize: [40, 20], iconAnchor: [20, 10] });
            
            globalVehicleMarkers[b.vehicle_id] = L.marker([b.lat, b.lng], { icon })
              .addTo(busesLayerGroup)
              .bindPopup(`<b>Veículo: ${b.vehicle_id}</b><br>Linha ${b.line}<br>Destino: ${b.dir}<br>Velocidade: ${b.speed} km/h`);
          } else {
            // Se o ônibus já existe no mapa, apenas move (Animação de CCO)
            globalVehicleMarkers[b.vehicle_id].setLatLng([b.lat, b.lng]);
          }
        });
      } catch (err) {
        console.warn("API de Frota Global indisponível.", err);
      }
    }

    // Iniciar GTFS-RT tracker do CCO
    fetchLiveFleet();
    setInterval(fetchLiveFleet, 3000); // Polling CCO de 3 segundos

    // 3. Pontos de Parada (Fixos do Supabase — sem Overpass API)
    async function loadBusStopsFromDB() {
      try {
        const stops = await window.AppData.getBusStops();
        if (!stops || stops.length === 0) {
          console.warn('[MAPA] Nenhum ponto de ônibus cadastrado em bus_stops.');
          return;
        }

        stops.forEach(stop => {
          if (!stop.latitude || !stop.longitude) return;

          const iconHtml = `
            <div style="background-color: #F59E0B; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 10px;">🚏</span>
            </div>
          `;
          const icon = L.divIcon({
            className: 'custom-bus-stop-icon',
            html: iconHtml,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          const marker = L.marker([stop.latitude, stop.longitude], { icon }).addTo(stopsLayerGroup);

          // Popup inicial com loading
          marker.bindPopup(`
            <div style="min-width:200px;">
              <b style="font-size:14px;">${stop.name}</b><br>
              <small style="color:#6B7280;">${stop.address || stop.city || ''}</small><br>
              <small style="color:#9CA3AF;">Código: ${stop.code}</small><br>
              <div id="popup-lines-${stop.code}" style="margin-top:8px; color:#9CA3AF; font-size:12px;">Clique para ver as linhas...</div>
            </div>
          `);

          // Ao abrir o popup, busca as linhas reais
          marker.on('popupopen', async () => {
            const container = document.getElementById(`popup-lines-${stop.code}`);
            if (!container) return;

            container.innerHTML = '<div style="color:#3B82F6; font-size:12px;">⏳ Carregando linhas...</div>';

            try {
              const routes = await window.AppData.getRoutesByStop(stop.code);

              if (!routes || routes.length === 0) {
                container.innerHTML = '<div style="color:#9CA3AF; font-size:12px;">Nenhuma linha cadastrada.</div>';
                return;
              }

              container.innerHTML = `
                <div style="font-size:11px; font-weight:600; color:#374151; margin-bottom:6px;">LINHAS DESTA ESTAÇÃO (${routes.length})</div>
                ${routes.map(sr => {
                  const r = sr.routes || {};
                  const codigo = r.codigo || r.route_short_name || sr.route_id;
                  const nome = r.nome || '';
                  const cor = r.route_color || '3B82F6';
                  const dir = sr.direction || '';
                  return `
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid #F3F4F6;">
                      <span style="background:#${cor.replace('#','')}; color:white; padding:2px 8px; border-radius:4px; font-weight:700; font-size:12px; min-width:36px; text-align:center;">${codigo}</span>
                      <div style="flex:1;">
                        <div style="font-size:12px; font-weight:500; color:#1F2937;">${nome}</div>
                        ${dir ? `<div style="font-size:10px; color:#9CA3AF;">→ ${dir}</div>` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              `;

              // Atualiza o popup pra expandir corretamente
              marker.getPopup().update();
            } catch (err) {
              console.error('[MAPA] Erro ao buscar linhas:', err);
              container.innerHTML = '<div style="color:#EF4444; font-size:12px;">Erro ao carregar linhas.</div>';
            }
          });
        });

        console.log(`[MAPA] ${stops.length} pontos de ônibus carregados do Supabase.`);
      } catch (err) {
        console.error('[MAPA] Erro ao carregar pontos de ônibus:', err);
      }
    }

    // Carrega os pontos de ônibus UMA VEZ (fixos, sem recarregar ao mover o mapa)
    loadBusStopsFromDB();

  }, 100);
};

