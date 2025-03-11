import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { getAllCoverImageUrls } from './steamgrid.js';
import axios from 'axios';  // Import axios using ESM
import { fileURLToPath } from "url";

let childProcesses = [];

let mainWindow;

const preferencesFilePath = path.join(app.getPath('userData'), "preferences.json");

function loadPreferences() {
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

// Utility function to ensure the directory exists
const createDirectoryIfNeeded = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// The function to download and save the image
const downloadAndSaveImage = async (imgSrc, platform, gameName) => {
    const saveDir = path.join(app.getPath('userData'), 'covers', platform);  // Store images in userData/covers/platform
    const savePath = path.join(saveDir, `${gameName}.jpg`);
    createDirectoryIfNeeded(saveDir);  // Ensure the directory exists

    try {
        const response = await axios({
            url: imgSrc,
            method: 'GET',
            responseType: 'stream',  // Handle the image as a stream
        });

        const writer = fs.createWriteStream(savePath);  // Create a writable stream

        response.data.pipe(writer);  // Pipe the image data into the file

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(savePath));  // Resolve when writing is complete
            writer.on('error', (error) => reject(error));  // Reject if there's an error
        });
    } catch (error) {
        console.error("Error downloading image: ", error);
        throw error;  // Propagate error to be handled
    }
};

function createWindows() {
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

ipcMain.handle('download-image', async (event, imgSrc, platform, gameName) => {
    try {
        const savedImagePath = await downloadAndSaveImage(imgSrc, platform, gameName);
        return { success: true, path: savedImagePath };  // Send the saved path back to the renderer
    } catch (error) {
        return { success: false, error: error.message };  // Send error message if download fails
    }
});

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

ipcMain.on('fetch-images', (event, gameName) => {
    getAllCoverImageUrls(gameName)
        .then((urls) => {
            event.reply('image-urls', urls); // Send the URLs back to the renderer process
        })
        .catch((err) => {
            console.error('Failed to fetch image URLs:', err);
            event.reply('image-urls', []); // Send an empty array in case of error
        });
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
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/amiga",
        "emulator": "amiberry",
        "emulatorArgs": "",
        "extensions": [""]
    },
    "amiga": {
        "isEnabled": false,
        "gamesDir": "",
        "emulator": "amiberry",
        "emulatorArgs": "",
        "extensions": [".lha", ".adf"]
    },
    "snes": {
        "isEnabled": false,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/snes",
        "emulator": "Mesen",
        "emulatorArgs": "--fullscreen",
        "extensions": [".smc"]
    },
    "pcengine": {
        "isEnabled": false,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/pcengine",
        "emulator": "mednafen",
        "emulatorArgs": "",
        "extensions": [".pce"]
    },
    "dreamcast": {
        "isEnabled": false,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/dreamcast",
        "emulator": "flycast-x86_64.AppImage",
        "emulatorArgs": "",
        "extensions": [".gdi", ".cdi"]
    },
    "gamecube": {
        "isEnabled": false,
        "gamesDir": "",
        "emulator": "darker",
        "emulatorArgs": "",
        "extensions": [".iso", ".ciso"]
    },
    "n64": {
        "isEnabled": false,
        "gamesDir": "",
        "emulator": "",
        "emulatorArgs": "",
        "extensions": [".z64"]
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
