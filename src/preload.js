const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onPopulateMenu: (callback) => ipcRenderer.on('populate-menu', callback),
  onPopulateGames: (callback) => ipcRenderer.on('populate-games', callback),
  onPopulateSettings: (callback) => ipcRenderer.on('populate-settings', callback),
  onEnableNavigation: (callback) => ipcRenderer.on('enable-navigation', callback),
  navigateTo: (page) => ipcRenderer.send('navigate-to', page),
  sendPageReady: () => ipcRenderer.send('page-ready'),
});
