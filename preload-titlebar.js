const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('siab', {
  minimizar: () => ipcRenderer.send('janela', 'min'),
  maximizar: () => ipcRenderer.send('janela', 'max'),
  sair: () => ipcRenderer.send('janela', 'close')
});
