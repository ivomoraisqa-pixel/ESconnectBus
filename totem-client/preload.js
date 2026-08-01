const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('totemAPI', {
  getConfig: () => ipcRenderer.invoke('get-config')
});
