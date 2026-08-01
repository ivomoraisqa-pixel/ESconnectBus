window.Pages = window.Pages || {};

Pages.simulador = async function() {
  const main = document.getElementById('main-content');
  if(!main) return;
  
  main.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:20px; height:100%;">
      <div class="card" style="background:white; border-radius:12px; padding:20px; display:flex; align-items:center; gap:20px; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-weight:600; font-size:16px;">Selecione o Ponto para Simular:</div>
        <select class="form-input form-select" style="flex:1; max-width:400px; padding:10px 12px; border:1px solid #D1D5DB; border-radius:6px;" onchange="Pages.renderSimuladorTotem(this.value)">
          <option value="">Selecione...</option>
          <option value="carone-mall">Terminal Laranjeiras (Carone Mall)</option>
          <option value="pracinha-sao-diogo">Pracinha de São Diogo</option>
          <option value="hospital-ds">Hospital Dório Silva</option>
        </select>
        <button class="btn btn-primary" onclick="Pages.renderSimuladorTotem(document.querySelector('.form-select').value)">
          Iniciar Simulador
        </button>
      </div>

      <div id="simulador-container" style="flex:1; background:#F9FAFB; border-radius:12px; display:flex; justify-content:center; align-items:center; overflow:hidden; padding:40px; box-shadow:inset 0 2px 10px rgba(0,0,0,0.05); min-height: 800px;">
        <div style="text-align:center; color:#9CA3AF;">
          ${window.Components ? window.Components.icon('monitor', 64) : '🖥️'}
          <div style="margin-top:16px; font-size:16px;">Selecione um ponto acima para iniciar o simulador 1:1 do totem físico.</div>
        </div>
      </div>
    </div>
  `;
};

Pages.renderSimuladorTotem = function(pontoId) {
  if(!pontoId) return;
  const container = document.getElementById('simulador-container');
  if(!container) return;

  const nomes = {
    'carone-mall': 'CARONE MALL',
    'pracinha-sao-diogo': 'PRAÇA DE SÃO DIOGO',
    'hospital-ds': 'HOSPITAL DÓRIO SILVA'
  };
  const nome = nomes[pontoId] || 'PONTO DESCONHECIDO';

  container.innerHTML = `
    <!-- Frame do Totem Físico -->
    <div style="width:1080px; height:1920px; transform:scale(0.35); transform-origin:center top; background:#1A1A2E; overflow:hidden; font-family:'Inter', sans-serif; color:white; border:32px solid #111; border-radius:72px; box-sizing:border-box; display:flex; flex-direction:column; box-shadow: 0 40px 100px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.5);">
      
      <!-- Topo -->
      <div style="display:flex; justify-content:space-between; padding:32px 40px; background:#1A1A2E;">
        <div>
          <div style="font-weight:700; font-size:48px;">SERRA</div>
          <div style="font-size:32px; color:#A3B8B0;">${nome}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-weight:700; font-size:64px;" id="sim-clock">14:30</div>
          <div style="font-size:28px; color:#A3B8B0;">23 de Maio, 2025</div>
        </div>
      </div>

      <!-- Corpo -->
      <div style="flex:1; background:white; display:flex; flex-direction:column; position:relative;">
        <div style="background:#2D9B5A; padding:24px 40px; font-weight:700; font-size:36px; color:white; display:flex; justify-content:space-between;">
          <span>PRÓXIMOS ÔNIBUS</span>
          <span>TEMPO REAL</span>
        </div>
        
        <div style="background:white; color:#1A1A2E; flex:1;">
          <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
            <span style="background:#2D9B5A; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">523</span>
            <span style="flex:1; font-size:42px; font-weight:600;">TERMINAL LARANJEIRAS</span>
            <span style="font-weight:700; font-size:48px;">2 min</span>
          </div>
          <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
            <span style="background:#3B82F6; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">507</span>
            <span style="flex:1; font-size:42px; font-weight:600;">CENTRO / VITÓRIA</span>
            <span style="font-weight:700; font-size:48px;">5 min</span>
          </div>
          <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
            <span style="background:#8B5CF6; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">814</span>
            <span style="flex:1; font-size:42px; font-weight:600;">JACARAÍPE</span>
            <span style="font-weight:700; font-size:48px;">11 min</span>
          </div>
          <div style="display:flex; align-items:center; padding:32px 40px; border-bottom:2px solid #eee; gap:32px;">
            <span style="background:#F97316; color:white; padding:16px 24px; border-radius:12px; font-weight:700; font-size:42px; min-width:140px; text-align:center;">850</span>
            <span style="flex:1; font-size:42px; font-weight:600;">SERRA DOURADA</span>
            <span style="font-weight:700; font-size:48px;">18 min</span>
          </div>
        </div>
        
        <!-- Area de Publicidade / Rotativo -->
        <div style="height:700px; background:#000; position:relative; overflow:hidden;">
          <div id="sim-ad-layer" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, #1E3A8A, #3B82F6); color:white; flex-direction:column;">
            <div style="font-size:100px; margin-bottom:40px;">💧</div>
            <div style="font-size:72px; font-weight:800; margin-bottom:20px; text-align:center;">BEBA MAIS ÁGUA</div>
            <div style="font-size:40px; font-weight:500;">Prefeitura da Serra</div>
          </div>
        </div>

        <!-- Alerta Informativo Emergencial -->
        <div style="position:absolute; bottom:700px; left:0; right:0; background:#F59E0B; color:#000; padding:30px 40px; font-size:36px; font-weight:600; display:flex; align-items:center; gap:20px; box-shadow:0 -10px 30px rgba(0,0,0,0.1);">
          <span style="font-size:48px;">🚧</span> OBRAS NA VIA: Atrasos pontuais previstos na linha 507.
        </div>
      </div>

      <!-- Rodapé -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:32px 40px; background:#1A1A2E; border-top:2px solid #333;">
        <div style="font-size:32px;"><strong style="color:white;">SerraBus</strong> <span style="color:#2D9B5A; font-weight:300;">CONECT</span></div>
        <div style="font-size:32px; color:#A3B8B0;">📶 Wi-Fi Grátis</div>
      </div>
    </div>
  `;
};
