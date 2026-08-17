window.Router = {
  routes: {},
  currentPage: null,
  
  register(hash, config) {
    this.routes[hash] = config;
  },
  
  navigate(hash) {
    window.location.hash = hash;
  },
  
  clearPageIntervals() {
    if (window.Pages) {
      if (window.Pages.relatoriosInterval) { clearInterval(window.Pages.relatoriosInterval); window.Pages.relatoriosInterval = null; }
      if (window.Pages.campanhasInterval) { clearInterval(window.Pages.campanhasInterval); window.Pages.campanhasInterval = null; }
    }
    if (window._nocInterval) { clearInterval(window._nocInterval); window._nocInterval = null; }
    if (window._simInterval) { clearInterval(window._simInterval); window._simInterval = null; }
    if (window._simCarouselInterval) { clearInterval(window._simCarouselInterval); window._simCarouselInterval = null; }
    if (window.previewInterval) { clearInterval(window.previewInterval); window.previewInterval = null; }
  },

  async handleRoute() {
    this.clearPageIntervals();
    const hash = window.location.hash.slice(1) || 'dashboard';
    const route = this.routes[hash];
    
    if (route) {
      document.getElementById('page-title').textContent = route.title;
      document.getElementById('page-subtitle').textContent = route.subtitle;
      
      document.querySelectorAll('.sidebar-item').forEach(item => {
        if(item.dataset && item.dataset.page) {
          item.classList.toggle('active', item.dataset.page === hash);
        }
      });
      
      const headerActions = document.getElementById('header-actions');
      if (headerActions) {
        headerActions.innerHTML = route.headerActions || '';
      }
      
      const main = document.getElementById('main-content');
      const loader = document.getElementById('global-loader');
      
      if (main) {
        main.style.opacity = 0;
        if (loader) loader.style.display = 'flex';
        
        try {
          if (route.render) {
            // Suporta functions normais e promises
            await route.render();
          }
        } catch(e) {
          console.error("Error rendering route", e);
          main.innerHTML = `<div class="card"><div class="card-body"><h3 style="color:red;">Erro ao carregar os dados</h3><pre style="background:#f4f4f4; padding:10px; margin-top:10px; overflow-x:auto;">${e.stack || e.message || e}</pre></div></div>`;
        } finally {
          if (loader) loader.style.display = 'none';
          main.style.opacity = 1;
        }
      }
      
      this.currentPage = hash;
    }
  },
  
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }
};
