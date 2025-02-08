const { contextBridge, ipcRenderer } = require('electron');

// Expose APIs to the renderer process
contextBridge.exposeInMainWorld('api', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectFile: () => ipcRenderer.invoke('select-file'),
    savePreferences: (platform, preferences) =>
    ipcRenderer.invoke('save-preferences', platform, preferences),
    loadPreferences: (platform) => ipcRenderer.invoke('load-preferences', platform),
    getPlatforms: (platform) => ipcRenderer.invoke('get-platforms', platform),

});
