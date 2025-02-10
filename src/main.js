const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
let childProcesses = [];

console.log("yo: ");

const pjson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const platforms = pjson.platforms || [];

function createCoversDirectories(platforms) {
  // Get the base path for covers using Electron's app.getPath('userData')
  const baseCoversPath = path.join(app.getPath('userData'), 'covers');

  // Create the base covers directory if it doesn't exist.
  if (!fs.existsSync(baseCoversPath)) {
    fs.mkdirSync(baseCoversPath, { recursive: true });
    console.log(`Created base covers directory: ${baseCoversPath}`);
  }

  // For each platform, create its directory if it doesn't exist.
  platforms.forEach(platform => {
    const platformDir = path.join(baseCoversPath, platform);
    if (!fs.existsSync(platformDir)) {
      fs.mkdirSync(platformDir, { recursive: true });
      console.log(`Created directory for platform '${platform}': ${platformDir}`);
    } else {
      console.log(`Directory for platform '${platform}' already exists: ${platformDir}`);
    }
  });
}

createCoversDirectories(platforms);

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
