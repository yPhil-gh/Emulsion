import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Menu, session } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, exec } from 'child_process';
import { getAllCoverImageUrls } from './steamgrid.js';
import axios from 'axios';  // Import axios using ESM
import gamecontroller from "sdl2-gamecontroller";
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("__dirname: ", __dirname);

console.log("path.join(path.resolve(app.getAppPath()), 'src'): ", path.join(path.resolve(app.getAppPath()), 'src'));

import { readFile } from 'fs/promises';

function findProjectRoot(startDir) {
    let dir = startDir;
    while (!fs.existsSync(join(dir, 'package.json'))) {
        const parentDir = dirname(dir);
        if (parentDir === dir) return null;
        dir = parentDir;
    }
    return dir;
}

const projectRoot = findProjectRoot(__dirname);

function getExecutablePath() {
    const basePath = path.join(projectRoot, 'bin');
    return os.platform() === 'win32'
        ? path.join(basePath, 'sfo.exe')
        : path.join(basePath, 'sfo');
}

async function loadPackageJson() {
    const filePath = new URL('../../package.json', import.meta.url);
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
}

const pjson = await loadPackageJson();
const buttonStates = {
  back: false,
  dpdown: false,
};

let isProd = false;

gamecontroller.on("error", (data) => console.log("error", data));
gamecontroller.on("warning", (data) => console.log("warning", data));

gamecontroller.on("sdl-init", (data) => {
    console.log("SDL2 Initialized");
});

gamecontroller.on("controller-device-added", (data) => {
    // console.log("controller connected", data);
    gamecontroller.setLeds(0x0f, 0x62, 0xfe, data.player);
});

gamecontroller.on('controller-button-up', (event) => {
  if (event.button === 'back') {
    buttonStates.back = false;
  } else if (event.button === 'dpdown') {
    buttonStates.dpdown = false;
  }
});

// gamecontroller.on("controller-button-down", (data) => {
//     console.log("button pressed", data);
// });

const preferencesFilePath = path.join(app.getPath('userData'), "preferences.json");


function showHelp() {
    console.log(`
Usage: ${pjson.name.toLowerCase()} [options]

Options:
  --fullscreen  Start the app in full screen mode.
  --help        Show this help message.
    `);
    app.quit();
}

if (process.argv.includes('--help')) {
    showHelp();
}

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

const createDirectoryIfNeeded = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

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

let mainWindow;

function createWindows() {
  // Create the main window
  mainWindow = new BrowserWindow({
    width: 800,
      height: 600,
      fullscreen: process.argv.includes('--fullscreen'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
    mainWindow.loadFile('src/html/index.html');
}

ipcMain.on('show-context-menu', (event, params) => {
    const template = [
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
    ];
    const devToolsEntry = {
        label: 'Inspect Element',
        click: () => {
            mainWindow.inspectElement(params.x, params.y);
        },
    };
    if (!isProd) {
        template.push({ type: 'separator' });
        template.push(devToolsEntry);
    }
    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: mainWindow });
});

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
    console.log("url: ", link);
    shell.openExternal(link);
    return true;
});

ipcMain.on('fetch-images', (event, gameName, steamGridAPIKey) => {
    getAllCoverImageUrls(gameName, steamGridAPIKey)
        .then((urls) => {
            event.reply('image-urls', urls); // Send the URLs back to the renderer process
        })
        .catch((err) => {
            console.error('Failed to fetch image URLs:', err);
            event.reply('image-urls', []); // Send an empty array in case of error
        });
});

// ipcMain.on('run-command', (event, command) => {

//     const child = exec(command, (err, stdout, stderr) => {
//         if (err) {
//             console.error('Error executing command:', err);
//         }
//     });
//     childProcesses.push(child);

//     // Optionally remove the child when it exits
//     child.on('exit', () => {
//         childProcesses = childProcesses.filter(cp => cp !== child);
//     });
// });


let childProcesses = new Map();

ipcMain.on('run-command', (event, command) => {
    const child = spawn(command, {
        shell: true,
        detached: true,
        stdio: 'ignore'
    });

    childProcesses.set(child.pid, child);

    child.on('exit', () => {
        childProcesses.delete(child.pid);
    });
});

