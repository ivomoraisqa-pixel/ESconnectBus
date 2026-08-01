window.Pages = window.Pages || {};
window.Pages.horarios = async function() {
  const main = document.getElementById('main-content');
  if (!main) return;
  
  // Fetch totens for the dropdown
  const totens = window.AppData ? (await window.AppData.getTotens() || []) : [];
  
  const options = totens.map(t => `<option value="${t.id}">${t.nome || t.name}</option>`).join('');
  
  let html = `
    <div class="page-header">
      <div class="page-title">
        <h1>Horários e Tempo Real</h1>
        <p>Previsões e chegadas em tempo real por Ponto de Parada</p>
      </div>
    </div>
    
    <div class="card" style="margin-bottom: 24px;">
      <div class="card-body" style="display:flex; gap:16px; align-items:flex-end;">
        <div style="flex:1;">
          <label class="form-label" style="display:block; margin-bottom:8px; font-weight:600; color:#1A1A2E;">Buscar Ponto de Parada (Totem)</label>
          <select id="horarios-ponto-select" class="form-input" style="width:100%; padding:10px; border:1px solid #D1D5DB; border-radius:8px; background:#fff;">
            <option value="">Selecione um ponto ou totem...</option>
            ${options}
          </select>
        </div>
        <button class="btn btn-primary" onclick="window.Pages.loadHorarios()">Buscar Horários</button>
      </div>
    </div>
    
    <div id="horarios-resultados" style="display:none;">
      <div class="card" style="margin-bottom: 20px;">
        <div class="card-header">
          <h3 style="margin:0; display:flex; align-items:center; gap:10px;">
            Painel de Chegadas em Tempo Real
            <span class="status-dot" style="width:10px; height:10px; background:#10B981; border-radius:50%; display:inline-block; animation: pulse 2s infinite;"></span>
          </h3>
        </div>
        <div class="card-body">
          <div class="grid-3" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
              <div style="font-size:1.2em; font-weight:bold; color:#0F172A; margin-bottom:12px;">503 - T. Laranjeiras</div>
              <div>
                <div style="color:#64748b; font-size:0.9em;">Previsão:</div>
                <div style="font-size:2em; font-weight:bold; color:#10B981;">05 min</div>
              </div>
            </div>
            <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
              <div style="font-size:1.2em; font-weight:bold; color:#0F172A; margin-bottom:12px;">800 - T. Jacaraípe</div>
              <div>
                <div style="color:#64748b; font-size:0.9em;">Previsão:</div>
                <div style="font-size:2em; font-weight:bold; color:#F59E0B;">12 min</div>
              </div>
            </div>
            <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
              <div style="font-size:1.2em; font-weight:bold; color:#0F172A; margin-bottom:12px;">591 - Serra Sede</div>
              <div>
                <div style="color:#64748b; font-size:0.9em;">Previsão:</div>
                <div style="font-size:2em; font-weight:bold; color:#EF4444;">Atrasado</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 style="margin:0;">Horários Programados</h3>
        </div>
        <div class="card-body" style="padding:0;">
          <table class="data-table" style="width: 100%; text-align: left; border-collapse: collapse;">
            <thead>
              <tr style="background:#F9FAFB; border-bottom:2px solid #E5E7EB;">
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Linha</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Destino</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Próximas Partidas</th>
                <th style="padding:12px 16px; font-weight:600; color:#6B7280; font-size:12px; text-transform:uppercase;">Status da Operação</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 16px;"><strong>503</strong></td>
                <td style="padding: 12px 16px;">Terminal Laranjeiras</td>
                <td style="padding: 12px 16px;">14:30, 14:45, 15:00</td>
                <td style="padding: 12px 16px;"><span style="color:#10B981; font-weight:600; background:#D1FAE5; padding:4px 8px; border-radius:4px; font-size:12px;">No Horário</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 16px;"><strong>800</strong></td>
                <td style="padding: 12px 16px;">Terminal Jacaraípe</td>
                <td style="padding: 12px 16px;">14:40, 15:00, 15:20</td>
                <td style="padding: 12px 16px;"><span style="color:#F59E0B; font-weight:600; background:#FEF3C7; padding:4px 8px; border-radius:4px; font-size:12px;">Atraso Leve</span></td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px 16px;"><strong>591</strong></td>
                <td style="padding: 12px 16px;">Serra Sede</td>
                <td style="padding: 12px 16px;">15:10, 15:40, 16:10</td>
                <td style="padding: 12px 16px;"><span style="color:#EF4444; font-weight:600; background:#FEE2E2; padding:4px 8px; border-radius:4px; font-size:12px;">Atrasado</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
    </style>
  `;

  main.innerHTML = html;
};

window.Pages.loadHorarios = function() {
  const select = document.getElementById('horarios-ponto-select');
  if(!select || !select.value) {
    alert("Por favor, selecione um ponto de parada.");
    return;
  }
  document.getElementById('horarios-resultados').style.display = 'block';
};
