import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Menu, session } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, exec } from 'child_process';
import { getAllCoverImageUrls } from './steamgrid.js';
import axios from 'axios';
import gamecontroller from "sdl2-gamecontroller";
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const preferencesFilePath = path.join(app.getPath('userData'), "preferences.json");

function showHelp() {
    console.log(`
Emulsion ${pjson.version}
Usage: ${pjson.name.toLowerCase()} [options]

Options:
  --kids-mode   Read-only mode: No config / settings, disabled platforms hidden.
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
            const preferencesFileContent = fs.readFileSync(preferencesFilePath, 'utf8');

            // Attempt to parse the JSON
            try {
                // console.log("data: ", preferencesFileContent);
                const preferences = JSON.parse(preferencesFileContent);;

                for (const [platform, platformPreferences] of Object.entries(preferences)) {

                    if (platform === 'settings') {

                        if (
                            typeof platformPreferences !== 'object' ||
                                platformPreferences === null ||
                                typeof platformPreferences.numberOfColumns !== 'number' ||
                                typeof platformPreferences.footerSize !== 'string' ||
                                typeof platformPreferences.homeMenuTheme !== 'string' ||
                                typeof platformPreferences.disabledPlatformsPolicy !== 'string' ||
                                typeof platformPreferences.steamGridKey !== 'string'
                        ) {
                            console.error(`Invalid preferences`);
                            return { error: 'INVALID_JSON', message: 'The preferences file contains invalid JSON. It will now be reset.' };
                        }

                    } else {

                        if (
                            typeof platformPreferences !== 'object' ||
                                platformPreferences === null ||
                                typeof platformPreferences.isEnabled !== 'boolean' ||
                                typeof platformPreferences.gamesDir !== 'string' ||
                                typeof platformPreferences.index !== 'number' ||
                                typeof platformPreferences.emulator !== 'string' ||
                                typeof platformPreferences.emulatorArgs !== 'string'
                        ) {
                            console.error(`Invalid preferences for platform: ${platform}`);
                            return { error: 'INVALID_JSON', message: 'The preferences file contains invalid JSON. It will now be reset.' };
                        }

                    }

                }

                return preferences;
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
    const saveDir = path.join(app.getPath('userData'), 'covers', platform);
    const savePath = path.join(saveDir, `${gameName}.jpg`);
    createDirectoryIfNeeded(saveDir);

    try {
        const response = await axios({
            url: imgSrc,
            method: 'GET',
            responseType: 'stream',
        });

        const writer = fs.createWriteStream(savePath);

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(savePath));
            writer.on('error', (error) => reject(error));
        });
    } catch (error) {
        console.error("Error downloading image: ", error);
        throw error;
    }
};

let mainWindow;

function createWindows() {
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

ipcMain.on('fetch-images', (event, gameName, steamGridKey) => {
    getAllCoverImageUrls(gameName, steamGridKey)
        .then((urls) => {
            event.reply('image-urls', urls); // Send the URLs back to the renderer process
        })
        .catch((err) => {
            console.error('Failed to fetch image URLs:', err);
            event.reply('image-urls', []); // Send an empty array in case of error
        });
});

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
    settings: {
        index: 0,
        numberOfColumns: 6,
        footerSize: "medium",
        homeMenuTheme: "flat",
        disabledPlatformsPolicy: "show",
        steamGridKey: ""
    }
};

const platforms = [
    { name: "amiga", extensions: [".lha", ".adf"] },
    { name: "snes", extensions: [".smc"] },
    { name: "pcengine", extensions: [".pce"] },
    { name: "dreamcast", extensions: [".gdi", ".cdi"] },
    { name: "gamecube", extensions: [".iso", ".ciso"] },
    { name: "n64", extensions: [".z64"] },
    { name: "psx", extensions: [".srm"] },
    { name: "ps2", extensions: [".bin", ".iso"] },
    { name: "ps3", extensions: [".SFO"] }
];

platforms.forEach((platform, index) => {
    defaultPreferences[platform.name] = {
        isEnabled: false,
        index: index + 1, // Start at 1 since settings is index 0
        gamesDir: "",
        emulator: "",
        emulatorArgs: "",
        extensions: platform.extensions
    };
});

// const defaultPreferencesZ = {
//     "settings": {
//         "isEnabled": true,
//         "index": 0,
//         "numberOfColumns": 6,
//         "footerSize": "medium",
//         "homeMenuTheme": "flat",
//         "disabledPlatformsPolicy": "show",
//         "steamGridKey": ""
//     },
//     "amiga": {
//         "isEnabled": false,
//         "index": 1,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".lha",
//             ".adf"
//         ]
//     },
//     "snes": {
//         "isEnabled": false,
//         "index": 2,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".smc"
//         ]
//     },
//     "pcengine": {
//         "isEnabled": false,
//         "index": 3,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".pce"
//         ]
//     },
//     "dreamcast": {
//         "isEnabled": false,
//         "index": 4,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".gdi",
//             ".cdi"
//         ]
//     },
//     "gamecube": {
//         "isEnabled": false,
//         "index": 5,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".iso",
//             ".ciso"
//         ]
//     },
//     "n64": {
//         "isEnabled": false,
//         "index": 6,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".z64"
//         ]
//     },
//     "psx": {
//         "isEnabled": false,
//         "index": 7,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".srm"
//         ]
//     },
//     "ps2": {
//         "isEnabled": false,
//         "index": 8,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".bin",
//             ".iso"
//         ]
//     },
//     "ps3": {
//         "isEnabled": false,
//         "index": 9,
//         "gamesDir": "",
//         "emulator": "",
//         "emulatorArgs": "",
//         "extensions": [
//             ".bin",
//             ".iso"
//         ]
//     }
// };

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
        preferences.kidsMode = process.argv.includes('--kids-mode');
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
