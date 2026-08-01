window.Pages = window.Pages || {};
window.Pages.configuracoes = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;

  const configuracoes = await AppData.getConfiguracoes();

  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Configurações Globais</h1>
        <p>Ajustes do sistema e preferências padrão</p>
      </div>
      <div class="page-actions">
        <button class="btn btn-primary" onclick="alert('Configurações salvas!')">
          ${window.Components.icon ? window.Components.icon('save', 16) : ''} Salvar Alterações
        </button>
      </div>
    </div>
    
    <div class="grid-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div class="card">
        <div class="card-header"><h3 style="margin:0;">Informações do Sistema</h3></div>
        <div class="card-body">
          <div style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:bold;">Nome da Empresa/Órgão</label>
            <input type="text" class="form-input" value="Prefeitura Municipal da Serra" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
          </div>
          <div style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:bold;">Fuso Horário Padrão</label>
            <select class="form-select" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
              <option selected>América/Sao_Paulo (GMT-3)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 style="margin:0;">Configurações de Totens</h3></div>
        <div class="card-body">
          <div style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:bold;">Intervalo de Sincronização (segundos)</label>
            <input type="number" class="form-input" value="60" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
          </div>
          <div style="margin-bottom:15px;">
            <label style="display:block; margin-bottom:5px; font-weight:bold;">Tema Padrão da Interface UI</label>
            <select class="form-select" style="width:100%; padding:10px; border:1px solid #ccc; border-radius:4px;">
              <option selected>Claro (Light Mode)</option>
              <option>Escuro (Dark Mode)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 style="margin:0;">Notificações e Alertas</h3></div>
        <div class="card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #eee;">
            <div>
              <strong>Alertas de Totem Offline</strong>
              <div style="color:#666; font-size:0.85em;">Enviar e-mail para administradores quando um totem cair.</div>
            </div>
            <div style="background:#10b981; width:40px; height:20px; border-radius:10px; position:relative; cursor:pointer;">
              <div style="background:#fff; width:16px; height:16px; border-radius:50%; position:absolute; top:2px; right:2px;"></div>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>Backup Automático Diário</strong>
              <div style="color:#666; font-size:0.85em;">Realizar dump do banco de dados às 03:00 da manhã.</div>
            </div>
            <div style="background:#10b981; width:40px; height:20px; border-radius:10px; position:relative; cursor:pointer;">
              <div style="background:#fff; width:16px; height:16px; border-radius:50%; position:absolute; top:2px; right:2px;"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  main.innerHTML = html;
};
