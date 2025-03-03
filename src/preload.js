const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onPopulateMenu: (callback) => ipcRenderer.on('populate-menu', callback),
    onPopulateGames: (callback) => ipcRenderer.on('populate-games', callback),
    onPopulateSettings: (callback) => ipcRenderer.on('populate-settings', callback),
    navigateTo: (page) => ipcRenderer.send('navigate-to', page),
    getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
});
