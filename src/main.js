const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
let childProcesses = [];
const pjson = require('../package.json');


const platforms = pjson.platforms || [];

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
            nodeIntegration: true,
            contextIsolation: false,
        },
        fullscreen: isFullScreen,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
            'AppleWebKit/537.36 (KHTML, like Gecko) ' +
            'Chrome/115.0.0.0 Safari/537.36'
    });

    ipcMain.on('change-window-title', (event, newTitle) => {
        if (win) {
            win.setTitle(newTitle);
        }
    });

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

ipcMain.handle('show-quit-dialog', async () => {
    let action;
    const result = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Yes', 'Donate', 'Cancel'],
        message: 'Really Exit EmumE?',
        icon: './img/emume-logo.png'
    }).then(result => {
        if (result.response === 0) {
            action = "yes";
        } else if (result.response === 1) {
            shell.openExternal('https://yphil.gitlab.io/ext/support.html');
        } else if (result.response === 2) {
            action= "cancel";
            console.log("plop? ");
        }

    });

    return action;
});

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.filePaths[0];
});

ipcMain.handle('select-file', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'] });
    return result.filePaths[0];
});

ipcMain.handle('get-user-data', () => {
    return {
        userDataPath: app.getPath('userData')
    };
});

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
