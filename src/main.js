const { app, BrowserWindow, ipcMain, dialog } = require('electron');
let fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
let childProcesses = [];

let mainWindow;

const preferencesFilePath = path.join(app.getPath('userData'), "preferences.json");

function loadPreferences() {
    console.log("preferencesFilePath: ", preferencesFilePath);
    try {
        if (fs.existsSync(preferencesFilePath)) {
            const data = fs.readFileSync(preferencesFilePath, 'utf8');

            // Attempt to parse the JSON
            try {
                return JSON.parse(data);
            } catch (parseError) {
                console.error('Invalid JSON in preferences file:', parseError);
                return { error: 'INVALID_JSON', message: 'The preferences file contains invalid JSON. It will now be reset.' };
            }
        } else {
            return { error: 'FILE_NOT_FOUND', message: 'No preferences file found. Using default preferences.' };
        }
    } catch (error) {
        console.error('Error loading preferences:', error);
        return { error: 'UNKNOWN_ERROR', message: 'An unknown error occurred while loading preferences.' };
    }
}

function savePreferences(preferences) {
    console.log("preferences: ", preferences);
    try {
        // Convert preferences to JSON and write to the file
        const data = JSON.stringify(preferences, null, 2); // Pretty-print JSON
        fs.writeFileSync(preferencesFilePath, data, 'utf8');
        console.log('Preferences saved successfully to', preferencesFilePath);
        return 'Preferences saved successfully. to: ' + preferencesFilePath;
    } catch (error) {
        console.error('Error saving preferences:', error);
        return null;
    }
}

function createWindows() {
  // Main window (Page 1)
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
    },
  });
  mainWindow.loadFile('src/index.html');
}

ipcMain.handle('get-user-data', () => {
    return {
        path: app.getPath('userData')
    };
});

ipcMain.handle('select-file-or-directory', async (event, property) => {

    const result = await dialog.showOpenDialog({ properties: [property] });

    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('go-to-url', async (event, link) => {
    console.log("url: ", link.url);
    // shell.openExternal(link.url);
    return true;
});

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


const defaultPreferences = {
  "settings": {
    "gamesDir": "/media/px/ptidisk/retropie-mount/roms/amiga",
    "emulator": "amiberry",
    "emulatorArgs": ""
  },
  "amiga": {
    "gamesDir": "",
    "emulator": "amiberry",
    "emulatorArgs": ""
  },
  "snes": {
    "gamesDir": "/media/px/ptidisk/retropie-mount/roms/snes",
    "emulator": "Mesen",
    "emulatorArgs": "--fullscreen"
  },
  "pcengine": {
    "gamesDir": "/media/px/ptidisk/retropie-mount/roms/pcengine",
    "emulator": "mednafen",
    "emulatorArgs": ""
  },
  "dreamcast": {
    "gamesDir": "/media/px/ptidisk/retropie-mount/roms/dreamcast",
    "emulator": "flycast-x86_64.AppImage",
    "emulatorArgs": ""
  },
  "gamecube": {
    "gamesDir": "",
    "emulator": "darker",
    "emulatorArgs": ""
  },
  "n64": {
    "gamesDir": "",
    "emulator": "",
    "emulatorArgs": ""
  }
};

ipcMain.handle('load-preferences', () => {
    const preferences = loadPreferences();
    const userDataPath = app.getPath('userData');

    if (preferences.error) {

        const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'error',
            message: preferences.message,
            buttons: ['Reset', 'Quit'],
            defaultId: 0, // "Reset" is the default button
            cancelId: 1,  // "Quit" is the cancel button
        });

        if (result === 0) {

            console.log("Resetting preferences to default...");
            fs.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 2), 'utf8');

            defaultPreferences.userDataPath = userDataPath;
            return defaultPreferences;
        } else {

            console.log("Quitting the application...");
            app.quit();
            return null;
        }
    } else {

        preferences.userDataPath = userDataPath;
        return preferences;
    }
});

ipcMain.handle('save-preferences', async (event, prefs) => {
    console.log("prefs: ", prefs);
    savePreferences(prefs);
});

app.whenReady().then(createWindows);
