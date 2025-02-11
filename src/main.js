const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
let childProcesses = [];
const pjson = require('../package.json');

const platforms = [
    "amiga",
    "pcengine",
    "dreamcast",
    "gamecube"
];

function showHelp() {
    console.log(`
Usage: ${pjson.name.toLowerCase()} [options]

Options:
  --fullscreen  Start the app in full screen mode.
  --help        Show this help message.
  --version     Displays the version number / tag.
    `);
    app.quit();
}

const isFullScreen = process.argv.includes('--fullscreen');

if (process.argv.includes('--help')) {
    showHelp();
}

if (process.argv.includes('--version')) {
    console.log(`${pjson.version}`);
    app.quit();
}

function createCoversDirectories(platforms) {
    // Get the base path for covers using Electron's app.getPath('userData')
    const baseCoversPath = path.join(app.getPath('userData'), 'covers');

    // Create the base covers directory if it doesn't exist.
    if (!fs.existsSync(baseCoversPath)) {
        fs.mkdirSync(baseCoversPath, { recursive: true });
    }

    // For each platform, create its directory if it doesn't exist.
    platforms.forEach(platform => {
        const platformDir = path.join(baseCoversPath, platform);
        if (!fs.existsSync(platformDir)) {
            fs.mkdirSync(platformDir, { recursive: true });
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
        fullscreen: isFullScreen
    });


    // Handle the 'show-quit-dialog' event
    ipcMain.handle('show-quit-dialog', async () => {
        const result = await dialog.showMessageBox(win, {
            type: 'question',
            buttons: ['Yes', 'Cancel'],
            title: 'Confirm Quit',
            message: 'Really quit?',
            detail: 'Are you sure you want to quit the application?'
        });

        // Return 'yes' if the user clicks Yes, otherwise 'no'
        return result.response === 0 ? 'yes' : 'no';
    });

    // Handle the 'change-window-title' event
    ipcMain.on('change-window-title', (event, newTitle) => {
        if (win) {
            win.setTitle(newTitle); // Update the window title
        }
    });

        // Send platforms data to the renderer process
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('platforms-data', platforms);
    });

    win.loadFile(path.join(__dirname, '../index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit(); // MacOs is weird
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

// Register the handler for 'get-main-data'
ipcMain.handle('get-platform-names', () => {
    return platforms;
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


ipcMain.on('quit', () => {
    app.quit();
});

// Clean up all child processes before quitting
app.on('before-quit', () => {
  childProcesses.forEach(child => {
    try {
      child.kill();
    } catch (e) {
      console.error('Error killing child process:', e);
    }
  });
});
