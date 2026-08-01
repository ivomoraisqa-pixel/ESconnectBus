window.Pages = window.Pages || {};

// Helpers globais para Drag & Drop do Kanban
window.allowDrop = function(ev) {
  ev.preventDefault();
  ev.currentTarget.classList.add('drag-over');
};

window.dragLeave = function(ev) {
  ev.currentTarget.classList.remove('drag-over');
};

window.drag = function(ev) {
  ev.dataTransfer.setData("text", ev.currentTarget.dataset.id);
  ev.dataTransfer.effectAllowed = 'move';
  ev.currentTarget.classList.add('is-dragging');
};

window.dragEnd = function(ev) {
  ev.currentTarget.classList.remove('is-dragging');
};

window.drop = async function(ev, columnRegiao) {
  ev.preventDefault();
  ev.currentTarget.classList.remove('drag-over');
  const id = ev.dataTransfer.getData("text");
  
  // Atualiza no banco
  try {
    await window.AppData.updateInformativo(id, { totens_alvo: columnRegiao });
    // Re-renderiza a tela para refletir a mudança
    await window.Pages.informativos();
  } catch(e) {
    console.error("Erro ao mover card", e);
    alert("Erro ao mover o informativo.");
  }
};

window.Pages.togglePauseInformativo = async function(id, statusAtual) {
  const novoStatus = statusAtual === 'pausado' ? 'ativo' : 'pausado';
  const novoAtivo = statusAtual === 'pausado' ? true : false;
  try {
    await window.AppData.updateInformativo(id, { status: novoStatus, ativo: novoAtivo });
    await window.Pages.informativos();
  } catch(e) {
    console.error("Erro ao pausar/despausar", e);
    alert("Erro ao alterar o status.");
  }
};

