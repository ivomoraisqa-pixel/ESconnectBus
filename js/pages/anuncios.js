window.Pages = window.Pages || {};

Pages.anunciosDragId = null;

window.Pages.anuncios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const campanhas = window.AppData ? await window.AppData.getCampanhas(true) : [];
  const totensList = window.AppData.getTotens ? await window.AppData.getTotens() : [];
  const totalTotensCount = totensList.length || 6;

  const ativos = campanhas.filter(c => c.status === 'ativa');
  const pausados = campanhas.filter(c => c.status === 'pausada');
  const finalizados = campanhas.filter(c => c.status === 'encerrada' || c.status === 'finalizada' || c.status === 'expirada');

  campanhas.forEach(c => {
    if (c.status !== 'ativa' && c.status !== 'pausada' && !finalizados.includes(c)) {
      finalizados.push(c);
    }
  });

  const totalExibicoes = campanhas.reduce((acc, curr) => acc + (curr.exibicoes || 0), 0);

  const renderCard = (c, colType) => {
    const alvo = c.totens_alvo || {};
    const mediaUrl = alvo.arquivo_url || null;
    const isVideo = mediaUrl && (mediaUrl.indexOf('video') > -1 || mediaUrl.endsWith('.mp4') || mediaUrl.startsWith('data:video/'));
    const cliente = c.descricao ? c.descricao.split('|')[0].replace('Cliente:', '').trim() : 'Prefeitura / Geral';
    const exib = c.exibicoes || 0;
    const tempoSeg = alvo.tempo_exibicao || 15;
    const valor = c.investimento || 1500;

    let mediaPreview = '';
    if (mediaUrl) {
      if (isVideo) {
        mediaPreview = `<video src="${mediaUrl}" muted loop style="width:100%; height:130px; object-fit:cover; border-radius:8px; background:#000;" onmouseover="this.play()" onmouseout="this.pause()"></video>`;
      } else {
        mediaPreview = `<div style="width:100%; height:130px; background-image:url(${mediaUrl}); background-size:cover; background-position:center; border-radius:8px;"></div>`;
      }
    } else {
      mediaPreview = `
        <div style="width:100%; height:130px; background:linear-gradient(135deg, #1E3A8A, #3B82F6); border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; flex-direction:column;">
          <span style="font-size:32px;">📢</span>
          <span style="font-size:12px; font-weight:600; margin-top:4px;">${c.formato || 'Imagem'}</span>
        </div>
      `;
    }

    let actionBtn = '';
    if (colType === 'ativa') {
      actionBtn = `<button class="btn btn-secondary" style="padding:6px 12px; font-size:12px; border-color:#F59E0B; color:#D97706; background:#FEF3C7; cursor:pointer;" onclick="event.stopPropagation(); window.Pages.alterarStatusAnuncio(${c.id}, 'pausada')">⏸️ Pausar</button>`;
    } else if (colType === 'pausada') {
      actionBtn = `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; background:#10B981; border:none; cursor:pointer; color:white;" onclick="event.stopPropagation(); window.Pages.alterarStatusAnuncio(${c.id}, 'ativa')">▶️ Play (Ativar)</button>`;
    } else {
      actionBtn = `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; background:#3B82F6; border:none; cursor:pointer; color:white;" onclick="event.stopPropagation(); window.Pages.renovarCampanha(${c.id})">🔄 Renovar</button>`;
    }

    return `
      <div class="kanban-card card" draggable="true" ondragstart="window.Pages.dragAnuncio(event, ${c.id})" onclick="window.Pages.abrirDetalhesAnuncioModal(${c.id})" style="background:white; border-radius:10px; padding:14px; margin-bottom:14px; box-shadow:0 1px 3px rgba(0,0,0,0.1); cursor:pointer; border:1px solid #E5E7EB; transition:transform 0.15s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
        
        <div style="position:relative; margin-bottom:10px;">
          ${mediaPreview}
          <span style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.75); color:white; padding:2px 8px; border-radius:12px; font-size:10px; font-weight:700;">${tempoSeg}s</span>
        </div>

        <div style="font-weight:700; font-size:14px; color:#111827; margin-bottom:2px;">${c.nome}</div>
        <div style="font-size:12px; color:#6B7280; margin-bottom:10px;">${cliente}</div>

        <div style="display:flex; justify-content:space-between; align-items:center; background:#F9FAFB; padding:8px 10px; border-radius:6px; margin-bottom:12px; font-size:12px;">
          <div>
            <div style="color:#6B7280; font-size:10px; text-transform:uppercase;">Exibições Real</div>
            <div style="font-weight:800; color:#2563EB;">⚡ ${exib.toLocaleString('pt-BR')}</div>
          </div>
          <div style="text-align:right;">
            <div style="color:#6B7280; font-size:10px; text-transform:uppercase;">Valor Anúncio</div>
            <div style="font-weight:700; color:#059669;">R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}</div>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #F3F4F6; padding-top:10px;">
          <button class="btn btn-secondary" style="padding:6px 10px; font-size:11px;" onclick="event.stopPropagation(); window.Pages.abrirDetalhesAnuncioModal(${c.id})">👁️ Detalhes</button>
          ${actionBtn}
        </div>
      </div>
    `;
  };

  main.innerHTML = `
    <div class="page-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
      <div class="page-title">
        <h1 style="font-size:24px; font-weight:700; color:#111827; margin:0;">Gestão Kanban de Anúncios & Publicidade</h1>
        <p style="color:#6B7280; font-size:14px; margin:4px 0 0 0;">Arraste os anúncios entre as colunas para pausar, ativar ou renovar em tempo real</p>
      </div>
      <div class="page-actions" style="display:flex; gap:10px;">
        <button class="btn btn-primary" onclick="window.Router.navigate('nova-campanha')">
          ${window.Components && window.Components.icon ? window.Components.icon('plus', 16) : '➕'} Novo Anúncio
        </button>
      </div>
    </div>

    <!-- KPI Row -->
    <div class="grid-4" style="display:grid; grid-template-columns:repeat(4, 1fr); gap:16px; margin-bottom:24px;">
      <div class="card" style="background:white; border-radius:10px; padding:16px; border-left:4px solid #10B981; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase;">Anúncios Ativos</div>
        <div style="font-size:24px; font-weight:800; color:#065F46; margin-top:4px;">${ativos.length}</div>
      </div>
      <div class="card" style="background:white; border-radius:10px; padding:16px; border-left:4px solid #F59E0B; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase;">Pausados</div>
        <div style="font-size:24px; font-weight:800; color:#92400E; margin-top:4px;">${pausados.length}</div>
      </div>
      <div class="card" style="background:white; border-radius:10px; padding:16px; border-left:4px solid #EF4444; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase;">Finalizados</div>
        <div style="font-size:24px; font-weight:800; color:#991B1B; margin-top:4px;">${finalizados.length}</div>
      </div>
      <div class="card" style="background:white; border-radius:10px; padding:16px; border-left:4px solid #3B82F6; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase;">Exibições Totais (Real)</div>
        <div style="font-size:24px; font-weight:800; color:#1E40AF; margin-top:4px;">⚡ ${totalExibicoes.toLocaleString('pt-BR')}</div>
      </div>
    </div>

    <!-- KANBAN BOARD -->
    <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:20px; align-items:start;">

      <!-- COLUNA 1: ATIVOS -->
      <div style="background:#F3F4F6; border-radius:12px; padding:16px; min-height:600px; border:2px dashed transparent;" ondragover="event.preventDefault(); this.style.borderColor='#10B981';" ondragleave="this.style.borderColor='transparent';" ondrop="window.Pages.dropAnuncio(event, 'ativa')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="margin:0; font-size:15px; font-weight:700; color:#065F46; display:flex; align-items:center; gap:8px;">
            <span style="width:10px; height:10px; border-radius:50%; background:#10B981;"></span>
            ATIVOS (${ativos.length})
          </h3>
          <span style="font-size:11px; color:#6B7280;">Em exibição nos totens</span>
        </div>
        <div>
          ${ativos.map(c => renderCard(c, 'ativa')).join('') || '<div style="padding:40px; text-align:center; color:#9CA3AF; font-size:13px; border:1px dashed #D1D5DB; border-radius:8px;">Nenhum anúncio ativo no momento.</div>'}
        </div>
      </div>

      <!-- COLUNA 2: PAUSADOS -->
      <div style="background:#F3F4F6; border-radius:12px; padding:16px; min-height:600px; border:2px dashed transparent;" ondragover="event.preventDefault(); this.style.borderColor='#F59E0B';" ondragleave="this.style.borderColor='transparent';" ondrop="window.Pages.dropAnuncio(event, 'pausada')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="margin:0; font-size:15px; font-weight:700; color:#92400E; display:flex; align-items:center; gap:8px;">
            <span style="width:10px; height:10px; border-radius:50%; background:#F59E0B;"></span>
            PAUSADOS (${pausados.length})
          </h3>
          <span style="font-size:11px; color:#6B7280;">Pausados temporariamente</span>
        </div>
        <div>
          ${pausados.map(c => renderCard(c, 'pausada')).join('') || '<div style="padding:40px; text-align:center; color:#9CA3AF; font-size:13px; border:1px dashed #D1D5DB; border-radius:8px;">Nenhum anúncio pausado.</div>'}
        </div>
      </div>

      <!-- COLUNA 3: FINALIZADOS -->
      <div style="background:#F3F4F6; border-radius:12px; padding:16px; min-height:600px; border:2px dashed transparent;" ondragover="event.preventDefault(); this.style.borderColor='#EF4444';" ondragleave="this.style.borderColor='transparent';" ondrop="window.Pages.dropAnuncio(event, 'encerrada')">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="margin:0; font-size:15px; font-weight:700; color:#991B1B; display:flex; align-items:center; gap:8px;">
            <span style="width:10px; height:10px; border-radius:50%; background:#EF4444;"></span>
            FINALIZADOS (${finalizados.length})
          </h3>
          <span style="font-size:11px; color:#6B7280;">Período expirado</span>
        </div>
        <div>
          ${finalizados.map(c => renderCard(c, 'encerrada')).join('') || '<div style="padding:40px; text-align:center; color:#9CA3AF; font-size:13px; border:1px dashed #D1D5DB; border-radius:8px;">Nenhum anúncio finalizado.</div>'}
        </div>
      </div>

    </div>

    <!-- MODAL DE PREVIEW E DETALHES DO ANÚNCIO -->
    <div id="modal-anuncio-detalhes" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:999; align-items:center; justify-content:center; padding:20px;">
      <div style="background:white; border-radius:16px; max-width:850px; width:100%; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,0.3); display:flex; flex-direction:column; gap:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E5E7EB; padding-bottom:16px;">
          <h2 id="mad-title" style="margin:0; font-size:20px; font-weight:700; color:#111827;">Detalhes do Anúncio</h2>
          <button onclick="document.getElementById('modal-anuncio-detalhes').style.display='none'" style="background:none; border:none; font-size:24px; cursor:pointer; color:#6B7280;">✕</button>
        </div>

        <div style="display:grid; grid-template-columns:300px 1fr; gap:24px;">
          <!-- Preview do Totem -->
          <div style="background:#1A1A2E; border-radius:12px; padding:16px; display:flex; flex-direction:column; align-items:center; text-align:center; color:white;">
            <div style="font-size:11px; font-weight:700; color:#2D9B5A; margin-bottom:8px; text-transform:uppercase;">FRAME PREVIEW TOTEM</div>
            <div id="mad-media-box" style="width:100%; height:380px; background:#000; border-radius:8px; overflow:hidden; display:flex; align-items:center; justify-content:center;">
            </div>
          </div>

          <!-- Metadados e Ações -->
          <div style="display:flex; flex-direction:column; gap:14px;">
            <div style="background:#F9FAFB; padding:14px; border-radius:8px; border:1px solid #E5E7EB;">
              <div style="font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase;">Cliente / Anunciante</div>
              <div id="mad-client" style="font-size:16px; font-weight:700; color:#111827; margin-top:2px;">—</div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div style="background:#EFF6FF; padding:12px; border-radius:8px; border:1px solid #BFDBFE;">
                <div style="font-size:11px; font-weight:700; color:#1E40AF; text-transform:uppercase;">Exibições Real-Time</div>
                <div id="mad-exib" style="font-size:20px; font-weight:800; color:#1D4ED8; margin-top:2px;">⚡ 0</div>
              </div>
              <div style="background:#ECFDF5; padding:12px; border-radius:8px; border:1px solid #A7F3D0;">
                <div style="font-size:11px; font-weight:700; color:#065F46; text-transform:uppercase;">Projeção Estimada (Fim)</div>
                <div id="mad-proj" style="font-size:20px; font-weight:800; color:#059669; margin-top:2px;">🎯 0</div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div style="background:#F9FAFB; padding:12px; border-radius:8px; border:1px solid #E5E7EB;">
                <div style="font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase;">Período Programado</div>
                <div id="mad-period" style="font-size:13px; font-weight:600; color:#111827; margin-top:2px;">—</div>
              </div>
              <div style="background:#F9FAFB; padding:12px; border-radius:8px; border:1px solid #E5E7EB;">
                <div style="font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase;">Valor do Anúncio</div>
                <div id="mad-val" style="font-size:14px; font-weight:700; color:#059669; margin-top:2px;">—</div>
              </div>
            </div>

            <div style="background:#F9FAFB; padding:12px; border-radius:8px; border:1px solid #E5E7EB;">
              <div style="font-size:11px; font-weight:700; color:#6B7280; text-transform:uppercase;">Totens Direcionados</div>
              <div id="mad-totens" style="font-size:13px; font-weight:600; color:#111827; margin-top:2px;">—</div>
            </div>

            <div id="mad-action-area" style="margin-top:auto; padding-top:12px; border-top:1px solid #E5E7EB; display:flex; justify-content:flex-end;">
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

Pages.dragAnuncio = function(e, id) {
  Pages.anunciosDragId = id;
  e.dataTransfer.setData('text/plain', id);
};

Pages.dropAnuncio = async function(e, targetStatus) {
  e.preventDefault();
  const id = Pages.anunciosDragId;
  if (id) {
    await Pages.alterarStatusAnuncio(id, targetStatus);
  }
};

Pages.alterarStatusAnuncio = async function(id, targetStatus) {
  try {
    await window.AppData.updateCampanha(id, { status: targetStatus });
    delete window._appDataCache['campanhas'];
    await Pages.anuncios();
  } catch (err) {
    console.error('Erro ao alterar status:', err);
    alert('Erro ao atualizar status do anúncio: ' + (err.message || JSON.stringify(err)));
  }
};

Pages.renovarCampanha = async function(id) {
  const campanhas = await window.AppData.getCampanhas();
  const c = campanhas.find(x => x.id === id || x.id == id);
  if (c) {
    window._editCampanhaId = c.id;
    window._editCampanhaData = c;
    window.Router.navigate('nova-campanha');
  }
};

Pages.abrirDetalhesAnuncioModal = async function(id) {
  const campanhas = await window.AppData.getCampanhas();
  const c = campanhas.find(x => x.id === id || x.id == id);
  if (!c) return;

  const totensList = window.AppData.getTotens ? await window.AppData.getTotens() : [];
  const estTotal = window.AppData.calcularEstimativaExibicoes ? window.AppData.calcularEstimativaExibicoes(c, campanhas, totensList.length || 6) : 1000;
  const cliente = c.descricao ? c.descricao.split('|')[0].replace('Cliente:', '').trim() : 'Prefeitura / Geral';
  const alvo = c.totens_alvo || {};
  const mediaUrl = alvo.arquivo_url || null;
  const isVideo = mediaUrl && (mediaUrl.indexOf('video') > -1 || mediaUrl.endsWith('.mp4') || mediaUrl.startsWith('data:video/'));

  document.getElementById('mad-title').textContent = c.nome;
  document.getElementById('mad-client').textContent = cliente;
  document.getElementById('mad-exib').textContent = '⚡ ' + (c.exibicoes || 0).toLocaleString('pt-BR');
  document.getElementById('mad-proj').textContent = '🎯 ' + estTotal.toLocaleString('pt-BR');
  document.getElementById('mad-period').textContent = c.periodo || (alvo.data_inicio ? `${alvo.data_inicio} até ${alvo.data_fim}` : 'Não definido');
  document.getElementById('mad-val').textContent = 'R$ ' + (c.investimento || 1500).toLocaleString('pt-BR', {minimumFractionDigits:2});
  document.getElementById('mad-totens').textContent = (alvo.tipo === 'individual' && Array.isArray(alvo.ids)) ? `${alvo.ids.length} Toten(s) Selecionado(s)` : 'Todos os Totens da Cidade';

  const mediaBox = document.getElementById('mad-media-box');
  if (mediaUrl) {
    if (isVideo) {
      mediaBox.innerHTML = `<video src="${mediaUrl}" autoplay loop muted style="width:100%; height:100%; object-fit:cover;"></video>`;
    } else {
      mediaBox.innerHTML = `<div style="width:100%; height:100%; background-image:url(${mediaUrl}); background-size:cover; background-position:center;"></div>`;
    }
  } else {
    mediaBox.innerHTML = `
      <div style="color:white; text-align:center; padding:20px;">
        <div style="font-size:48px;">📢</div>
        <div style="font-size:16px; font-weight:700; margin-top:8px;">${c.nome}</div>
      </div>
    `;
  }

  const actionArea = document.getElementById('mad-action-area');
  if (c.status === 'ativa') {
    actionArea.innerHTML = `<button class="btn btn-secondary" style="background:#FEF3C7; color:#D97706; border-color:#FDE68A; cursor:pointer;" onclick="window.Pages.alterarStatusAnuncio(${c.id}, 'pausada'); document.getElementById('modal-anuncio-detalhes').style.display='none';">⏸️ Pausar Anúncio</button>`;
  } else if (c.status === 'pausada') {
    actionArea.innerHTML = `<button class="btn btn-primary" style="background:#10B981; border:none; cursor:pointer; color:white;" onclick="window.Pages.alterarStatusAnuncio(${c.id}, 'ativa'); document.getElementById('modal-anuncio-detalhes').style.display='none';">▶️ Play (Ativar Anúncio)</button>`;
  } else {
    actionArea.innerHTML = `<button class="btn btn-primary" style="background:#3B82F6; border:none; cursor:pointer; color:white;" onclick="window.Pages.renovarCampanha(${c.id})">🔄 Renovar Campanha</button>`;
  }

  document.getElementById('modal-anuncio-detalhes').style.display = 'flex';
};
