const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { exec } = require('child_process');
let childProcesses = [];

const store = new Store();

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Enable Node.js integration
      contextIsolation: false, // Disable context isolation
    },
  });

  win.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openFile'] });
  return result.filePaths[0];
});

ipcMain.handle('save-preferences', (event, platform, preferences) => {
  store.set(platform, preferences);
  return true;
});

ipcMain.handle('load-preferences', (event, platform) => {
  return store.get(platform, { gamesDir: '', emulator: '' });
});

// Register the handler for 'get-main-data'
ipcMain.handle('get-main-data', () => {
  return {
    userDataPath: app.getPath('userData')
  };
});


// Handle the command execution sent from the renderer process (gallery.js)
ipcMain.on('run-command', (event, command) => {
    const child = exec(command, (err, stdout, stderr) => {
        if (err) {
            console.error('Error executing command:', err);
        }
    });
    childProcesses.push(child);

    // Optionally remove the child when it exits
    child.on('exit', () => {
        childProcesses = childProcesses.filter(cp => cp !== child);
    });
});
