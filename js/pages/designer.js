/* ================================================
   DESIGNER VISUAL DE LAYOUT DO TOTEM
   Canvas Designer + Property Inspector + Preview
   ================================================ */
window.Pages = window.Pages || {};

// ==========================================
// DESIGNER ENGINE — Estado global do canvas
// ==========================================
window.DesignerEngine = {
  components: [],
  selectedId: null,
  nextId: 1,
  layoutName: 'Novo Layout',
  layoutId: null,
  canvasW: 360,
  canvasH: 640,
  realW: 1080,
  realH: 1920,
  isDragging: false,
  isResizing: false,
  dragData: null,
  snapThreshold: 6,

  // Definição dos tipos de componentes
  COMPONENT_TYPES: {
    'map': { name: 'Mapa de Linhas', icon: '🗺️', color: '#2D9B5A', defaultW: 360, defaultH: 200 },
    'bus-list': { name: 'Próximos Ônibus', icon: '🚍', color: '#3B82F6', defaultW: 360, defaultH: 160 },
    'clock': { name: 'Relógio / Data', icon: '⏰', color: '#8B5CF6', defaultW: 360, defaultH: 80 },
    'video': { name: 'Vídeo', icon: '📺', color: '#EF4444', defaultW: 360, defaultH: 200 },
    'banner': { name: 'Imagem / Banner', icon: '🖼️', color: '#F59E0B', defaultW: 360, defaultH: 120 },
    'weather': { name: 'Previsão do Tempo', icon: '🌤️', color: '#06B6D4', defaultW: 180, defaultH: 80 },
    'news': { name: 'Notícias / RSS', icon: '📰', color: '#10B981', defaultW: 360, defaultH: 120 },
    'qr': { name: 'QR Code', icon: '📱', color: '#6366F1', defaultW: 100, defaultH: 100 },
    'logo': { name: 'Logo', icon: '🏛️', color: '#1F2937', defaultW: 120, defaultH: 60 },
    'text': { name: 'Texto / HTML', icon: '📝', color: '#9333EA', defaultW: 360, defaultH: 60 }
  },

  // Templates pré-definidos
  TEMPLATES: {
    'transporte': {
      name: '🚌 Transporte Padrão',
      components: [
        { type: 'clock', x: 0, y: 0, w: 360, h: 50, props: { label: 'Relógio' } },
        { type: 'bus-list', x: 0, y: 50, w: 360, h: 200, props: { label: 'Linhas' } },
        { type: 'map', x: 0, y: 250, w: 360, h: 260, props: { label: 'Mapa' } },
        { type: 'banner', x: 0, y: 510, w: 360, h: 90, props: { label: 'Publicidade' } },
        { type: 'logo', x: 120, y: 605, w: 120, h: 30, props: { label: 'Logo' } }
      ]
    },
    'publicidade': {
      name: '📢 Publicidade Máxima',
      components: [
        { type: 'logo', x: 10, y: 10, w: 100, h: 40, props: { label: 'Logo' } },
        { type: 'clock', x: 260, y: 10, w: 90, h: 40, props: { label: 'Relógio' } },
        { type: 'banner', x: 0, y: 60, w: 360, h: 380, props: { label: 'Banner Principal' } },
        { type: 'bus-list', x: 0, y: 440, w: 360, h: 120, props: { label: 'Linhas' } },
        { type: 'text', x: 0, y: 570, w: 360, h: 70, props: { label: 'Info' } }
      ]
    },
    'tela-dividida': {
      name: '📐 Tela Dividida',
      components: [
        { type: 'clock', x: 0, y: 0, w: 360, h: 50, props: { label: 'Relógio' } },
        { type: 'map', x: 0, y: 50, w: 180, h: 300, props: { label: 'Mapa' } },
        { type: 'bus-list', x: 180, y: 50, w: 180, h: 300, props: { label: 'Linhas' } },
        { type: 'banner', x: 0, y: 350, w: 360, h: 200, props: { label: 'Publicidade' } },
        { type: 'news', x: 0, y: 550, w: 360, h: 90, props: { label: 'Notícias' } }
      ]
    },
    'mapa-grande': {
      name: '🗺️ Mapa em Destaque',
      components: [
        { type: 'logo', x: 10, y: 10, w: 140, h: 40, props: { label: 'Logo' } },
        { type: 'weather', x: 200, y: 10, w: 150, h: 40, props: { label: 'Clima' } },
        { type: 'map', x: 0, y: 55, w: 360, h: 400, props: { label: 'Mapa Grande' } },
        { type: 'bus-list', x: 0, y: 455, w: 360, h: 130, props: { label: 'Linhas' } },
        { type: 'text', x: 0, y: 590, w: 360, h: 50, props: { label: 'Rodapé' } }
      ]
    },
    'emergencia': {
      name: '🚨 Emergência',
      components: [
        { type: 'text', x: 0, y: 0, w: 360, h: 80, props: { label: '⚠️ ALERTA', textContent: 'AVISO IMPORTANTE' } },
        { type: 'banner', x: 0, y: 80, w: 360, h: 400, props: { label: 'Mensagem' } },
        { type: 'qr', x: 130, y: 500, w: 100, h: 100, props: { label: 'QR Info' } },
        { type: 'text', x: 0, y: 605, w: 360, h: 35, props: { label: 'Rodapé' } }
      ]
    },
    'eventos': {
      name: '🎉 Eventos da Cidade',
      components: [
        { type: 'logo', x: 10, y: 10, w: 140, h: 40, props: { label: 'Prefeitura' } },
        { type: 'clock', x: 260, y: 10, w: 90, h: 40, props: { label: 'Relógio' } },
        { type: 'banner', x: 0, y: 55, w: 360, h: 260, props: { label: 'Evento Principal' } },
        { type: 'news', x: 0, y: 315, w: 360, h: 130, props: { label: 'Agenda' } },
        { type: 'bus-list', x: 0, y: 445, w: 360, h: 110, props: { label: 'Transporte' } },
        { type: 'qr', x: 130, y: 560, w: 100, h: 75, props: { label: 'QR Mais Info' } }
      ]
    }
  },

  addComponent(type, x, y, w, h) {
    const def = this.COMPONENT_TYPES[type];
    if (!def) return;
    const comp = {
      id: 'comp-' + this.nextId++,
      type,
      x: x || 0,
      y: y || 0,
      w: w || def.defaultW,
      h: h || def.defaultH,
      props: { label: def.name, opacity: 100, rotation: 0, borderRadius: 0, animation: 'none' }
    };
    // Clamp to canvas
    comp.x = Math.max(0, Math.min(comp.x, this.canvasW - comp.w));
    comp.y = Math.max(0, Math.min(comp.y, this.canvasH - comp.h));
    this.components.push(comp);
    this.selectedId = comp.id;
    this.renderCanvas();
    this.renderProperties();
    this.renderPreview();
    return comp;
  },

  selectComponent(id) {
    this.selectedId = id;
    this.renderCanvas();
    this.renderProperties();
  },

  deleteComponent(id) {
    this.components = this.components.filter(c => c.id !== id);
    if (this.selectedId === id) this.selectedId = null;
    this.renderCanvas();
    this.renderProperties();
    this.renderPreview();
  },

  duplicateComponent(id) {
    const comp = this.components.find(c => c.id === id);
    if (!comp) return;
    this.addComponent(comp.type, comp.x + 15, comp.y + 15, comp.w, comp.h);
  },

  moveComponent(id, x, y) {
    const comp = this.components.find(c => c.id === id);
    if (!comp) return;
    comp.x = Math.max(0, Math.min(x, this.canvasW - comp.w));
    comp.y = Math.max(0, Math.min(y, this.canvasH - comp.h));
    this.renderCanvas();
    this.renderPreview();
  },

  resizeComponent(id, w, h) {
    const comp = this.components.find(c => c.id === id);
    if (!comp) return;
    comp.w = Math.max(30, Math.min(w, this.canvasW - comp.x));
    comp.h = Math.max(20, Math.min(h, this.canvasH - comp.y));
    this.renderCanvas();
    this.renderProperties();
    this.renderPreview();
  },

  reorderComponent(id, direction) {
    const idx = this.components.findIndex(c => c.id === id);
    if (idx === -1) return;
    if (direction === 'front' && idx < this.components.length - 1) {
      [this.components[idx], this.components[idx + 1]] = [this.components[idx + 1], this.components[idx]];
    } else if (direction === 'back' && idx > 0) {
      [this.components[idx], this.components[idx - 1]] = [this.components[idx - 1], this.components[idx]];
    }
    this.renderCanvas();
    this.renderPreview();
  },

  loadTemplate(templateKey) {
    const template = this.TEMPLATES[templateKey];
    if (!template) return;
    this.components = [];
    this.nextId = 1;
    this.selectedId = null;
    template.components.forEach(tc => {
      const comp = {
        id: 'comp-' + this.nextId++,
        type: tc.type,
        x: tc.x, y: tc.y, w: tc.w, h: tc.h,
        props: { ...tc.props, opacity: 100, rotation: 0, borderRadius: 0, animation: 'none' }
      };
      this.components.push(comp);
    });
    this.renderCanvas();
    this.renderProperties();
    this.renderPreview();
  },

  getComponentInner(comp) {
    const scale = this.canvasW / this.realW;
    switch (comp.type) {
      case 'map':
        return `<div class="comp-inner-map">🗺️ MAPA DE LINHAS</div>`;
      case 'bus-list':
        return `<div class="comp-inner-buslist"><div class="bus-header">PRÓXIMOS ÔNIBUS</div><div style="padding:4px;flex:1;display:flex;flex-direction:column;gap:2px;"><div style="display:flex;justify-content:space-between;"><span style="background:#2D9B5A;color:white;padding:1px 4px;border-radius:2px;font-size:8px;font-weight:700;">523</span><span style="font-weight:600;font-size:8px;">T. Laranjeiras</span><span style="color:#EF4444;font-weight:700;font-size:8px;">2 min</span></div><div style="display:flex;justify-content:space-between;"><span style="background:#3B82F6;color:white;padding:1px 4px;border-radius:2px;font-size:8px;font-weight:700;">507</span><span style="font-weight:600;font-size:8px;">Vitória</span><span style="color:#EF4444;font-weight:700;font-size:8px;">5 min</span></div></div></div>`;
      case 'clock':
        return `<div class="comp-inner-clock"><div style="font-size:20px;">${new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div><div style="font-size:8px;color:#9CA3AF;">${new Date().toLocaleDateString('pt-BR')}</div></div>`;
      case 'video':
        return `<div class="comp-inner-video">▶</div>`;
      case 'banner':
        return `<div class="comp-inner-banner">${comp.props.label || '🖼️ BANNER'}</div>`;
      case 'weather':
        return `<div class="comp-inner-weather">🌤️ 28°C Serra</div>`;
      case 'news':
        return `<div class="comp-inner-news"><div style="font-weight:700;font-size:10px;">📰 NOTÍCIAS</div><div>• Prefeitura inaugura nova linha</div><div>• Obras na ES-010 concluídas</div><div>• Festival de inverno 2025</div></div>`;
      case 'qr':
        return `<div class="comp-inner-qr"><div style="width:80%;height:80%;background:repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50%/10px 10px;border-radius:4px;"></div></div>`;
      case 'logo':
        return `<div class="comp-inner-logo"><span>SerraBus</span> <span style="color:#2D9B5A;font-weight:300;margin-left:4px;">CONECT</span></div>`;
      case 'text':
        return `<div class="comp-inner-text">${comp.props.textContent || comp.props.label || 'Texto aqui...'}</div>`;
      default:
        return `<div style="padding:8px;color:white;font-size:10px;">${comp.type}</div>`;
    }
  },

  renderCanvas() {
    const canvas = document.getElementById('designer-canvas');
    if (!canvas) return;

    // Remove apenas os componentes, mantendo snap lines e placeholders
    canvas.querySelectorAll('.canvas-component, .canvas-empty-state').forEach(el => el.remove());

    if (this.components.length === 0) {
      canvas.innerHTML = `<div class="canvas-empty-state"><div class="empty-icon">🎨</div><h3>Canvas Vazio</h3><p>Arraste componentes da paleta esquerda ou escolha um template</p></div>`;
      return;
    }

    this.components.forEach((comp, idx) => {
      const el = document.createElement('div');
      el.className = 'canvas-component' + (comp.id === this.selectedId ? ' selected' : '');
      el.dataset.id = comp.id;
      el.style.left = comp.x + 'px';
      el.style.top = comp.y + 'px';
      el.style.width = comp.w + 'px';
      el.style.height = comp.h + 'px';
      el.style.zIndex = idx + 1;
      if (comp.props.opacity < 100) el.style.opacity = comp.props.opacity / 100;
      if (comp.props.rotation) el.style.transform = `rotate(${comp.props.rotation}deg)`;
      if (comp.props.borderRadius) el.style.borderRadius = comp.props.borderRadius + 'px';

      const def = this.COMPONENT_TYPES[comp.type];
      el.innerHTML = `
        <div class="component-label" style="background:${def.color};">${def.icon} ${comp.props.label || def.name}</div>
        ${this.getComponentInner(comp)}
        <div class="resize-handle nw"></div><div class="resize-handle ne"></div>
        <div class="resize-handle sw"></div><div class="resize-handle se"></div>
        <div class="resize-handle n"></div><div class="resize-handle s"></div>
        <div class="resize-handle w"></div><div class="resize-handle e"></div>
      `;

      // Click to select
      el.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) {
          this._startResize(e, comp.id, e.target);
          return;
        }
        e.stopPropagation();
        this.selectComponent(comp.id);
        this._startDrag(e, comp.id);
      });

      canvas.appendChild(el);
    });
  },

  _startDrag(e, compId) {
    const comp = this.components.find(c => c.id === compId);
    if (!comp) return;
    this.isDragging = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = comp.x;
    const origY = comp.y;

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      this.moveComponent(compId, origX + dx, origY + dy);
    };

    const onUp = () => {
      this.isDragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      this.renderPreview();
      this.renderProperties();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },

  _startResize(e, compId, handle) {
    e.stopPropagation();
    e.preventDefault();
    const comp = this.components.find(c => c.id === compId);
    if (!comp) return;
    this.isResizing = true;
    this.selectComponent(compId);
    const startX = e.clientX;
    const startY = e.clientY;
    const origW = comp.w;
    const origH = comp.h;
    const origX = comp.x;
    const origY = comp.y;
    const dir = [...handle.classList].find(c => c !== 'resize-handle');

    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let newW = origW, newH = origH, newX = origX, newY = origY;
      if (dir.includes('e')) newW = origW + dx;
      if (dir.includes('w')) { newW = origW - dx; newX = origX + dx; }
      if (dir.includes('s')) newH = origH + dy;
      if (dir.includes('n')) { newH = origH - dy; newY = origY + dy; }
      if (newX < 0) { newW += newX; newX = 0; }
      if (newY < 0) { newH += newY; newY = 0; }
      comp.x = Math.max(0, newX);
      comp.y = Math.max(0, newY);
      this.resizeComponent(compId, newW, newH);
    };

    const onUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  },

  renderProperties() {
    const container = document.getElementById('designer-props-content');
    if (!container) return;

    if (!this.selectedId) {
      container.innerHTML = `<div class="designer-props-empty">Selecione um componente no canvas para editar suas propriedades</div>`;
      return;
    }

    const comp = this.components.find(c => c.id === this.selectedId);
    if (!comp) return;
    const def = this.COMPONENT_TYPES[comp.type];

    container.innerHTML = `
      <div class="designer-props">
        <div class="designer-props-title">
          <span>${def.icon} ${def.name}</span>
          <span style="font-size:10px;color:#9CA3AF;">${comp.id}</span>
        </div>
        <div class="prop-group">
          <div class="prop-label">Nome</div>
          <input class="prop-input" id="prop-label" value="${comp.props.label || ''}" onchange="DesignerEngine._updateProp('label', this.value)">
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <div class="prop-label">Posição X</div>
            <input class="prop-input" type="number" id="prop-x" value="${Math.round(comp.x)}" onchange="DesignerEngine._updatePos('x', this.value)">
          </div>
          <div class="prop-group">
            <div class="prop-label">Posição Y</div>
            <input class="prop-input" type="number" id="prop-y" value="${Math.round(comp.y)}" onchange="DesignerEngine._updatePos('y', this.value)">
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <div class="prop-label">Largura</div>
            <input class="prop-input" type="number" id="prop-w" value="${Math.round(comp.w)}" onchange="DesignerEngine._updateSize('w', this.value)">
          </div>
          <div class="prop-group">
            <div class="prop-label">Altura</div>
            <input class="prop-input" type="number" id="prop-h" value="${Math.round(comp.h)}" onchange="DesignerEngine._updateSize('h', this.value)">
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <div class="prop-label">Opacidade %</div>
            <input class="prop-input" type="number" min="0" max="100" value="${comp.props.opacity || 100}" onchange="DesignerEngine._updateProp('opacity', parseInt(this.value))">
          </div>
          <div class="prop-group">
            <div class="prop-label">Rotação °</div>
            <input class="prop-input" type="number" value="${comp.props.rotation || 0}" onchange="DesignerEngine._updateProp('rotation', parseInt(this.value))">
          </div>
        </div>
        <div class="prop-row">
          <div class="prop-group">
            <div class="prop-label">Borda Radius</div>
            <input class="prop-input" type="number" min="0" value="${comp.props.borderRadius || 0}" onchange="DesignerEngine._updateProp('borderRadius', parseInt(this.value))">
          </div>
          <div class="prop-group">
            <div class="prop-label">Animação</div>
            <select class="prop-input" onchange="DesignerEngine._updateProp('animation', this.value)">
              <option value="none" ${comp.props.animation === 'none' ? 'selected' : ''}>Nenhuma</option>
              <option value="fade" ${comp.props.animation === 'fade' ? 'selected' : ''}>Fade</option>
              <option value="slide" ${comp.props.animation === 'slide' ? 'selected' : ''}>Slide</option>
              <option value="zoom" ${comp.props.animation === 'zoom' ? 'selected' : ''}>Zoom</option>
            </select>
          </div>
        </div>
        ${comp.type === 'text' ? `
        <div class="prop-group">
          <div class="prop-label">Conteúdo</div>
          <textarea class="prop-input" rows="3" onchange="DesignerEngine._updateProp('textContent', this.value)">${comp.props.textContent || ''}</textarea>
        </div>` : ''}
        <div class="prop-actions">
          <button class="prop-action-btn" onclick="DesignerEngine.duplicateComponent('${comp.id}')">📋 Duplicar</button>
          <button class="prop-action-btn" onclick="DesignerEngine.reorderComponent('${comp.id}','front')">⬆ Frente</button>
          <button class="prop-action-btn" onclick="DesignerEngine.reorderComponent('${comp.id}','back')">⬇ Trás</button>
          <button class="prop-action-btn danger" onclick="DesignerEngine.deleteComponent('${comp.id}')">🗑️ Excluir</button>
        </div>
      </div>
    `;
  },

  _updateProp(key, value) {
    const comp = this.components.find(c => c.id === this.selectedId);
    if (!comp) return;
    comp.props[key] = value;
    this.renderCanvas();
    this.renderPreview();
  },

  _updatePos(axis, value) {
    const comp = this.components.find(c => c.id === this.selectedId);
    if (!comp) return;
    comp[axis] = parseInt(value) || 0;
    this.renderCanvas();
    this.renderPreview();
  },

  _updateSize(dim, value) {
    const comp = this.components.find(c => c.id === this.selectedId);
    if (!comp) return;
    if (dim === 'w') this.resizeComponent(comp.id, parseInt(value) || 30, comp.h);
    else this.resizeComponent(comp.id, comp.w, parseInt(value) || 20);
  },

  renderPreview() {
    const frame = document.getElementById('designer-preview-frame');
    if (!frame) return;
    const scaleX = 180 / this.canvasW;
    const scaleY = 320 / this.canvasH;
    let html = '';
    this.components.forEach(comp => {
      const px = comp.x * scaleX;
      const py = comp.y * scaleY;
      const pw = comp.w * scaleX;
      const ph = comp.h * scaleY;
      html += `<div style="position:absolute;left:${px}px;top:${py}px;width:${pw}px;height:${ph}px;overflow:hidden;font-size:${Math.max(4, 6 * scaleX)}px;">${this.getComponentInner(comp)}</div>`;
    });
    if (html === '') {
      html = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.3);font-size:10px;">Vazio</div>`;
    }
    frame.innerHTML = html;
  },

  getLayoutData() {
    return {
      canvas: { width: this.realW, height: this.realH, background: '#1A1A2E' },
      components: this.components.map(c => ({
        id: c.id,
        type: c.type,
        x: Math.round(c.x * (this.realW / this.canvasW)),
        y: Math.round(c.y * (this.realH / this.canvasH)),
        w: Math.round(c.w * (this.realW / this.canvasW)),
        h: Math.round(c.h * (this.realH / this.canvasH)),
        props: { ...c.props }
      }))
    };
  },

  async saveLayout() {
    const nameInput = document.getElementById('designer-layout-name');
    const layoutName = nameInput ? nameInput.value : this.layoutName;
    const layoutData = this.getLayoutData();

    try {
      if (this.layoutId) {
        await window.supabase.from('totem_layouts').update({
          nome: layoutName,
          layout_data: layoutData,
          updated_at: new Date().toISOString()
        }).eq('id', this.layoutId);
      } else {
        const { data, error } = await window.supabase.from('totem_layouts').insert([{
          nome: layoutName,
          layout_data: layoutData,
          status: 'rascunho'
        }]).select();
        if (error) throw error;
        if (data && data.length > 0) this.layoutId = data[0].id;
      }
      alert('Layout salvo com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar: ' + (err.message || JSON.stringify(err)));
    }
  },

  async publishLayout() {
    if (!this.layoutId) {
      await this.saveLayout();
    }
    if (!this.layoutId) return;

    const totens = await window.AppData.getTotens();
    const options = totens.map(t => `<option value="${t.id}">${t.nome} (${t.status})</option>`).join('');

    const modalHTML = `
      <div class="modal-overlay active" id="modal-publish-layout">
        <div class="modal-box" style="max-width:450px;">
          <div class="modal-header">
            <div class="modal-title">🚀 Publicar Layout</div>
            <button class="modal-close" onclick="document.getElementById('modal-publish-layout').remove()">✕</button>
          </div>
          <div class="modal-body" style="padding:24px;">
            <p style="color:#6B7280;font-size:14px;margin-bottom:16px;">Selecione os totens que receberão este layout:</p>
            <div style="margin-bottom:16px;">
              <label style="display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:8px;">
                <input type="checkbox" id="pub-all" checked onchange="document.getElementById('pub-select').style.display = this.checked ? 'none' : 'block'"> Todos os Totens
              </label>
              <select id="pub-select" multiple style="display:none;width:100%;height:120px;padding:8px;border:1px solid #D1D5DB;border-radius:6px;">${options}</select>
            </div>
          </div>
          <div class="modal-footer" style="padding:16px 24px;display:flex;gap:8px;justify-content:flex-end;border-top:1px solid #E5E7EB;">
            <button class="btn btn-secondary" onclick="document.getElementById('modal-publish-layout').remove()">Cancelar</button>
            <button class="btn btn-primary" onclick="DesignerEngine._doPublish()" style="background:#3B82F6;">🚀 Publicar Agora</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  async _doPublish() {
    try {
      await window.supabase.from('totem_layouts').update({ status: 'publicado' }).eq('id', this.layoutId);

      const allChecked = document.getElementById('pub-all').checked;
      let totemIds = [];
      if (allChecked) {
        const totens = await window.AppData.getTotens();
        totemIds = totens.map(t => t.id);
      } else {
        const select = document.getElementById('pub-select');
        for (let opt of select.options) { if (opt.selected) totemIds.push(parseInt(opt.value)); }
      }

      // Remove vínculos antigos deste layout
      await window.supabase.from('totem_layout_assignments').delete().eq('layout_id', this.layoutId);

      // Cria novos vínculos
      if (totemIds.length > 0) {
        const links = totemIds.map(tid => ({
          layout_id: this.layoutId,
          totem_id: tid,
          ativo: true,
          published_at: new Date().toISOString()
        }));
        await window.supabase.from('totem_layout_assignments').insert(links);
      }

      document.getElementById('modal-publish-layout').remove();
      alert(`Layout publicado com sucesso para ${totemIds.length} totem(s)!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar: ' + (err.message || JSON.stringify(err)));
    }
  },

  switchRightTab(tab) {
    document.querySelectorAll('.designer-right-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.designer-right-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById('designer-preview-section').style.display = tab === 'preview' ? 'block' : 'none';
    document.getElementById('designer-props-section').style.display = tab === 'propriedades' ? 'block' : 'none';
  }
};