const defaultPreferences = {
    "settings": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/amiga",
        "emulator": "amiberry",
        "emulatorArgs": "-plop",
        "index": 0,
        "extensions": [
            ""
        ]
    },
    "amiga": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/amiga",
        "emulator": "amiberry",
        "emulatorArgs": "",
        "index": 1,
        "extensions": [
            ".lha",
            ".adf"
        ]
    },
    "snes": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/snes",
        "emulator": "Mesen",
        "emulatorArgs": "--fullscreen",
        "index": 2,
        "extensions": [
            ".smc"
        ]
    },
    "pcengine": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/pcengine",
        "emulator": "mednafen",
        "emulatorArgs": "",
        "index": 3,
        "extensions": [
            ".pce"
        ]
    },
    "dreamcast": {
        "isEnabled": false,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/dreamcast",
        "emulator": "flycast-x86_64.AppImage",
        "emulatorArgs": "",
        "index": 4,
        "extensions": [
            ".gdi",
            ".cdi"
        ]
    },
    "gamecube": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/gc",
        "emulator": "mupen64plus",
        "emulatorArgs": "--input /usr/lib/x86_64-linux-gnu/mupen64plus/mupen64plus-input-sdl.so --gfx /usr/lib/x86_64-linux-gnu/mupen64plus/mupen64plus-video-rice.so --fullscreen --resolution 1920x1080",
        "index": 5,
        "extensions": [
            ".iso",
            ".ciso"
        ]
    },
    "n64": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/n64",
        "emulator": "mupen64plus",
        "emulatorArgs": "",
        "index": 6,
        "extensions": [
            ".z64"
        ]
    },
    "psx": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/psx",
        "emulator": "duckstation",
        "emulatorArgs": "",
        "index": 7,
        "extensions": [
            ".srm"
        ]
    },
    "ps2": {
        "isEnabled": true,
        "gamesDir": "/media/px/ptidisk/retropie-mount/roms/ps2",
        "emulator": "pcsx2",
        "emulatorArgs": "",
        "index": 8,
        "extensions": [
            ".bin",
            ".iso"
        ]
    },
    "ps3": {
        "isEnabled": false,
        "gamesDir": "",
        "emulator": "",
        "emulatorArgs": "",
        "index": 9,
        "extensions": [
            ".bin",
            ".iso"
        ]
    }
};

ipcMain.handle('load-preferences', () => {
    const preferences = loadPreferences();
    const userDataPath = app.getPath('userData');
    const appPath = app.getAppPath();
    const versionNumber = pjson.version;

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
        preferences.appPath = appPath;
        preferences.versionNumber = versionNumber;
        return preferences;
    }
});

ipcMain.handle('save-preferences', async (event, prefs) => {
    console.log("prefs: ", prefs);
    savePreferences(prefs);
});

ipcMain.handle('quit', () => {
    app.quit();
});

// app.whenReady().then(createWindows);

function killChildProcesses(childProcesses) {
    childProcesses.forEach((child, pid) => {
        try {
            if (process.platform === 'win32') {
                // Windows needs taskkill
                spawn('taskkill', ['/pid', pid, '/f', '/t']);
            } else {
                // POSIX systems (Linux/Mac) use process groups
                process.kill(-pid, 'SIGKILL');
            }
        } catch (err) {
            console.error(`Failed to kill PID ${pid}:`, err);
        }
    });
    childProcesses.clear();
}

ipcMain.handle('parse-sfo', async (_event, filePath) => {
    return new Promise((resolve, reject) => {
        const exePath = getExecutablePath();
        const args = ['-q', 'TITLE'];

        const process = spawn(exePath, [filePath, ...args]);

        let output = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (err) => console.error('SFO Error:', err.toString()));

        process.on('close', (code) => {
            if (code === 0) {
                resolve(output.trim());
            } else {
                reject(new Error(`SFO parser failed with code ${code}`));
            }
        });
    });
});

app.whenReady().then(() => {

    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Access-Control-Allow-Origin": ["*"], // Allow all origins
                "Access-Control-Allow-Methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                "Access-Control-Allow-Headers": ["*"]
            }
        });
    });

    createWindows();

    gamecontroller.on('controller-button-down', (event) => {
        if (event.button === 'back') {
            buttonStates.back = true;
        } else if (event.button === 'dpdown') {
            buttonStates.dpdown = true;
        }

        if (buttonStates.back && buttonStates.dpdown) {
            killChildProcesses(childProcesses);
        }
    });

    globalShortcut.register('Ctrl+Shift+K', () => {
        killChildProcesses(childProcesses);
    });
});
