const fs = require('fs');

global.window = {};
global.Pages = {};
global.window.Pages = global.Pages;

global.document = {
  getElementById: (id) => ({ innerHTML: '', style: {} }),
  querySelectorAll: () => [],
};
window.AppData = {
  getDashboardStats: async () => ({}),
  getTotens: async () => [{nome: 'T1', localizacao: 'L1', status: 'online', ultimaConexao: '1', versao: 'v1'}],
  getAtualizacoes: async () => [{tipo: 'linha', titulo: 'A', descricao: 'B'}],
  getCampanhas: async () => [{id: 1, nome: 'C', totens: 1, exibicoes: 1, ctr: 1}],
};
window.Charts = {
  donut: () => {}
};

// Load components
const componentsCode = fs.readFileSync('d:\\ESconnectBus\\js\\components.js', 'utf8');
eval(componentsCode);
global.Components = window.Components;

// Load dashboard
const dashboardCode = fs.readFileSync('d:\\ESconnectBus\\js\\pages\\dashboard.js', 'utf8');
eval(dashboardCode);

async function run() {
  try {
    const main = { innerHTML: '', style: {} };
    global.document.getElementById = (id) => {
      if (id === 'main-content') return main;
      return { innerHTML: '', style: {} };
    };
    await window.Pages.dashboard();
    console.log("SUCCESS");
  } catch (e) {
    console.log("ERROR:");
    console.error(e);
  }
}
run();