// ==========================================
// PÁGINA DO DESIGNER
// ==========================================
Pages.designer = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    headerActions.innerHTML = `
      <button class="btn btn-secondary" onclick="window.Router.navigate('totens')">${window.Components ? window.Components.icon('arrow-left', 16) : '←'} Voltar</button>
    `;
  }

  // Reset engine
  DesignerEngine.components = [];
  DesignerEngine.selectedId = null;
  DesignerEngine.nextId = 1;
  DesignerEngine.layoutId = null;

  const paletteItems = Object.entries(DesignerEngine.COMPONENT_TYPES).map(([key, def]) => `
    <div class="palette-item" draggable="true" data-type="${key}">
      <div class="palette-icon" style="background:${def.color}20;color:${def.color};">${def.icon}</div>
      <span>${def.name}</span>
    </div>
  `).join('');

  const templateItems = Object.entries(DesignerEngine.TEMPLATES).map(([key, tmpl]) => `
    <button class="template-btn" onclick="DesignerEngine.loadTemplate('${key}')">${tmpl.name}</button>
  `).join('');

  main.innerHTML = `
    <!-- Toolbar -->
    <div class="designer-toolbar">
      <div class="designer-toolbar-left">
        <input class="toolbar-input" id="designer-layout-name" value="Novo Layout" placeholder="Nome do layout...">
        <span style="font-size:12px;color:#9CA3AF;">${DesignerEngine.components.length} componentes</span>
      </div>
      <div class="designer-toolbar-right">
        <button class="toolbar-btn" onclick="DesignerEngine.components=[];DesignerEngine.selectedId=null;DesignerEngine.renderCanvas();DesignerEngine.renderProperties();DesignerEngine.renderPreview();">🗑️ Limpar</button>
        <button class="toolbar-btn primary" onclick="DesignerEngine.saveLayout()">💾 Salvar</button>
        <button class="toolbar-btn publish" onclick="DesignerEngine.publishLayout()">🚀 Publicar</button>
      </div>
    </div>

    <!-- Main Layout: 3 columns -->
    <div class="designer-layout">
      
      <!-- LEFT: Componentes -->
      <div class="designer-palette">
        <div class="designer-palette-header">📦 Componentes</div>
        <div class="designer-palette-list" id="palette-list">
          ${paletteItems}
        </div>
        <div class="designer-palette-templates">
          <div class="designer-palette-header">📋 Templates Prontos</div>
          ${templateItems}
        </div>
      </div>

      <!-- CENTER: Canvas -->
      <div class="designer-canvas-area">
        <div class="designer-canvas-wrapper">
          <div class="designer-canvas" id="designer-canvas"></div>
        </div>
      </div>

      <!-- RIGHT: Preview + Properties -->
      <div class="designer-right-panel">
        <div class="designer-right-tabs">
          <div class="designer-right-tab active" data-tab="preview" onclick="DesignerEngine.switchRightTab('preview')">👁 Preview</div>
          <div class="designer-right-tab" data-tab="propriedades" onclick="DesignerEngine.switchRightTab('propriedades')">⚙️ Propriedades</div>
        </div>
        <div class="designer-right-content">
          <div id="designer-preview-section">
            <div class="designer-preview-container">
              <div class="designer-preview-frame" id="designer-preview-frame"></div>
              <div class="designer-preview-label"><span class="dot"></span> Preview em tempo real</div>
            </div>
          </div>
          <div id="designer-props-section" style="display:none;">
            <div id="designer-props-content">
              <div class="designer-props-empty">Selecione um componente no canvas para editar suas propriedades</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Initialize canvas
  setTimeout(() => {
    DesignerEngine.renderCanvas();
    DesignerEngine.renderPreview();
    DesignerEngine.renderProperties();
    _initDragAndDrop();
  }, 100);
};

// ==========================================
// DRAG & DROP da paleta para o canvas
// ==========================================
function _initDragAndDrop() {
  const canvas = document.getElementById('designer-canvas');
  if (!canvas) return;

  // Palette items → drag start
  document.querySelectorAll('.palette-item[draggable]').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', item.dataset.type);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  // Canvas → drag over & drop
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    canvas.classList.add('drag-over');
  });

  canvas.addEventListener('dragleave', () => {
    canvas.classList.remove('drag-over');
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    const type = e.dataTransfer.getData('text/plain');
    if (!type || !DesignerEngine.COMPONENT_TYPES[type]) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const def = DesignerEngine.COMPONENT_TYPES[type];
    DesignerEngine.addComponent(type, Math.max(0, x - def.defaultW / 2), Math.max(0, y - def.defaultH / 2));

    // Update toolbar counter
    const counter = document.querySelector('.designer-toolbar-left span');
    if (counter) counter.textContent = DesignerEngine.components.length + ' componentes';
  });

  // Canvas background click → deselect
  canvas.addEventListener('mousedown', (e) => {
    if (e.target === canvas || e.target.classList.contains('canvas-empty-state')) {
      DesignerEngine.selectComponent(null);
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (DesignerEngine.selectedId) {
        DesignerEngine.deleteComponent(DesignerEngine.selectedId);
        const counter = document.querySelector('.designer-toolbar-left span');
        if (counter) counter.textContent = DesignerEngine.components.length + ' componentes';
      }
    }
    if (e.key === 'd' && e.ctrlKey) {
      e.preventDefault();
      if (DesignerEngine.selectedId) {
        DesignerEngine.duplicateComponent(DesignerEngine.selectedId);
      }
    }
  });
}