window.Pages.informativos = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const informativosFull = window.AppData ? await window.AppData.getInformativos() : [];
  // Filtra sujeiras do DB (ex: sem titulo)
  const informativos = informativosFull.filter(i => i.titulo);

  // Agrupamento por região
  const regioes = {
    'Todos os Totens do Município': [],
    'Apenas Laranjeiras': [],
    'Apenas Jacaraípe': []
  };

  // Coloca os que não tem região válida em "Todos"
  informativos.forEach(info => {
    const regiao = regioes[info.totens_alvo] ? info.totens_alvo : 'Todos os Totens do Município';
    regioes[regiao].push(info);
  });

  const generateCard = (info) => {
    const isPaused = info.status === 'pausado';
    return `
      <div class="kanban-card ${isPaused ? 'paused' : ''}" draggable="true" ondragstart="drag(event)" ondragend="dragEnd(event)" data-id="${info.id}">
        <div class="kanban-card-title" style="display:flex; align-items:center; gap:8px;">
          ${isPaused ? '<span style="font-size:16px;">⏸️</span>' : '<div style="width:8px; height:8px; border-radius:50%; background:#10B981;"></div>'}
          <span style="font-weight:700; color:#111827;">${info.titulo}</span>
        </div>
        <div class="kanban-card-text" style="color:#6B7280; font-size:13px; margin:12px 0; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden;">
          ${info.mensagem || info.msg || 'Sem mensagem...'}
        </div>
        <div class="kanban-card-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:16px; padding-top:12px; border-top:1px solid #F3F4F6;">
          ${window.Components.badge ? window.Components.badge(info.status || 'ativo') : `<span style="padding:4px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; background: ${isPaused ? '#F3F4F6' : '#ECFDF5'}; color: ${isPaused ? '#6B7280' : '#059669'}; border:1px solid ${isPaused ? '#E5E7EB' : '#A7F3D0'};">${info.status || 'ativo'}</span>`}
          <div style="display:flex; gap:6px;">
            <button class="btn btn-icon" style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; border:none; cursor:pointer; background:${isPaused ? '#10B981' : '#F3F4F6'}; color:${isPaused ? 'white' : '#4B5563'}; transition:all 0.2s;" title="${isPaused ? 'Retomar' : 'Pausar'}" onclick="window.Pages.togglePauseInformativo(${info.id}, '${info.status}')" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              ${window.Components.icon ? window.Components.icon(isPaused ? 'play' : 'pause', 14) : (isPaused ? '▶' : '⏸')}
            </button>
            <button class="btn btn-icon" style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; border:none; cursor:pointer; background:#EFF6FF; color:#3B82F6; transition:all 0.2s;" title="Editar" onclick="window.Pages.editarInformativo(${info.id})" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              ${window.Components.icon ? window.Components.icon('edit', 14) : '✎'}
            </button>
            <button class="btn btn-icon" style="display:flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:6px; border:none; cursor:pointer; background:#FEF2F2; color:#EF4444; transition:all 0.2s;" title="Excluir" onclick="window.Pages.excluirInformativo(${info.id})" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              ${window.Components.icon ? window.Components.icon('trash', 14) : '✕'}
            </button>
          </div>
        </div>
      </div>
    `;
  };

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Informativos</h1>
        <p>Mensagens de texto exibidas no rodapé dos totens</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.Router.navigate('informativos-novo')">
          ${window.Components.icon ? window.Components.icon('plus', 16) : ''} Criar Informativo
        </button>
      </div>
    </div>
    
    <div class="kanban-board">
      <!-- Coluna Todos -->
      <div class="kanban-column" ondrop="drop(event, 'Todos os Totens do Município')" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
        <div class="kanban-header">
          <span>Todos os Totens</span>
          <span class="kanban-count">${regioes['Todos os Totens do Município'].length}</span>
        </div>
        <div class="kanban-body">
          ${regioes['Todos os Totens do Município'].map(generateCard).join('')}
        </div>
      </div>

      <!-- Coluna Laranjeiras -->
      <div class="kanban-column" ondrop="drop(event, 'Apenas Laranjeiras')" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
        <div class="kanban-header">
          <span>Laranjeiras</span>
          <span class="kanban-count">${regioes['Apenas Laranjeiras'].length}</span>
        </div>
        <div class="kanban-body">
          ${regioes['Apenas Laranjeiras'].map(generateCard).join('')}
        </div>
      </div>

      <!-- Coluna Jacaraípe -->
      <div class="kanban-column" ondrop="drop(event, 'Apenas Jacaraípe')" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
        <div class="kanban-header">
          <span>Jacaraípe</span>
          <span class="kanban-count">${regioes['Apenas Jacaraípe'].length}</span>
        </div>
        <div class="kanban-body">
          ${regioes['Apenas Jacaraípe'].map(generateCard).join('')}
        </div>
      </div>
    </div>
  `;

  main.innerHTML = html;

  window.addInformativo = function() {
    window.Router.navigate('informativos-novo');
  };
};

Pages.informativosNovo = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  
  const headerActions = document.getElementById('header-actions');
  if (headerActions) {
    headerActions.innerHTML = `<button class="btn btn-secondary" onclick="window.Router.navigate('informativos')">${window.Components ? window.Components.icon('arrow-left', 16) : ''} Voltar</button>`;
  }

  main.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px;">
      
      <!-- Formulário -->
      <div class="card" style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:20px; border-bottom:1px solid #E5E7EB; font-weight:600; font-size:16px;">
          Configuração do Informativo
        </div>
        <div class="card-body" style="padding:24px;">
          <form id="form-novo-informativo" onsubmit="window.Pages.salvarInformativo(event)">
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Categoria</label>
                <select id="ni-categoria" required class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" onchange="document.getElementById('preview-info-icon').innerText = this.options[this.selectedIndex].text.split(' ')[0]">
                  <option value="emergencia">⚠️ Emergência</option>
                  <option value="evento">🎉 Evento</option>
                  <option value="obra">🚧 Obra</option>
                  <option value="saude">🏥 Saúde</option>
                  <option value="educacao">📚 Educação</option>
                  <option value="geral">ℹ️ Geral</option>
                </select>
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Prioridade</label>
                <select id="ni-prioridade" required class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
                  <option value="alta">Alta (Banner Fixo)</option>
                  <option value="media">Média (Rodapé)</option>
                  <option value="baixa">Baixa (Rotativo)</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:20px;">
              <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Título</label>
              <input id="ni-titulo" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" placeholder="Ex: Interdição na Avenida Central" oninput="document.getElementById('preview-info-title').innerText = this.value || 'TÍTULO DO INFORMATIVO'">
            </div>

            <div style="margin-bottom:20px;">
              <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Texto do Informativo</label>
              <textarea id="ni-texto" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" rows="3" placeholder="Digite a mensagem..." oninput="document.getElementById('preview-info-text').innerText = this.value || 'O texto detalhado do informativo aparecerá aqui.'"></textarea>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Cor de Fundo</label>
                <input id="ni-cor-fundo" type="color" class="form-input" style="width:100%; height:42px; padding:4px 8px; border:1px solid #D1D5DB; border-radius:6px;" value="#EF4444" oninput="document.getElementById('preview-info-banner').style.backgroundColor = this.value">
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Cor do Texto</label>
                <input id="ni-cor-texto" type="color" class="form-input" style="width:100%; height:42px; padding:4px 8px; border:1px solid #D1D5DB; border-radius:6px;" value="#FFFFFF" oninput="document.getElementById('preview-info-banner').style.color = this.value">
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Data Início</label>
                <input id="ni-inicio" type="date" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
              </div>
              <div>
                <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Data Fim</label>
                <input id="ni-fim" type="date" required class="form-input" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
              </div>
            </div>

            <div style="margin-bottom:24px;">
              <label style="font-size:13px; font-weight:500; display:block; margin-bottom:6px; color:#374151;">Totens Alvo</label>
              <select id="ni-totens" class="form-input form-select" style="width:100%; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;">
                <option>Todos os Totens do Município</option>
                <option>Apenas Laranjeiras</option>
                <option>Apenas Jacaraípe</option>
              </select>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #E5E7EB; padding-top:20px;">
              <button type="button" class="btn btn-secondary" onclick="window.Router.navigate('informativos')" style="padding:10px 20px;">Cancelar</button>
              <button id="ni-btn-salvar" type="submit" class="btn btn-primary" style="padding:10px 24px; background:#2D9B5A; border:none; color:white; font-weight:600; font-size:14px;">Publicar Informativo</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Preview do Totem -->
      <div class="card" style="background:white; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div class="card-header" style="padding:20px; border-bottom:1px solid #E5E7EB; font-weight:600; font-size:16px; display:flex; justify-content:space-between; align-items:center;">
          Preview em Tempo Real
        </div>
        <div class="card-body" style="padding:24px 0; background:#F9FAFB; display:flex; justify-content:center; overflow:hidden;">
          
          <div style="width:270px; height:480px; position:relative;">
            
            <!-- Totem 1080x1920 -->
            <div style="width:1080px; height:1920px; transform:scale(0.25); transform-origin:top left; position:absolute; top:0; left:0; background:#1A1A2E; overflow:hidden; font-family:'Inter', sans-serif; color:white; border:24px solid #111; border-radius:64px; box-sizing:border-box; display:flex; flex-direction:column; box-shadow: inset 0 0 20px rgba(0,0,0,0.5);">
              
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

              <!-- Base View (Mapa GTFS) -->
              <div style="flex:1; position:relative; background:white; display:flex; flex-direction:column;">
                <div style="background:#2D9B5A; padding:24px 40px; font-weight:700; font-size:36px; color:white;">PRÓXIMOS ÔNIBUS</div>
                <div style="background:white; color:#1A1A2E; flex:1;">
                  <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
                    <span style="background:#2D9B5A; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">523</span>
                    <span style="flex:1; font-size:42px; font-weight:600;">TERMINAL LARANJEIRAS</span>
                    <span style="font-weight:700; font-size:48px;">2 min</span>
                  </div>
                </div>
                <div style="height:700px; background:#e5e7eb; position:relative; border-top:4px solid #E5E7EB;">
                  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:48px; color:#9CA3AF; font-weight:600;">MAPA DE LINHAS EM TEMPO REAL</div>
                </div>
                
                <!-- INFORMATIVO BANNER OVERLAY -->
                <div id="preview-info-banner" style="position:absolute; bottom:0; left:0; right:0; background:#EF4444; color:#FFFFFF; padding:40px; box-shadow:0 -10px 40px rgba(0,0,0,0.3); z-index:20; border-top-left-radius:32px; border-top-right-radius:32px;">
                  <div style="display:flex; align-items:center; gap:24px; margin-bottom:16px;">
                    <span id="preview-info-icon" style="font-size:64px;">⚠️</span>
                    <h1 id="preview-info-title" style="margin:0; font-size:48px; font-weight:800; text-transform:uppercase; letter-spacing:2px;">TÍTULO DO INFORMATIVO</h1>
                  </div>
                  <p id="preview-info-text" style="margin:0; font-size:36px; line-height:1.4; font-weight:500;">O texto detalhado do informativo aparecerá aqui.</p>
                </div>
                <!-- /INFORMATIVO BANNER OVERLAY -->

              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; padding:32px 40px; background:#1A1A2E; border-top:2px solid #333;">
                <div style="font-size:32px;"><strong style="color:white;">SerraBus</strong> <span style="color:#2D9B5A; font-weight:300;">CONECT</span></div>
                <div style="font-size:32px; color:#A3B8B0;">📶 Wi-Fi Grátis</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  `;
  
  if (window._editInfoId && window._editInfoData) {
    const d = window._editInfoData;
    setTimeout(() => {
      document.getElementById("ni-categoria").value = d.categoria || 'geral';
      document.getElementById("ni-prioridade").value = d.prioridade || 'media';
      document.getElementById("ni-titulo").value = d.titulo || '';
      document.getElementById("ni-texto").value = d.mensagem || '';
      document.getElementById("ni-cor-fundo").value = d.cor_fundo || '#EF4444';
      document.getElementById("ni-cor-texto").value = d.cor_texto || '#FFFFFF';
      document.getElementById("ni-inicio").value = d.data_inicio || '';
      document.getElementById("ni-fim").value = d.data_fim || '';
      
      // trigger preview updates
      document.getElementById("ni-titulo").dispatchEvent(new Event('input'));
      document.getElementById("ni-texto").dispatchEvent(new Event('input'));
      document.getElementById("ni-cor-fundo").dispatchEvent(new Event('input'));
      document.getElementById("ni-cor-texto").dispatchEvent(new Event('input'));
    }, 100);
  }
};

