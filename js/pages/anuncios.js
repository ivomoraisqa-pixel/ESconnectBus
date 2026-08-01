window.Pages = window.Pages || {};
window.Pages.anuncios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const anuncios = window.AppData ? await window.AppData.getAnuncios() : [
    {id:1, nome:'Campanha Verão', tipo:'imagem', status:'ativo', exibições:'12k'},
    {id:2, nome:'Prefeitura Digital', tipo:'video', status:'ativo', exibições:'34k'},
    {id:3, nome:'Guia de Turismo', tipo:'imagem', status:'pausado', exibições:'5k'}
  ];

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Anúncios</h1>
        <p>Gestão de mídia e campanhas publicitárias</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="window.uploadAnuncio()">
          ${window.Components.icon ? window.Components.icon('upload', 16) : ''} Novo Anúncio
        </button>
      </div>
    </div>
    
    <div class="kpi-row grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 20px;">
      ${window.Components.kpiCard ? window.Components.kpiCard('Total Anúncios', 36, 'image', 'gray') : '<div class="kpi-card">Total: 36</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Ativos', 24, 'play', 'green') : '<div class="kpi-card">Ativos: 24</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Imagens', 12, 'image', 'blue') : '<div class="kpi-card">Imagens: 12</div>'}
      ${window.Components.kpiCard ? window.Components.kpiCard('Vídeos', 8, 'film', 'purple') : '<div class="kpi-card">Vídeos: 8</div>'}
    </div>

    <div class="tabs" style="display:flex; border-bottom:1px solid #e2e8f0; margin-bottom:20px; gap:20px;">
      <div class="tab-item active" style="padding:10px 15px; border-bottom:2px solid #3b82f6; color:#3b82f6; cursor:pointer; font-weight:bold;">Todos</div>
      <div class="tab-item" style="padding:10px 15px; color:#64748b; cursor:pointer;">Imagens</div>
      <div class="tab-item" style="padding:10px 15px; color:#64748b; cursor:pointer;">Vídeos</div>
      <div class="tab-item" style="padding:10px 15px; color:#64748b; cursor:pointer;">HTML/Interativo</div>
    </div>

    <div class="grid-4" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;">
      ${anuncios.map(a => `
        <div class="card" style="overflow:hidden;">
          <div style="height:150px; background:#e2e8f0; display:flex; align-items:center; justify-content:center;">
             ${window.Components.icon ? window.Components.icon(a.tipo === 'video' ? 'play-circle' : 'image', 48) : a.tipo}
          </div>
          <div class="card-body" style="padding:15px;">
            <h4 style="margin:0 0 5px 0;">${a.nome}</h4>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
              ${window.Components.badge ? window.Components.badge(a.status) : a.status}
              <small style="color:#64748b;">${a.exibições} exibições</small>
            </div>
          </div>
          <div class="card-footer" style="padding:10px 15px; background:#f8fafc; border-top:1px solid #f1f5f9; display:flex; justify-content:space-between;">
             <button class="btn-icon" title="Editar">${window.Components.icon ? window.Components.icon('edit', 16) : 'Edit'}</button>
             <button class="btn-icon" title="Excluir" style="color:#ef4444;">${window.Components.icon ? window.Components.icon('trash', 16) : 'Del'}</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  main.innerHTML = html;

  window.uploadAnuncio = function() {
    alert('Abrir modal de upload de arquivo/anúncio');
  };
};
