const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let configData = {};

function loadConfig() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'config.json'));
    configData = JSON.parse(raw);
  } catch (err) {
    console.error("Falha ao carregar config.json", err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 1920,
    kiosk: configData.fullscreen === true,
    fullscreen: configData.fullscreen === true,
    alwaysOnTop: configData.fullscreen === true,
    frame: !configData.fullscreen,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile('index.html');

  // Impede que o usuário feche a janela facilmente no modo Kiosk
  mainWindow.on('close', (e) => {
    if (configData.modo === 'kiosk') {
      e.preventDefault();
    }
  });
}

app.whenReady().then(() => {
  loadConfig();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  // Watchdog & Telemetria Mock (Simulação)
  setInterval(() => {
    const telemetry = {
      totemId: configData.totemId,
      cpu: Math.round(Math.random() * 20 + 10),
      ram: Math.round((os.totalmem() - os.freemem()) / os.totalmem() * 100),
      temperatura: Math.round(Math.random() * 15 + 40),
      internet: true,
      gps: true,
      versao: "2.1.4"
    };
    console.log(`[Watchdog] Enviando telemetria para a central:`, telemetry);
    // Aqui no futuro será feito o POST para a API central (ex: axios.post(configData.api + '/telemetry', telemetry))
  }, 30000);
});

// IPC Handler para o Frontend pegar as configs
ipcMain.handle('get-config', () => {
  return configData;
});