Pages.salvarInformativo = async function(e) {
  e.preventDefault();
  const btn = document.getElementById("ni-btn-salvar");
  const oldText = btn.innerHTML;
  btn.innerHTML = "Salvando...";
  btn.disabled = true;
  
  try {
    const data = {
      categoria: document.getElementById("ni-categoria").value,
      prioridade: document.getElementById("ni-prioridade").value,
      titulo: document.getElementById("ni-titulo").value,
      mensagem: document.getElementById("ni-texto").value,
      cor_fundo: document.getElementById("ni-cor-fundo").value,
      cor_texto: document.getElementById("ni-cor-texto").value,
      data_inicio: document.getElementById("ni-inicio").value,
      data_fim: document.getElementById("ni-fim").value,
      totens_alvo: document.getElementById("ni-totens").value,
      ativo: true
    };
    
    if (window._editInfoId) {
      await window.AppData.updateInformativo(window._editInfoId, data);
      alert("Informativo atualizado com sucesso!");
      window._editInfoId = null;
      window._editInfoData = null;
    } else {
      await window.AppData.createInformativo(data);
      alert("Informativo salvo com sucesso no Supabase!");
    }
    
    window.Router.navigate("informativos");
  } catch (err) {
    console.error(err);
    alert("Erro ao salvar informativo.");
    btn.innerHTML = oldText;
    btn.disabled = false;
  }
};

Pages.excluirInformativo = async function(id) {
  if (confirm("Tem certeza que deseja excluir este informativo?")) {
    try {
      await window.AppData.deleteInformativo(id);
      alert("Informativo excluído.");
      window.Router.navigate("informativos");
    } catch(err) {
      console.error(err);
      alert("Erro ao excluir informativo.");
    }
  }
};

Pages.editarInformativo = async function(id) {
  const informativos = await window.AppData.getInformativos();
  const info = informativos.find(x => x.id === id);
  if (info) {
    window._editInfoId = id;
    window._editInfoData = info;
    window.Router.navigate("informativos-novo");
  }
};

