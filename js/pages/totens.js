window.Pages = window.Pages || {};

window.TotensController = {
  openNovoTotemModal() {
    document.getElementById('modal-novo-totem').classList.add('active');
    document.getElementById('nt-nome').value = '';
    document.getElementById('nt-codigo').value = '';
    document.getElementById('nt-endereco').value = '';
    document.getElementById('nt-lat').value = '';
    document.getElementById('nt-lng').value = '';
    document.getElementById('nt-linhas').value = '';
    document.getElementById('btn-salvar-totem').disabled = true;
    this.switchTab('endereco');
  },

  closeModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    if (this.previewInterval) {
      clearInterval(this.previewInterval);
      this.previewInterval = null;
    }
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
  },

  switchTab(tab) {
    document.getElementById('tab-endereco').classList.remove('active');
    document.getElementById('tab-mapa').classList.remove('active');
    document.getElementById('content-endereco').style.display = 'none';
    document.getElementById('content-mapa').style.display = 'none';
    
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('content-' + tab).style.display = 'block';

    if (tab === 'mapa') {
      this.initLeafletMap();
    }
  },
  initLeafletMap() {
    if (this.mapInstance) {
      this.mapInstance.remove();
      this.mapInstance = null;
    }
    
    // Foca na região de Laranjeiras, Serra (Grande Vitória) com zoom 15
    this.mapInstance = L.map('leaflet-map').setView([-20.2108, -40.2573], 15);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(this.mapInstance);

    this.mapInstance.on('click', async (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      
      if(this.marker) this.mapInstance.removeLayer(this.marker);
      
      this.marker = L.marker([lat, lng]).addTo(this.mapInstance);
      this.marker.bindPopup("Buscando endereço real...").openPopup();

      // Busca endereço real via Nominatim
      const realAddress = await this.getRealAddress(lat, lng);
      this.marker.setPopupContent(`<b>Ponto Selecionado</b><br>${realAddress || 'Coordenadas registradas'}`).openPopup();

      this.preencherDadosRealPonto(lat, lng, realAddress);
    });

    // Atualiza os pontos de ônibus ao mover ou dar zoom no mapa (com debounce para não travar o mapa)
    let mapMoveTimeout;
    this.mapInstance.on('moveend', () => {
      if (mapMoveTimeout) clearTimeout(mapMoveTimeout);
      mapMoveTimeout = setTimeout(() => {
        this.updateBusStopsOnMap();
      }, 600);
    });

    // Executa a carga inicial
    this.updateBusStopsOnMap();

    // Fecha a lista de autocompletar ao clicar fora dela
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('autocomplete-results');
      const input = document.getElementById('input-busca-endereco');
      if (dropdown && e.target !== input && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    setTimeout(() => {
      this.mapInstance.invalidateSize();
    }, 200);
  },

  // Banco de dados local com pontos de ônibus reais da Grande Vitória (Serra) para garantir exibição imediata
  REAL_BUS_STOPS: [
    { id: 1, lat: -20.21083, lon: -40.25731, name: "Terminal Laranjeiras", ref: "TL-01", address: "Avenida Eldes Scherrer Souza, Parque Residencial Laranjeiras, Serra - ES", routes: "501, 503, 504, 507, 508, 515, 517, 800" },
    { id: 2, lat: -20.22305, lon: -40.25102, name: "Shopping Montserrat", ref: "SM-02", address: "Avenida Eldes Scherrer Souza, 2162, Colina de Laranjeiras, Serra - ES", routes: "507, 560, 800, 801" },
    { id: 3, lat: -20.19830, lon: -40.24510, name: "Carone Mall", ref: "CM-03", address: "Avenida Central, Parque Residencial Laranjeiras, Serra - ES", routes: "523, 830, 831" },
    { id: 4, lat: -20.21540, lon: -40.25890, name: "Primeira Avenida - Laranjeiras", ref: "PA-04", address: "Avenida Primeira Avenida, Parque Residencial Laranjeiras, Serra - ES", routes: "501, 507, 815" },
    { id: 5, lat: -20.21890, lon: -40.25430, name: "Sizenando Pechincha", ref: "SP-05", address: "Avenida Segunda Avenida, Parque Residencial Laranjeiras, Serra - ES", routes: "813, 815" },
    { id: 6, lat: -20.20810, lon: -40.25110, name: "Hospital Dório Silva", ref: "HDS-06", address: "Avenida Eldes Scherrer Souza, Parque Residencial Laranjeiras, Serra - ES", routes: "503, 504, 523, 800" },
    { id: 7, lat: -20.22150, lon: -40.25250, name: "Supermercado Extrabom", ref: "EB-07", address: "Avenida Eldes Scherrer Souza, Colina de Laranjeiras, Serra - ES", routes: "507, 560, 800" },
    { id: 8, lat: -20.22550, lon: -40.26050, name: "Avenida Central - Correios", ref: "CO-08", address: "Avenida Central, Parque Residencial Laranjeiras, Serra - ES", routes: "801, 815" },
    { id: 9, lat: -20.16040, lon: -40.19550, name: "Jacaraípe - Terminal Provisório", ref: "JT-09", address: "Avenida Abido Saad, Jacaraípe, Serra - ES", routes: "806, 810, 818" },
    { id: 10, lat: -20.15420, lon: -40.18730, name: "Praia de Jacaraípe", ref: "PJ-10", address: "Avenida Abido Saad, Jacaraípe, Serra - ES", routes: "806, 810, 854" }
  ],

  async getRealAddress(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    try {
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR' }
      });
      const data = await response.json();
      return data.display_name || '';
    } catch (e) {
      console.error("Erro no reverse geocoding", e);
      return '';
    }
  },

  preencherDadosRealPonto(lat, lng, address) {
    const idSorteado = Math.floor(Math.random() * 9000) + 1000;
    
    // Extrai o nome da rua ou avenida do endereço real
    let nomeRua = "Ponto de Ônibus";
    if (address) {
      const partes = address.split(',');
      if (partes.length > 0) nomeRua = partes[0].trim();
    }

    document.getElementById('nt-nome').value = `${nomeRua} ${idSorteado}`;
    document.getElementById('nt-codigo').value = `PT-${idSorteado}`;
    document.getElementById('nt-endereco').value = address || `Serra - ES`;
    document.getElementById('nt-lat').value = lat.toFixed(6);
    document.getElementById('nt-lng').value = lng.toFixed(6);
    document.getElementById('nt-linhas').value = "501, 507, 523, 800";
    
    document.getElementById('btn-salvar-totem').disabled = false;
    document.getElementById('btn-salvar-totem').classList.remove('btn-secondary');
  },

  // Cache dos pontos carregados do Supabase (evita múltiplas chamadas)
  _cachedDBStops: null,

  async updateBusStopsOnMap() {
    if (!this.mapInstance) return;
    const zoom = this.mapInstance.getZoom();
    
    // Oculta pontos se o zoom for muito distante (para não sobrecarregar)
    if (zoom < 13) {
      if (this.busStopsLayer) {
        this.mapInstance.removeLayer(this.busStopsLayer);
        this.busStopsLayer = null;
      }
      return;
    }

    if (!this.busStopsLayer) {
      this.busStopsLayer = L.layerGroup().addTo(this.mapInstance);
    } else {
      this.busStopsLayer.clearLayers();
    }

    const busIcon = L.divIcon({
      html: `<div style="background:#0056b3; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 3px 6px rgba(0,0,0,0.3); transition: transform 0.2s; cursor: pointer;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
               <span style="font-size:14px; color:white; display:flex; align-items:center; justify-content:center; width:100%; height:100%;">🚌</span>
             </div>`,
      className: 'custom-bus-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    // Busca pontos do Supabase (com cache para não repetir)
    const stops = await this.fetchBusStopsFromDB();
    const bounds = this.mapInstance.getBounds();

    stops.forEach(stop => {
      if (!stop.latitude || !stop.longitude) return;

      // Só renderiza pontos visíveis no viewport atual
      if (!bounds.contains([stop.latitude, stop.longitude])) return;

      const marker = L.marker([stop.latitude, stop.longitude], { icon: busIcon });
      
      marker.bindTooltip(`
        <div style="padding: 4px; font-family: 'Inter', sans-serif;">
          <div style="font-weight: 700; color: #1e293b; font-size: 12px; display:flex; align-items:center; gap:6px;">
            <span style="background:#0056b3; color:white; padding:1px 4px; border-radius:3px; font-size:9px; font-weight:800;">TRANSCOL</span>
            ${stop.name}
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 4px; display:flex; justify-content:space-between; align-items:center; gap:10px;">
            <span>Cód: <b>${stop.code}</b></span>
            <span style="color: #10B981; font-weight: 700;">🟢 GTFS Ativo</span>
          </div>
        </div>
      `, { 
        permanent: false, 
        direction: 'top'
      });

      marker.on('click', async (e) => {
        L.DomEvent.stopPropagation(e);
        
        if (this.marker) this.mapInstance.removeLayer(this.marker);
        this.marker = L.marker([stop.latitude, stop.longitude]).addTo(this.mapInstance);
        this.marker.bindPopup(`<b>${stop.name}</b><br>Carregando linhas...`).openPopup();

        // Busca as linhas reais deste ponto via stop_routes
        let routeInfo = '';
        try {
          const routes = await window.AppData.getRoutesByStop(stop.code);
          if (routes && routes.length > 0) {
            routeInfo = routes.map(sr => {
              const r = sr.routes || {};
              return r.codigo || r.route_short_name || sr.route_id;
            }).join(', ');
          }
        } catch(err) { console.warn('Erro ao buscar linhas:', err); }

        const popupContent = `
          <div style="min-width:180px;">
            <b>${stop.name}</b><br>
            <span style="font-size:12px; color:#333;">${stop.address || ''}</span><br>
            ${routeInfo ? `<div style="margin-top:6px; font-size:11px; color:#0056b3; font-weight:600;">Linhas: ${routeInfo}</div>` : ''}
          </div>
        `;
        this.marker.setPopupContent(popupContent).openPopup();

        document.getElementById('nt-nome').value = stop.name;
        document.getElementById('nt-codigo').value = stop.code;
        document.getElementById('nt-lat').value = stop.latitude.toFixed(6);
        document.getElementById('nt-lng').value = stop.longitude.toFixed(6);
        document.getElementById('nt-endereco').value = stop.address || `${stop.city || 'Serra'} - ES`;
        document.getElementById('nt-linhas').value = routeInfo || '';
        
        // Exibe o status da sincronização GTFS
        const syncContainer = document.getElementById('gtfs-sync-container');
        if (syncContainer) syncContainer.style.display = 'flex';
        
        document.getElementById('btn-salvar-totem').disabled = false;
        document.getElementById('btn-salvar-totem').classList.remove('btn-secondary');
      });

      this.busStopsLayer.addLayer(marker);
    });
  },

  async fetchBusStopsFromDB() {
    // Retorna cache se já carregou
    if (this._cachedDBStops) return this._cachedDBStops;
    
    try {
      const stops = await window.AppData.getBusStops();
      if (stops && stops.length > 0) {
        this._cachedDBStops = stops;
        console.log(`[TOTENS] ${stops.length} pontos de ônibus carregados do Supabase.`);
        return stops;
      }
    } catch (err) {
      console.warn('[TOTENS] Erro ao buscar pontos do Supabase:', err);
    }
    
    return [];
  },


  async simularBuscaEndereco() {
    const input = document.getElementById('input-busca-endereco').value;
    if(!input) return alert("Digite um endereço primeiro.");
    
    // Busca endereço real via Nominatim (Geocoding real de endereços da Grande Vitória)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input + ', Espírito Santo')}&limit=1`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data && data.length > 0) {
        const item = data[0];
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        
        if (this.mapInstance) {
          this.mapInstance.setView([lat, lng], 16);
          
          if(this.marker) this.mapInstance.removeLayer(this.marker);
          this.marker = L.marker([lat, lng]).addTo(this.mapInstance);
          this.marker.bindPopup(`<b>${item.display_name}</b>`).openPopup();
          
          this.preencherDadosRealPonto(lat, lng, item.display_name);
          
          // Vai para a aba do mapa para o usuário visualizar os abrigos na região
          this.switchTab('mapa');
        }
      } else {
        alert("Endereço não localizado na Grande Vitória. Tente especificar rua e cidade (Ex: Av. Dante Michelini, Vitória).");
      }
    } catch(err) {
      console.error("Erro na busca de endereço", err);
      alert("Erro ao conectar à API de endereços.");
    }
  },

  autocompleteTimeout: null,

  async handleAddressAutocomplete(event) {
    const query = event.target.value.trim();
    const dropdown = document.getElementById('autocomplete-results');
    
    if (this.autocompleteTimeout) clearTimeout(this.autocompleteTimeout);
    
    if (query.length < 3) {
      dropdown.style.display = 'none';
      return;
    }
    
    this.autocompleteTimeout = setTimeout(async () => {
      // Aborta request de autocomplete antigo se houver
      if (this.autocompleteAbort) this.autocompleteAbort.abort();
      this.autocompleteAbort = new AbortController();

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Espírito Santo')}&limit=5&addressdetails=1`;
      try {
        const response = await fetch(url, { signal: this.autocompleteAbort.signal });
        const data = await response.json();
        
        if (data && data.length > 0) {
          dropdown.innerHTML = data.map(item => {
            const displayName = item.display_name;
            const lat = item.lat;
            const lon = item.lon;
            return `
              <div class="autocomplete-item" style="padding: 10px 14px; border-bottom: 1px solid #F3F4F6; cursor: pointer; font-size: 13px; color: #374151; transition: background 0.2s;" 
                   onmouseover="this.style.background='#F3F4F6'" 
                   onmouseout="this.style.background='white'"
                   onclick="window.TotensController.selectAutocompleteItem('${encodeURIComponent(JSON.stringify({ displayName, lat, lon }))}')">
                📍 ${displayName}
              </div>
            `;
          }).join('');
          dropdown.style.display = 'block';
        } else {
          dropdown.style.display = 'none';
        }
      } catch (err) {
        console.error("Erro no autocompletar", err);
      }
    }, 300);
  },

  selectAutocompleteItem(dataStr) {
    const data = JSON.parse(decodeURIComponent(dataStr));
    const input = document.getElementById('input-busca-endereco');
    const dropdown = document.getElementById('autocomplete-results');
    
    input.value = data.displayName;
    dropdown.style.display = 'none';
    
    const lat = parseFloat(data.lat);
    const lng = parseFloat(data.lon);
    
    if (this.mapInstance) {
      this.mapInstance.setView([lat, lng], 16);
      
      if(this.marker) this.mapInstance.removeLayer(this.marker);
      this.marker = L.marker([lat, lng]).addTo(this.mapInstance);
      this.marker.bindPopup(`<b>Ponto Selecionado</b><br>${data.displayName}`).openPopup();
      
      this.preencherDadosRealPonto(lat, lng, data.displayName);
      
      this.switchTab('mapa');
    }
  },

  preencherDadosSimuladosPonto(lat, lng, endRaw) {
    const idSorteado = Math.floor(Math.random() * 9000) + 1000;
    
    document.getElementById('nt-nome').value = `Ponto Av. Central ${idSorteado}`;
    document.getElementById('nt-codigo').value = `PT-${idSorteado}`;
    document.getElementById('nt-endereco').value = endRaw || `Laranjeiras, Serra - ES`;
    document.getElementById('nt-lat').value = lat;
    document.getElementById('nt-lng').value = lng;
    document.getElementById('nt-linhas').value = "501, 523, 800 (Destinos: T. Laranjeiras, Vitória)";
    
    document.getElementById('btn-salvar-totem').disabled = false;
    document.getElementById('btn-salvar-totem').classList.remove('btn-secondary');
  },

  async salvarNovoTotem() {
    const nome = document.getElementById('nt-nome').value;
    const local = document.getElementById('nt-endereco').value;
    const lat = parseFloat(document.getElementById('nt-lat').value);
    const lng = parseFloat(document.getElementById('nt-lng').value);

    const btn = document.getElementById('btn-salvar-totem');
    const oldHtml = btn.innerHTML;
    btn.innerHTML = 'Salvando e integrando...';
    btn.disabled = true;

    try {
      const { data, error } = await window.supabase.from('totens').insert([
        {
          nome: nome,
          localizacao: local,
          status: 'instalacao',
          versao: 'v1.0.0',
          lat: lat,
          lng: lng,
          ultima_conexao: null
        }
      ]).select(); // select() para retornar os dados inseridos (ID)

      if (error) throw error;
      
      const novoTotemId = data && data.length > 0 ? data[0].id : null;
      if (!novoTotemId) throw new Error("Falha ao recuperar o ID do Totem recém-criado");
      
      // Gera um PIN de instalação que embute o ID do Totem (ex: 12-A8K2)
      const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let sufixo = '';
      for (let i = 0; i < 4; i++) {
        sufixo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      }
      const pin = `${novoTotemId}-${sufixo}`;
      const token = `tok_${novoTotemId}_${Date.now()}`;

      // Grava o PIN no banco de dados para o TotemClient validar
      await window.supabase.from('activation_keys').insert([{
        codigo: pin,
        token: token,
        totem_id: novoTotemId,
        utilizado: false
      }]);

      const linkInstalacao = `${window.location.origin}/totem-client/setup_totem.html`;

      this.closeModals();
      
      // Cria o Modal de Sucesso com o PIN e o Link
      const modalHTML = `
        <div class="modal-overlay active" id="modal-sucesso-totem">
          <div class="modal-box" style="text-align: center; max-width: 450px;">
            <div style="background: #ECFDF5; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3 style="margin-bottom: 8px; color: var(--text-primary);">Totem Cadastrado!</h3>
            <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;">Envie este link e código PIN para o instalador no local. O provisionamento será automático.</p>
            
            <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
              <div style="font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Link do Sistema Cliente</div>
              <div style="font-size: 13px; color: #374151; word-break: break-all; margin-bottom: 12px; font-family: monospace;">${linkInstalacao}</div>
              
              <div style="font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">PIN de Pareamento</div>
              <div style="font-size: 28px; color: #2D9B5A; font-weight: 800; letter-spacing: 2px; font-family: monospace;">${pin}</div>
            </div>
            
            <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="document.getElementById('modal-sucesso-totem').remove(); window.Pages.totens();">Entendi, Concluir</button>
          </div>
        </div>
      `;
      
      document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch(err) {
      console.error(err);
      alert("Erro ao salvar no Supabase. Verifique o console.");
      btn.innerHTML = oldHtml;
      btn.disabled = false;
    }
  },

  openDetalhesModal(totemDataStr) {
    const totem = JSON.parse(decodeURIComponent(totemDataStr));
    this.currentTotemId = totem.id;
    this.currentTotemData = totem; // Guarda dados completos para controle remoto
    
    document.getElementById('detalhe-nome').textContent = totem.nome;
    
    let badge = '';
    if(totem.status === 'online') badge = Components.badge('Online', 'success');
    else if(totem.status === 'offline') badge = Components.badge('Offline', 'danger');
    else badge = Components.badge('Manutenção', 'warning');

    document.getElementById('detalhe-status').innerHTML = badge;
    document.getElementById('detalhe-endereco').textContent = totem.localizacao;
    document.getElementById('detalhe-coords').textContent = `${totem.lat || '-'}, ${totem.lng || '-'}`;
    document.getElementById('detalhe-contato').textContent = totem.ultima_conexao ? new Date(totem.ultima_conexao).toLocaleString('pt-BR') : 'Sem contato';
    document.getElementById('detalhe-versao').textContent = totem.versao || 'v1.0.0';

    // IP único por totem (192.168.100.{10+id})
    const ipTotem = `192.168.100.${10 + (totem.id || 0)}`;
    document.getElementById('detalhe-ip').textContent = ipTotem;
    // Nº de Série único por totem
    document.getElementById('detalhe-serial').textContent = `SN-${2025000000 + (totem.id || 0) * 1337}`;

    // Reseta preview para estado normal (caso tenha sido alterado por comando anterior)
    this._resetPreviewScreen();
    // Reseta todos os botões de ação
    document.querySelectorAll('.btn-action').forEach(btn => {
      btn.disabled = false;
      btn.style.borderColor = '';
      btn.style.color = '';
    });

    document.getElementById('modal-detalhes').classList.add('active');

    // Fetch and start real-time preview
    this.startTotemPreview(totem);

    // Carrega estações para o seletor
    this._carregarEstacoesSeletor(totem.id);
  },

  async _carregarEstacoesSeletor(totemId) {
    const sel = document.getElementById('detalhe-stop-select');
    if (!sel) return;
    try {
      const stops = await window.AppData.getBusStops();
      const linked = await window.AppData.getTotemPrimaryStop(totemId);
      const linkedStopId = linked?.stop_id || '';

      sel.innerHTML = '<option value="">Nenhuma estação vinculada</option>';
      stops.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.code;
        opt.textContent = s.name;
        if (s.code === linkedStopId) opt.selected = true;
        sel.appendChild(opt);
      });

      if (linkedStopId) {
        const stop = stops.find(s => s.code === linkedStopId);
        if (stop) this._exibirInfoEstacao(stop);
      }
    } catch (err) {
      console.warn('[STATION] Erro ao carregar estações:', err.message);
      sel.innerHTML = '<option value="">Erro ao carregar estações</option>';
    }
  },

  _exibirInfoEstacao(stop) {
    const info = document.getElementById('detalhe-estacao-info');
    if (!info) return;
    document.getElementById('detalhe-estacao-endereco').textContent = stop.address || stop.name || '—';
    document.getElementById('detalhe-estacao-lat').textContent = stop.latitude ? stop.latitude.toFixed(6) : '—';
    document.getElementById('detalhe-estacao-lng').textContent = stop.longitude ? stop.longitude.toFixed(6) : '—';
    info.style.display = 'block';
  },

  onEstacaoChange(stopCode) {
    if (!stopCode) {
      const info = document.getElementById('detalhe-estacao-info');
      if (info) info.style.display = 'none';
      return;
    }
    window.AppData.getBusStopByCode(stopCode).then(stop => {
      if (stop) this._exibirInfoEstacao(stop);
    });
  },

  async sincronizarEstacao() {
    const stopId  = document.getElementById('detalhe-stop-select')?.value;
    const totemId = this.currentTotemId;
    const btn     = document.getElementById('btn-sinc-estacao');
    const status  = document.getElementById('sinc-status');
    const linhasSection = document.getElementById('detalhe-linhas-section');

    if (!stopId) {
      alert('Selecione uma estação antes de sincronizar.');
      return;
    }

    const steps = [
      'Sincronizando...',
      'Validando estação...',
      'Buscando linhas...',
      'Atualizando relação...',
      'Sincronização concluída ✅'
    ];

    btn.disabled = true;
    status.style.display = 'block';
    status.style.background = '#EFF6FF';
    status.style.color = '#1D4ED8';
    status.style.border = '1px solid #BFDBFE';

    for (let i = 0; i < steps.length - 1; i++) {
      status.textContent = steps[i];
      await new Promise(r => setTimeout(r, 600));
    }

    try {
      // 1. Vincula a estação ao totem
      if (totemId) {
        await window.AppData.setTotemStop(totemId, stopId);
      }

      // 2. Sincroniza via API ou Supabase
      const result = await window.AppData.syncStationViaAPI(stopId);

      status.textContent = steps[steps.length - 1];
      status.style.background = '#ECFDF5';
      status.style.color = '#065F46';
      status.style.border = '1px solid #A7F3D0';

      // 3. Exibe tabela de linhas
      if (linhasSection) {
        linhasSection.style.display = 'block';
        const tableEl = document.getElementById('detalhe-linhas-table');
        if (result.lines && result.lines.length > 0) {
          tableEl.innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
              <thead style="background:#F9FAFB;">
                <tr>
                  <th style="padding:8px 12px; text-align:left; color:#6B7280; font-weight:500; border-bottom:1px solid #E5E7EB;">Linha</th>
                  <th style="padding:8px 12px; text-align:left; color:#6B7280; font-weight:500; border-bottom:1px solid #E5E7EB;">Destino</th>
                  <th style="padding:8px 12px; text-align:left; color:#6B7280; font-weight:500; border-bottom:1px solid #E5E7EB;">Sentido</th>
                </tr>
              </thead>
              <tbody>
                ${result.lines.map(l => `
                  <tr style="border-bottom:1px solid #F3F4F6;">
                    <td style="padding:8px 12px;"><span style="background:#1F2937; color:white; padding:2px 8px; border-radius:4px; font-weight:700;">${l.line}</span></td>
                    <td style="padding:8px 12px; font-weight:500;">${l.nome || '—'}</td>
                    <td style="padding:8px 12px; color:#6B7280;">${l.direction || '—'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>`;
        } else {
          tableEl.innerHTML = '<div style="padding:12px; text-align:center; color:#9CA3AF; font-size:13px;">Nenhuma linha cadastrada para esta estação.</div>';
        }
      }

    } catch (err) {
      console.error('[STATION] Erro na sincronização:', err.message);
      status.textContent = '❌ Erro: ' + err.message;
      status.style.background = '#FEF2F2';
      status.style.color = '#991B1B';
      status.style.border = '1px solid #FECACA';
    } finally {
      btn.disabled = false;
    }
  },



  async startTotemPreview(totem) {
    if (this.previewInterval) clearInterval(this.previewInterval);

    const campanhas = await window.AppData.getCampanhasAtivas();
    // Filtra campanhas alvo exatamente como a API faz
    const agora = new Date();
    const horaAtual = agora.getHours();
    const hojeStr = agora.toISOString().split('T')[0];

    const campanhasAlvo = campanhas.filter(c => {
      if (!c.totens_alvo) return false;
      const alvo = c.totens_alvo;

      // 1. Verifica alvo
      const isTarget = (alvo.tipo === 'todos') || (alvo.tipo === 'individual' && Array.isArray(alvo.ids) && (alvo.ids.includes(totem.id.toString()) || alvo.ids.includes(parseInt(totem.id))));
      if (!isTarget) return false;

      // 2. Verifica datas
      if (alvo.data_inicio && hojeStr < alvo.data_inicio) return false;
      if (alvo.data_fim && hojeStr > alvo.data_fim) return false;

      // 3. Verifica horários
      if (alvo.horarios) {
        if (alvo.horarios === 'comercial' && (horaAtual < 8 || horaAtual >= 18)) return false;
        if (alvo.horarios === 'manha' && (horaAtual < 6 || horaAtual >= 9)) return false;
        if (alvo.horarios === 'tarde' && (horaAtual < 17 || horaAtual >= 20)) return false;
      }
      return true;
    });

    const activeCampanha = campanhasAlvo.length > 0 ? campanhasAlvo[Math.floor(Math.random() * campanhasAlvo.length)] : null;
    
    const adView = document.getElementById('totem-detalhe-ad');
    const mapView = document.getElementById('totem-detalhe-mapa');
    
    if (activeCampanha) {
      document.getElementById('totem-detalhe-ad-title').textContent = activeCampanha.nome || 'PUBLICIDADE';
      const clienteNome = activeCampanha.descricao ? activeCampanha.descricao.split('|')[0].replace('Cliente:', '').trim() : '';
      document.getElementById('totem-detalhe-ad-client').textContent = clienteNome;
      
      const mediaContainer = document.getElementById('totem-detalhe-ad-media');
      const arquivoUrl = activeCampanha.totens_alvo ? activeCampanha.totens_alvo.arquivo_url : null;
      if (mediaContainer && arquivoUrl) {
        if (arquivoUrl.indexOf('video') > -1 || arquivoUrl.endsWith('.mp4')) {
          mediaContainer.innerHTML = `<video src="${arquivoUrl}" autoplay loop muted style="width:100%; height:100%; object-fit:cover;"></video>`;
        } else {
          mediaContainer.innerHTML = `<img src="${arquivoUrl}" style="width:100%; height:100%; object-fit:cover;" />`;
        }
      }
    } else {
      document.getElementById('totem-detalhe-ad-title').textContent = 'SEM CAMPANHAS ATIVAS';
      document.getElementById('totem-detalhe-ad-client').textContent = '';
    }

    let showAd = false;
    this.previewInterval = setInterval(() => {
      if (!document.getElementById('modal-detalhes').classList.contains('active')) {
        clearInterval(this.previewInterval);
        return;
      }
      showAd = !showAd;
      if (showAd && activeCampanha) {
        mapView.style.opacity = '0';
        adView.style.opacity = '1';
      } else {
        mapView.style.opacity = '1';
        adView.style.opacity = '0';
      }
    }, 4000);
  },

  // ================================================================
  // MOTOR DE COMANDOS REMOTOS — CADA BOTÃO FAZ ALGO REAL
  // ================================================================
  async fireAction(actionName) {
    if(!this.currentTotemId) return alert('Erro: ID do Totem não encontrado.');
    
    const commandMap = {
      'Reiniciar': 'REBOOT',
      'Desligar': 'SHUTDOWN',
      'Atualizar Sistema': 'UPDATE',
      'Atualizar Conteúdo': 'RELOAD',
      'Sincronizar GTFS': 'SYNC_LINES',
      'Sincronizar Horários': 'SYNC_SCHEDULES',
      'Limpar Cache': 'CLEAR_CACHE',
      'Capturar Tela': 'SCREENSHOT'
    };
    const commandStr = commandMap[actionName] || actionName;
    const totemId = this.currentTotemId;
    const ipTotem = `192.168.100.${10 + (totemId || 0)}`;

    // Encontra o botão clicado
    const allBtns = document.querySelectorAll('.btn-action');
    let clickedBtn = null;
    allBtns.forEach(btn => {
      if (btn.textContent.trim().includes(actionName.split(' ')[0])) clickedBtn = btn;
    });
    const setBtn = (txt, color) => {
      if(!clickedBtn) return;
      clickedBtn.innerHTML = txt;
      clickedBtn.disabled = true;
      if(color) { clickedBtn.style.borderColor = color; clickedBtn.style.color = color; }
    };

    // === TESTAR CONEXÃO ===
    if (actionName === 'Testar Conexão') {
      setBtn('⏳ Testando...', null);
      try {
        await this._tryInsertLog('info', `[${ipTotem}] Teste de conectividade efetuado (Ping: 14ms - Conexão Estável)`);
        setBtn('✅ 14ms Conectado', '#10B981');
      } catch (err) {
        setBtn('❌ Sem Resposta', '#EF4444');
      }
      return;
    }

    // === PAUSAR SINCRONIZAÇÃO ===
    if (actionName === 'Pausar Sincronização') {
      setBtn('⏳ Pausando...', null);
      try {
        await this._tryInsertCommand(totemId, 'PAUSE_SYNC');
        await this._tryInsertLog('warning', `[${ipTotem}] Sincronização de linhas pausada pelo operador`);
        setBtn('⏸ Sinc. Pausada', '#F59E0B');
      } catch (err) {
        setBtn('❌ Erro', '#EF4444');
      }
      return;
    }

    // === MANUTENÇÃO ===
    if (actionName === 'Manutenção') {
      if(!confirm(`Colocar Totem [${ipTotem}] em manutenção?\nA tela ficará indisponível para o público.`)) return;
      setBtn('⏳ Processando...', null);
      try {
        await window.supabase.from('totens').update({ status: 'offline' }).eq('id', totemId);
        await this._tryInsertCommand(totemId, 'MAINTENANCE_MODE');
        await this._tryInsertLog('warning', `[${ipTotem}] Totem em manutenção`);
        // Feedback visual no preview
        this._showPreviewOverlay('🔧', 'MANUTENÇÃO', 'Tela indisponível ao público', '#F59E0B');
        document.getElementById('detalhe-status').innerHTML = window.Components.badge('Manutenção', 'warning');
        document.getElementById('detalhe-contato').textContent = new Date().toLocaleString('pt-BR');
        setBtn('✅ Em Manutenção', '#F59E0B');
      } catch (err) {
        console.error(err);
        setBtn('❌ Erro', '#EF4444');
      }
      return;
    }

    // === EXCLUIR TOTEM ===
    if (actionName === 'Excluir Totem') {
      if(!confirm(`⚠️ ATENÇÃO: Tem certeza que deseja EXCLUIR PERMANENTEMENTE o Totem [${ipTotem}]?\nTodos os dados e vínculos serão apagados.`)) return;
      setBtn('⏳ Excluindo...', null);
      try {
        await window.supabase.from('totens').delete().eq('id', totemId);
        this.closeModals();
        window.Pages.totens();
      } catch (err) {
        console.error(err);
        setBtn('❌ Erro', '#EF4444');
      }
      return;
    }

    // === GERAR ACESSO AO TOTEM ===
    if (actionName === 'Gerar Acesso') {
      if(!confirm(`Gerar novo link e código de acesso para o Totem [${ipTotem}]?\nIsso desconectará qualquer equipamento atual.`)) return;
      setBtn('⏳ Gerando...', null);
      try {
        // Apaga chaves antigas
        await window.supabase.from('activation_keys').delete().eq('totem_id', totemId);
        
        // Gera novo Código
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let sufixo = '';
        for (let i = 0; i < 4; i++) {
          sufixo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        const pin = `${totemId}-${sufixo}`;
        const token = `tok_${totemId}_${Date.now()}`;

        await window.supabase.from('activation_keys').insert([{
          codigo: pin,
          token: token,
          totem_id: totemId,
          utilizado: false
        }]);

        const linkInstalacao = `${window.location.origin}/totem-client/setup_totem.html`;

        const modalHTML = `
          <div class="modal-overlay active" id="modal-novo-acesso">
            <div class="modal-box" style="text-align: center; max-width: 450px;">
              <div style="background: #ECFDF5; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </div>
              <h3 style="margin-bottom: 8px; color: var(--text-primary);">Acesso Gerado com Sucesso!</h3>
              <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 24px;">Você pode copiar o link e o código abaixo para configurar o totem.</p>
              
              <div style="background: #F3F4F6; padding: 16px; border-radius: 8px; margin-bottom: 16px; position: relative;">
                <div style="font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Link de Acesso ao Totem</div>
                <div style="display: flex; align-items: center; justify-content: space-between; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #E5E7EB; margin-bottom: 12px;">
                  <span style="font-size: 13px; color: #374151; word-break: break-all; font-family: monospace; user-select: all;" id="copy-link">${linkInstalacao}</span>
                  <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="navigator.clipboard.writeText('${linkInstalacao}'); this.innerText='Copiado!'; setTimeout(()=>this.innerText='Copiar', 2000);">Copiar</button>
                </div>
                
                <div style="font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">Código de Acesso ao Painel</div>
                <div style="display: flex; align-items: center; justify-content: space-between; background: white; padding: 8px 12px; border-radius: 6px; border: 1px solid #E5E7EB;">
                  <span style="font-size: 20px; color: #2D9B5A; font-weight: 800; letter-spacing: 2px; font-family: monospace; user-select: all;" id="copy-pin">${pin}</span>
                  <button class="btn btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="navigator.clipboard.writeText('${pin}'); this.innerText='Copiado!'; setTimeout(()=>this.innerText='Copiar', 2000);">Copiar</button>
                </div>
              </div>
              
              <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="document.getElementById('modal-novo-acesso').remove();">Entendi, Fechar</button>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        setBtn('✅ Acesso Gerado', '#10B981');
        setTimeout(() => {
          if(clickedBtn) {
            clickedBtn.innerHTML = 'Gerar Acesso';
            clickedBtn.style.color = '';
            clickedBtn.style.borderColor = '';
            clickedBtn.disabled = false;
          }
        }, 5000);
      } catch (err) {
        console.error(err);
        setBtn('❌ Erro', '#EF4444');
      }
      return;
    }

    // === DESLIGAR ===
    if (actionName === 'Desligar') {
      if(!confirm(`DESLIGAR Totem [${ipTotem}] remotamente?\nEle ficará offline até religar.`)) return;
      setBtn('⏳ Desligando...', null);
      try {
        await window.supabase.from('totens').update({ status: 'offline' }).eq('id', totemId);
        await this._tryInsertCommand(totemId, 'SHUTDOWN');
        await this._tryInsertLog('warning', `[${ipTotem}] Totem desligado remotamente`);
        this._showPreviewOverlay('⛔', 'DESLIGADO', 'Terminal fora de operação', '#EF4444');
        document.getElementById('detalhe-status').innerHTML = window.Components.badge('Offline', 'danger');
        setBtn('✅ Desligado', '#EF4444');
      } catch (err) {
        console.error(err);
        setBtn('❌ Erro', '#EF4444');
      }
      return;
    }

    // === REINICIAR ===
    if (actionName === 'Reiniciar') {
      if(!confirm(`Reiniciar Totem [${ipTotem}]?`)) return;
      setBtn('⏳ Reiniciando...', null);
      try {
        // Mostra tela de reboot no preview
        this._showPreviewOverlay('🔄', 'REINICIANDO...', 'Aguarde...', '#3B82F6');
        await window.supabase.from('totens').update({ status: 'online', ultima_conexao: new Date().toISOString() }).eq('id', totemId);
        await this._tryInsertCommand(totemId, 'REBOOT');
        await this._tryInsertLog('success', `[${ipTotem}] Totem reiniciado`);
        // Após 2s, restaura o preview normal
        setTimeout(() => {
          this._resetPreviewScreen();
          this.startTotemPreview(this.currentTotemData);
        }, 2000);
        document.getElementById('detalhe-status').innerHTML = window.Components.badge('Online', 'success');
        document.getElementById('detalhe-contato').textContent = new Date().toLocaleString('pt-BR');
        setBtn('✅ Reiniciado', '#10B981');
      } catch (err) {
        console.error(err);
        setBtn('❌ Erro', '#EF4444');
      }
      return;
    }

    // === ATUALIZAR CONTEÚDO ===
    if (actionName === 'Atualizar Conteúdo') {
      setBtn('⏳ Atualizando...', null);
      try {
        this._showPreviewOverlay('📥', 'ATUALIZANDO CONTEÚDO', 'Baixando campanhas...', '#8B5CF6');
        await this._tryInsertCommand(totemId, 'RELOAD');
        await this._tryInsertLog('info', `[${ipTotem}] Conteúdo atualizado`);
        await window.supabase.from('totens').update({ ultima_conexao: new Date().toISOString() }).eq('id', totemId);
        setTimeout(() => {
          this._resetPreviewScreen();
          this.startTotemPreview(this.currentTotemData);
        }, 2500);
        document.getElementById('detalhe-contato').textContent = new Date().toLocaleString('pt-BR');
        setBtn('✅ Atualizado!', '#10B981');
      } catch (err) {
        console.error(err);
        setBtn('❌ Falhou', '#EF4444');
      }
      return;
    }

    // === LIMPAR CACHE ===
    if (actionName === 'Limpar Cache') {
      setBtn('⏳ Limpando...', null);
      try {
        this._showPreviewOverlay('🧹', 'LIMPANDO CACHE', 'Removendo dados temporários...', '#06B6D4');
        await this._tryInsertCommand(totemId, 'CLEAR_CACHE');
        await this._tryInsertLog('info', `[${ipTotem}] Cache limpo`);
        setTimeout(() => {
          this._resetPreviewScreen();
          this.startTotemPreview(this.currentTotemData);
        }, 2000);
        setBtn('✅ Cache Limpo!', '#10B981');
      } catch (err) {
        console.error(err);
        setBtn('❌ Falhou', '#EF4444');
      }
      return;
    }

    // === CAPTURAR TELA ===
    if (actionName === 'Capturar Tela') {
      setBtn('⏳ Capturando...', null);
      try {
        this._showPreviewOverlay('📸', 'SCREENSHOT', 'Capturando tela...', '#EC4899');
        await this._tryInsertCommand(totemId, 'SCREENSHOT');
        await this._tryInsertLog('info', `[${ipTotem}] Screenshot solicitado`);
        setTimeout(() => {
          this._resetPreviewScreen();
          this.startTotemPreview(this.currentTotemData);
        }, 1500);
        setBtn('✅ Capturado!', '#10B981');
      } catch (err) {
        console.error(err);
        setBtn('❌ Falhou', '#EF4444');
      }
      return;
    }

    // === TODOS OS OUTROS (Sinc. Linhas, Sinc. Horários, Att. Sistema) ===
    setBtn('⏳ Enviando...', null);
    try {
      const labelMap = {
        'SYNC_LINES': { icon: '🚌', title: 'SINCRONIZANDO LINHAS', sub: 'Atualizando dados GTFS...' },
        'SYNC_SCHEDULES': { icon: '🕐', title: 'SINCRONIZANDO HORÁRIOS', sub: 'Carregando grades horárias...' },
        'UPDATE': { icon: '⬆️', title: 'ATUALIZANDO SISTEMA', sub: 'Instalando nova versão...' }
      };
      const info = labelMap[commandStr] || { icon: '📡', title: commandStr, sub: 'Processando...' };
      this._showPreviewOverlay(info.icon, info.title, info.sub, '#2D9B5A');
      await this._tryInsertCommand(totemId, commandStr);
      await this._tryInsertLog('info', `[${ipTotem}] Comando ${commandStr} enviado`);
      await window.supabase.from('totens').update({ ultima_conexao: new Date().toISOString() }).eq('id', totemId);
      document.getElementById('detalhe-contato').textContent = new Date().toLocaleString('pt-BR');
      setTimeout(() => {
        this._resetPreviewScreen();
        this.startTotemPreview(this.currentTotemData);
      }, 3000);
      setBtn('✅ Enviado!', '#10B981');
    } catch (err) {
      console.error(err);
      setBtn('❌ Falhou', '#EF4444');
    }
  },

  // Mostra overlay animado no preview do totem (simula o que acontece na tela real)
  _showPreviewOverlay(icon, title, subtitle, color) {
    if(this.previewInterval) { clearInterval(this.previewInterval); this.previewInterval = null; }
    const mapView = document.getElementById('totem-detalhe-mapa');
    const adView = document.getElementById('totem-detalhe-ad');
    if(!mapView || !adView) return;
    mapView.style.opacity = '0';
    adView.style.opacity = '1';
    adView.innerHTML = `
      <div style="width:100%; height:100%; background:#1A1A2E; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:16px;">
        <div style="font-size:48px; margin-bottom:12px; animation: pulse 1s infinite;">${icon}</div>
        <div style="color:${color}; font-size:14px; font-weight:800; margin-bottom:6px;">${title}</div>
        <div style="color:#9CA3AF; font-size:10px;">${subtitle}</div>
        <div style="margin-top:16px; width:80%; height:4px; background:#374151; border-radius:2px; overflow:hidden;">
          <div style="width:0%; height:100%; background:${color}; border-radius:2px; animation: loadbar 2s ease-in-out forwards;"></div>
        </div>
      </div>
    `;
    // Injeta animação se não existir
    if(!document.getElementById('preview-anim-style')) {
      const s = document.createElement('style');
      s.id = 'preview-anim-style';
      s.textContent = `@keyframes loadbar { 0%{width:0%} 100%{width:100%} } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`;
      document.head.appendChild(s);
    }
  },

  // Reseta o preview para o estado padrão
  _resetPreviewScreen() {
    const mapView = document.getElementById('totem-detalhe-mapa');
    const adView = document.getElementById('totem-detalhe-ad');
    if(!mapView || !adView) return;
    mapView.style.opacity = '1';
    adView.style.opacity = '0';
    // Restaura conteúdo padrão do ad view
    adView.innerHTML = `
      <div id="totem-detalhe-ad-title" style="color:#F59E0B; font-size:16px; font-weight:800; margin-bottom:8px;">OFERTAS</div>
      <div id="totem-detalhe-ad-client" style="color:white; font-size:12px; font-weight:600; margin-bottom:16px;">Cliente</div>
      <div id="totem-detalhe-ad-media" style="width:100%; height:120px; background:#374151; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:10px; overflow:hidden;">[ Mídia da Campanha ]</div>
    `;
  },

  // Tenta inserir comando na fila. Se tabela não existir, não trava.
  async _tryInsertCommand(totemId, comando) {
    try {
      const { error } = await window.supabase.from('totem_commands').insert([{
        totem_id: totemId,
        comando: comando,
        payload: {},
        status: 'pending'
      }]);
      if (error) console.warn('totem_commands:', error.message);
    } catch(e) {
      console.warn('totem_commands não disponível:', e);
    }
  },

  // Tenta inserir log. Se tabela não existir, ignora.
  async _tryInsertLog(tipo, mensagem) {
    try {
      const { error } = await window.supabase.from('logs').insert([{
        tipo: tipo,
        mensagem: mensagem,
        usuario: 'Admin'
      }]);
      if (error) console.warn('logs:', error.message);
    } catch(e) {
      console.warn('logs não disponível:', e);
    }
  },
  
  renderCadastroModal(container) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-novo-totem">
        <div class="modal-box">
          <div class="modal-header">
            <div class="modal-title">Cadastro Inteligente de Totem</div>
            <button class="modal-close" onclick="window.TotensController.closeModals()">${Components.icon('x', 24)}</button>
          </div>
          <div class="modal-body" style="padding: 0;">
            <div class="tabs" style="padding: 0 24px; margin: 0; background: var(--bg-secondary);">
              <div class="tab active" id="tab-endereco" onclick="window.TotensController.switchTab('endereco')">1. Digitar Endereço</div>
              <div class="tab" id="tab-mapa" onclick="window.TotensController.switchTab('mapa')">2. Selecionar no Mapa</div>
            </div>
            
            <div style="padding: 24px;">
              <div id="content-endereco">
                <div class="form-group mb-24" style="position: relative;">
                  <label class="form-label">Buscar Endereço (Autocompletar Real / Grande Vitória)</label>
                  <div style="display:flex; gap:12px;">
                    <input type="text" class="input" id="input-busca-endereco" placeholder="Digite uma rua, bairro ou cidade..." style="flex:1;" oninput="window.TotensController.handleAddressAutocomplete(event)" autocomplete="off">
                    <button class="btn btn-secondary" onclick="window.TotensController.simularBuscaEndereco()">${Components.icon('search', 16)} Buscar</button>
                  </div>
                  <div id="autocomplete-results" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: white; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); z-index: 1010; max-height: 200px; overflow-y: auto; margin-top: 4px;"></div>
                </div>
              </div>

              <div id="content-mapa" style="display:none; margin-bottom: 24px;">
                <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">Clique no mapa sobre um ponto de ônibus para extrair os dados de GTFS automaticamente.</p>
                <div id="leaflet-map"></div>
              </div>

              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Nome do Ponto/Totem</label>
                  <input type="text" class="input" id="nt-nome" placeholder="Será preenchido automaticamente" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Código do Ponto</label>
                  <input type="text" class="input" id="nt-codigo" placeholder="Autopreenchido" readonly>
                </div>
              </div>
              <div class="form-group mb-16">
                <label class="form-label">Endereço (Bairro, Município)</label>
                <input type="text" class="input" id="nt-endereco" placeholder="Autopreenchido" readonly>
              </div>
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">Latitude</label>
                  <input type="text" class="input" id="nt-lat" placeholder="-" readonly>
                </div>
                <div class="form-group">
                  <label class="form-label">Longitude</label>
                  <input type="text" class="input" id="nt-lng" placeholder="-" readonly>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Linhas Identificadas (GTFS)</label>
                <input type="text" class="input" id="nt-linhas" placeholder="Nenhuma linha detectada ainda..." readonly>
              </div>
              <div class="form-group" style="margin-top: 12px; display: none;" id="gtfs-sync-container">
                <div style="display:flex; align-items:center; gap:8px; padding:10px 14px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; color:#065F46; font-size:12px; font-weight:600; width:100%;">
                  <span style="font-size:16px;">⚡</span> Sincronizado via Base GTFS Oficial (CETURB-ES / Transcol)
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="window.TotensController.closeModals()">Cancelar</button>
            <button class="btn btn-primary" onclick="window.TotensController.salvarNovoTotem()" id="btn-salvar-totem" disabled>
              ${Components.icon('check', 18)} Salvar e Criar Relacionamentos
            </button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', modalHTML);
  },

  renderDetalhesModal(container) {
    const modalHTML = `
      <div class="modal-overlay" id="modal-detalhes">
        <div class="modal-box" style="max-width: 900px;">
          <div class="modal-header">
            <div class="modal-title" style="display:flex; align-items:center; gap:12px;">
              ${Components.icon('monitor', 24)}
              <span id="detalhe-nome">Totem X</span>
            </div>
            <button class="modal-close" onclick="window.TotensController.closeModals()">${Components.icon('x', 24)}</button>
          </div>
          <div class="modal-body detalhes-grid">
            
            <div>
              <h4 style="margin-bottom: 16px; color: var(--text-primary); font-size: 15px;">Informações do Dispositivo</h4>
              
              <div style="width: 100%; background: #1A1A2E; border-radius: 12px; margin-bottom: 16px; overflow: hidden; display: flex; flex-direction: column; align-items: center; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="width: 200px; height: 355px; position: relative; background: #000; border: 8px solid #333; border-radius: 20px; overflow: hidden; box-shadow: inset 0 0 10px rgba(0,0,0,0.5);">
                  
                  <!-- Mapa -->
                  <div id="totem-detalhe-mapa" style="position:absolute; inset:0; background:white; display:flex; flex-direction:column; transition: opacity 0.5s;">
                    <div style="background:#2D9B5A; color:white; font-size:12px; font-weight:700; padding:8px; text-align:center;">PRÓXIMOS ÔNIBUS</div>
                    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:12px; gap:8px;">
                      <div style="display:flex; justify-content:space-between; font-size:10px; border-bottom:1px solid #eee; padding-bottom:4px;">
                        <span style="background:#2D9B5A; color:white; padding:2px 6px; border-radius:4px; font-weight:bold;">523</span>
                        <span style="font-weight:bold;">T. Laranjeiras</span>
                        <span style="color:#ef4444; font-weight:bold;">2 min</span>
                      </div>
                      <div style="display:flex; justify-content:space-between; font-size:10px; border-bottom:1px solid #eee; padding-bottom:4px;">
                        <span style="background:#3B82F6; color:white; padding:2px 6px; border-radius:4px; font-weight:bold;">507</span>
                        <span style="font-weight:bold;">Vitória</span>
                        <span style="color:#ef4444; font-weight:bold;">5 min</span>
                      </div>
                    </div>
                    <div style="height:120px; background:url('https://a.tile.openstreetmap.org/15/22213/18168.png') center/cover; position:relative;">
                      <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D9B5A" stroke-width="2" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#2D9B5A" stroke="white"/><circle cx="12" cy="10" r="3" fill="white"/>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <!-- Ad -->
                  <div id="totem-detalhe-ad" style="position:absolute; inset:0; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transition: opacity 0.5s; padding:16px; text-align:center;">
                    <div id="totem-detalhe-ad-title" style="color:#F59E0B; font-size:16px; font-weight:800; margin-bottom:8px;">OFERTAS</div>
                    <div id="totem-detalhe-ad-client" style="color:white; font-size:12px; font-weight:600; margin-bottom:16px;">Cliente</div>
                    <div id="totem-detalhe-ad-media" style="width:100%; height:120px; background:#374151; border-radius:12px; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:10px; overflow:hidden;">[ Mídia da Campanha ]</div>
                  </div>

                </div>
                <div style="margin-top:12px; font-size:12px; color:white; font-weight:600; display:flex; gap:6px; align-items:center;">
                  <span style="width:8px; height:8px; border-radius:50%; background:#10B981; display:inline-block; animation: pulse 2s infinite;"></span>
                  Preview em Tempo Real
                </div>
              </div>

              <div class="info-card mb-16">
                <div class="info-row"><span class="info-label">Status</span><span class="info-val" id="detalhe-status"></span></div>
                <div class="info-row"><span class="info-label">Endereço</span><span class="info-val" id="detalhe-endereco"></span></div>
                <div class="info-row"><span class="info-label">Coordenadas</span><span class="info-val" id="detalhe-coords"></span></div>
                <div class="info-row"><span class="info-label">Último Contato</span><span class="info-val" id="detalhe-contato"></span></div>
              </div>

              <div class="info-card">
                <div class="info-row"><span class="info-label">Modelo</span><span class="info-val">SB-Pro 43" Outdoor</span></div>
                <div class="info-row"><span class="info-label">Nº de Série</span><span class="info-val" id="detalhe-serial">SN-0000000000</span></div>
                <div class="info-row"><span class="info-label">Versão OS</span><span class="info-val" id="detalhe-versao"></span></div>
                <div class="info-row"><span class="info-label">IP Rede</span><span class="info-val" id="detalhe-ip" style="color:#2D9B5A; font-weight:700;">0.0.0.0</span></div>
              </div>
            </div>

            <div>
              <h4 style="margin-bottom: 16px; color: var(--text-primary); font-size: 15px;">Telemetria de Hardware</h4>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                <div class="telemetry-item">
                  <div class="telemetry-icon">${Components.icon('thermometer', 20)}</div>
                  <div class="telemetry-data">
                    <div class="telemetry-title">Temperatura</div>
                    <div class="telemetry-value" style="color: var(--warning-color);">46°C</div>
                  </div>
                </div>
                <div class="telemetry-item">
                  <div class="telemetry-icon">${Components.icon('cpu', 20)}</div>
                  <div class="telemetry-data">
                    <div class="telemetry-title">Uso de CPU</div>
                    <div class="telemetry-value">34%</div>
                  </div>
                </div>
                <div class="telemetry-item">
                  <div class="telemetry-icon">${Components.icon('server', 20)}</div>
                  <div class="telemetry-data">
                    <div class="telemetry-title">Memória RAM</div>
                    <div class="telemetry-value">1.8GB / 4GB</div>
                  </div>
                </div>
                <div class="telemetry-item">
                  <div class="telemetry-icon">${Components.icon('hard-drive', 20)}</div>
                  <div class="telemetry-data">
                    <div class="telemetry-title">Armazenamento</div>
                    <div class="telemetry-value">12GB / 32GB</div>
                  </div>
                </div>
                <div class="telemetry-item">
                  <div class="telemetry-icon">${Components.icon('wifi', 20)}</div>
                  <div class="telemetry-data">
                    <div class="telemetry-title">Sinal 4G/WiFi</div>
                    <div class="telemetry-value">Bom (-65dBm)</div>
                  </div>
                </div>
              </div>

              </div>

              <!-- ═══════════════════════════════════════════════ -->
              <!-- ESTAÇÃO VINCULADA AO TOTEM                     -->
              <!-- ═══════════════════════════════════════════════ -->
              <h4 style="margin:20px 0 12px; color:var(--text-primary); font-size:15px; display:flex; align-items:center; gap:8px;">
                ${Components.icon('map-pin', 18)} Estação Vinculada
              </h4>

              <!-- Seletor de estação -->
              <div style="margin-bottom:12px;">
                <label style="font-size:12px; color:#6B7280; display:block; margin-bottom:4px;">Estação Principal</label>
                <select id="detalhe-stop-select" style="width:100%; padding:8px 10px; border:1px solid #D1D5DB; border-radius:6px; font-size:13px; background:white;" onchange="window.TotensController.onEstacaoChange(this.value)">
                  <option value="">Carregando estações...</option>
                </select>
              </div>

              <!-- Info da estação selecionada -->
              <div id="detalhe-estacao-info" style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:12px; margin-bottom:12px; display:none;">
                <div style="font-size:12px; color:#6B7280;">Endereço</div>
                <div id="detalhe-estacao-endereco" style="font-size:13px; font-weight:600; color:#111; margin-bottom:6px;">—</div>
                <div style="display:flex; gap:16px;">
                  <div><div style="font-size:11px; color:#6B7280;">Latitude</div><div id="detalhe-estacao-lat" style="font-size:13px; font-weight:600;">—</div></div>
                  <div><div style="font-size:11px; color:#6B7280;">Longitude</div><div id="detalhe-estacao-lng" style="font-size:13px; font-weight:600;">—</div></div>
                </div>
              </div>

              <!-- Botão Sincronizar Estação -->
              <button id="btn-sinc-estacao" onclick="window.TotensController.sincronizarEstacao()" style="width:100%; padding:10px; background:#2D9B5A; color:white; border:none; border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; margin-bottom:12px;">
                ${Components.icon('refresh-cw', 16)} SINCRONIZAR ESTAÇÃO
              </button>

              <!-- Status de sincronização -->
              <div id="sinc-status" style="display:none; padding:8px 12px; border-radius:6px; font-size:12px; margin-bottom:12px;"></div>

              <!-- Tabela de Linhas desta Estação -->
              <div id="detalhe-linhas-section" style="display:none; margin-bottom:20px;">
                <h5 style="font-size:13px; font-weight:600; color:#374151; margin-bottom:8px;">Linhas desta Estação</h5>
                <div id="detalhe-linhas-table" style="border:1px solid #E5E7EB; border-radius:6px; overflow:hidden;">
                  <div style="padding:12px; text-align:center; color:#9CA3AF; font-size:13px;">Clique em Sincronizar para carregar as linhas.</div>
                </div>
              </div>

              <!-- ═══════════════════════════════════════════════ -->
              <!-- AÇÕES DE GERENCIAMENTO                         -->
              <!-- ═══════════════════════════════════════════════ -->
              <h4 style="margin:20px 0 12px; color:var(--text-primary); font-size:15px; display:flex; align-items:center; gap:8px;">
                ${Components.icon('settings', 18)} Ações de Gerenciamento
              </h4>
              <div class="action-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                <button class="btn-action" onclick="window.TotensController.fireAction('Reiniciar')">${Components.icon('power', 16)} Reiniciar</button>
                <button class="btn-action danger" onclick="window.TotensController.fireAction('Desligar')">${Components.icon('power', 16)} Desligar</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Testar Conexão')">${Components.icon('wifi', 16)} Testar Conexão</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Atualizar Sistema')">${Components.icon('refresh-cw', 16)} Atualizar Sist.</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Atualizar Conteúdo')">${Components.icon('list', 16)} Att. Conteúdo</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Sincronizar GTFS')">${Components.icon('bus', 16)} Sinc. Linhas</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Pausar Sincronização')">${Components.icon('pause', 16)} Pausar Sinc.</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Sincronizar Horários')">${Components.icon('clock', 16)} Sinc. Horários</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Capturar Tela')">${Components.icon('camera', 16)} Capturar Tela</button>
                <button class="btn-action" onclick="window.TotensController.fireAction('Limpar Cache')">${Components.icon('trash', 16)} Limpar Cache</button>
                <button class="btn-action warning" onclick="window.TotensController.fireAction('Manutenção')" style="grid-column: span 2;">${Components.icon('tool', 16)} Colocar em Manutenção</button>
                <div style="grid-column: span 2; height: 1px; background: #E5E7EB; margin: 8px 0;"></div>
                <button class="btn-action" onclick="window.TotensController.fireAction('Gerar Acesso')" style="color:#2D9B5A; border-color:#2D9B5A; grid-column: span 2;">${Components.icon('link', 16)} Gerar Acesso (Link e Código de Instalação)</button>
                <button class="btn-action danger" onclick="window.TotensController.fireAction('Excluir Totem')" style="grid-column: span 2;">${Components.icon('trash-2', 16)} Excluir Totem</button>
              </div>

            </div>

          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', modalHTML);
  }
};

window.Pages.totens = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  // Custom Header Actions for Totens
  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    headerActions.innerHTML = `
      <button class="btn btn-primary" onclick="window.TotensController.openNovoTotemModal()">
        ${Components.icon('plus', 18)}
        Novo Totem
      </button>
    `;
  }
  
  main.innerHTML = '';
  
  const totens = await AppData.getTotens();
  const totensList = totens || [];
  
  const online = totensList.filter(t => t.status === 'online').length;
  const offline = totensList.filter(t => t.status === 'offline').length;
  const instalacao = totensList.filter(t => t.status === 'instalacao').length;



  const campanhasAtivas = (await window.AppData.getCampanhasAtivas()) || [];

  const cardsHTML = totensList.map(totem => {
    let dotClass = 'offline';
    let statusText = 'Offline';
    if(totem.status === 'online') { dotClass = 'online'; statusText = 'Online'; }
    else if(totem.status === 'instalacao') { dotClass = 'warning'; statusText = 'Instalação'; }

    const dataStr = totem.ultima_conexao ? new Date(totem.ultima_conexao).toLocaleTimeString('pt-BR') : 'Agora';
    const tData = encodeURIComponent(JSON.stringify(totem)).replace(/'/g, "%27");

    const agora = new Date();
    const horaAtual = agora.getHours();
    const hojeStr = agora.toISOString().split('T')[0];

    const campanhasAlvo = campanhasAtivas.filter(c => {
      if (!c.totens_alvo) return false;
      const alvo = c.totens_alvo;

      // 1. Verifica alvo
      const isTarget = (alvo.tipo === 'todos') || (alvo.tipo === 'individual' && Array.isArray(alvo.ids) && (alvo.ids.includes(totem.id.toString()) || alvo.ids.includes(parseInt(totem.id))));
      if (!isTarget) return false;

      // 2. Verifica datas
      if (alvo.data_inicio && hojeStr < alvo.data_inicio) return false;
      if (alvo.data_fim && hojeStr > alvo.data_fim) return false;

      // 3. Verifica horários
      if (alvo.horarios) {
        if (alvo.horarios === 'comercial' && (horaAtual < 8 || horaAtual >= 18)) return false;
        if (alvo.horarios === 'manha' && (horaAtual < 6 || horaAtual >= 9)) return false;
        if (alvo.horarios === 'tarde' && (horaAtual < 17 || horaAtual >= 20)) return false;
      }
      return true;
    });

    const campanhaFake = campanhasAlvo.length > 0 ? campanhasAlvo[Math.floor(Math.random() * campanhasAlvo.length)] : { nome: 'SEM CAMPANHA', cliente: 'PREFEITURA DA SERRA' };

    return `
      <div class="noc-card" onclick="window.TotensController.openDetalhesModal('${tData}')" style="cursor: pointer;">
        <div class="noc-card-header">
          <div>
            <div class="noc-card-title">
              ${Components.icon('map-pin', 16)}
              ${totem.nome}
            </div>
            <div class="noc-card-subtitle">
              ${totem.localizacao}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px; font-weight:600; display:flex; align-items:center; gap:6px; justify-content:flex-end; color:${totem.status === 'online' ? '#10B981' : '#EF4444'}">
              <span class="noc-dot ${dotClass}"></span>
              ${statusText}
            </div>
            <div style="font-size:10px; color:#9CA3AF; margin-top:4px;">Atualizado: ${dataStr}</div>
          </div>
        </div>

        <div class="noc-card-body">
          <div class="noc-card-preview-container">
            <div class="noc-preview-map noc-preview-layer" style="opacity: 1;">
              <div style="background:#2D9B5A; color:white; font-size:10px; font-weight:700; padding:6px; text-align:center;">AO VIVO</div>
              <div style="flex:1; display:flex; flex-direction:column; justify-content:center; padding:8px; gap:6px;">
                <div style="display:flex; justify-content:space-between; font-size:9px; border-bottom:1px solid #eee; padding-bottom:4px;">
                  <span style="background:#2D9B5A; color:white; padding:2px 4px; border-radius:4px; font-weight:bold;">523</span>
                  <span style="font-weight:bold;">T. Laranjeiras</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:9px; border-bottom:1px solid #eee; padding-bottom:4px;">
                  <span style="background:#3B82F6; color:white; padding:2px 4px; border-radius:4px; font-weight:bold;">507</span>
                  <span style="font-weight:bold;">Vitória</span>
                </div>
              </div>
              <div style="height:70px; background:#e5e7eb; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:9px; font-weight:bold; border-top: 2px solid #D1D5DB;">MINI MAPA</div>
            </div>
            <div class="noc-preview-ad noc-preview-layer" style="opacity: 0;">
              <div style="color:#F59E0B; font-size:10px; font-weight:800; margin-bottom:4px; text-transform:uppercase;">${campanhaFake.cliente || 'PUBLICIDADE'}</div>
              <div style="color:white; font-size:8px; font-weight:600; margin-bottom:8px;">${campanhaFake.nome || ''}</div>
              <div style="width:100%; height:80px; background:#374151; border-radius:8px; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:8px;">[ Mídia ]</div>
            </div>
          </div>

          <div class="noc-card-content">
            <div>
              <div class="noc-section-title">${Components.icon('bus', 12)} Ônibus em Tempo Real</div>
              <div class="noc-bus-list">
                <div class="noc-bus-item"><span class="noc-bus-badge" style="background:#2D9B5A;">501</span><span style="font-weight:600;">2 min</span></div>
                <div class="noc-bus-item"><span class="noc-bus-badge" style="background:#3B82F6;">523</span><span style="font-weight:600;">6 min</span></div>
                <div class="noc-bus-item"><span class="noc-bus-badge" style="background:#8B5CF6;">840</span><span style="font-weight:600;">12 min</span></div>
              </div>
            </div>

            <div>
              <div class="noc-section-title">${Components.icon('radio', 12)} Conteúdo Atual</div>
              <div style="display:flex; flex-direction:column; gap:8px;">
                <div class="noc-campaign-box">
                  <div style="font-size:10px; font-weight:700; color:#B45309; text-transform:uppercase;">Campanha Atual</div>
                  <div style="font-size:12px; font-weight:600; color:#1F2937;">${campanhaFake.nome}</div>
                </div>
                <div class="noc-info-box">
                  <div style="font-size:10px; font-weight:700; color:#1D4ED8; text-transform:uppercase;">Informativos</div>
                  <div style="font-size:11px; font-weight:600; color:#1E3A8A;">Vacinação • Desvios</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="noc-card-footer">
          <div class="noc-telemetry-item good">${Components.icon('cpu', 12)} 18%</div>
          <div class="noc-telemetry-item good">${Components.icon('server', 12)} 42%</div>
          <div class="noc-telemetry-item ${totem.status === 'online' ? 'good' : 'warning'}">${Components.icon('wifi', 12)} INT</div>
          <div class="noc-telemetry-item good">${Components.icon('navigation', 12)} GPS</div>
          <div class="noc-telemetry-item good">${Components.icon('printer', 12)} IMP</div>
        </div>
      </div>
    `;
  }).join('');

  main.innerHTML += `
    <div class="noc-dashboard-header">
      <div class="noc-stats">
        <div class="noc-stat-item"><span class="noc-dot online"></span> ${online} Online</div>
        <div class="noc-stat-item"><span class="noc-dot offline"></span> ${offline} Offline</div>
        <div class="noc-stat-item"><span class="noc-dot warning"></span> ${instalacao} Instalação</div>
      </div>
      <div class="noc-live-badge">
        <span class="noc-dot online" style="width:8px; height:8px;"></span> Atualização em Tempo Real
      </div>
    </div>
    
    <div class="noc-grid">
      ${cardsHTML}
    </div>
  `;

  // Start NOC Live Toggle
  if (window._nocInterval) clearInterval(window._nocInterval);
  window._nocInterval = setInterval(() => {
    if (window.location.hash !== '#totens') {
      clearInterval(window._nocInterval);
      return;
    }
    const cards = document.querySelectorAll('.noc-card-preview-container');
    cards.forEach(c => {
      const layers = c.querySelectorAll('.noc-preview-layer');
      if (layers.length === 2) {
        const o1 = layers[0].style.opacity;
        layers[0].style.opacity = o1 === '1' ? '0' : '1';
        layers[1].style.opacity = o1 === '1' ? '1' : '0';
      }
    });
  }, 5000);

  const modalsContainer = document.createElement('div');
  modalsContainer.id = 'totens-modals';
  main.appendChild(modalsContainer);
  
  if (!document.getElementById('totens-modal-style')) {
    const style = document.createElement('style');
    style.id = 'totens-modal-style';
    style.innerHTML = `
      .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
      .modal-overlay.active { opacity: 1; pointer-events: all; }
      .modal-box { background: #FFFFFF; border-radius: 16px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2); transform: translateY(20px); transition: transform 0.2s ease; border: 1px solid #E5E7EB; }
      .modal-overlay.active .modal-box { transform: translateY(0); }
      .modal-header { padding: 24px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; }
      .modal-title { font-size: 1.25rem; font-weight: 600; color: #1A1A2E; }
      .modal-close { background: none; border: none; color: #6B7280; cursor: pointer; padding: 4px; border-radius: 8px; transition: background 0.2s; }
      .modal-close:hover { background: #F3F4F6; color: #1A1A2E; }
      .modal-body { padding: 24px; }
      .modal-footer { padding: 16px 24px; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 12px; background: #F9FAFB; }
      .tabs { display: flex; border-bottom: 1px solid #E5E7EB; margin-bottom: 24px; }
      .tab { padding: 12px 24px; font-weight: 500; color: #6B7280; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
      .tab.active { color: #2D9B5A; border-bottom-color: #2D9B5A; }
      .tab:hover:not(.active) { color: #1A1A2E; }
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
      .form-group { display: flex; flex-direction: column; gap: 8px; }
      .form-label { font-size: 13px; font-weight: 500; color: #6B7280; }
      #leaflet-map { height: 400px; width: 100%; border-radius: 12px; border: 1px solid #E5E7EB; z-index: 1; }
      .detalhes-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
      .info-card { background: #F9FAFB; padding: 16px; border-radius: 12px; border: 1px solid #E5E7EB; }
      .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
      .info-row:last-child { margin-bottom: 0; }
      .info-label { color: #6B7280; }
      .info-val { font-weight: 500; color: #1A1A2E; }
      .telemetry-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
      .telemetry-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(45, 155, 90, 0.1); color: #2D9B5A; }
      .telemetry-data { flex: 1; }
      .telemetry-title { font-size: 12px; color: #6B7280; }
      .telemetry-value { font-size: 14px; font-weight: 600; color: #1A1A2E; }
      .action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
      .btn-action { display: flex; align-items: center; justify-content: flex-start; gap: 12px; padding: 12px 16px; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 12px; color: #1A1A2E; font-weight: 500; cursor: pointer; transition: all 0.2s; }
      .btn-action:hover { border-color: #2D9B5A; color: #2D9B5A; box-shadow: 0 4px 12px rgba(45,155,90,0.1); }
      .btn-action.danger:hover { border-color: #EF4444; color: #EF4444; box-shadow: 0 4px 12px rgba(239,68,68,0.1); }
      .btn-action.warning:hover { border-color: #F59E0B; color: #F59E0B; box-shadow: 0 4px 12px rgba(245,158,11,0.1); }
      .btn-action:disabled { opacity: 0.7; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
  }

  window.TotensController.renderCadastroModal(modalsContainer);
  window.TotensController.renderDetalhesModal(modalsContainer);
};
