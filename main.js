import { app, BrowserWindow, ipcMain, shell, dialog, globalShortcut, Menu, session } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn, exec } from 'child_process';
import { getAllCoverImageUrls } from './src/js/backends.js';

import axios from 'axios';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { readFile } from 'fs/promises';

console.log("getExecutablePath(): ", getExecutablePath());

console.log("process.resourcesPath: ", process.resourcesPath);

function getExecutablePath() {
  const exeName = os.platform() === 'win32' ? 'sfo.exe' : 'sfo';
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,          // /opt/emulsion/resources
      'bin',
      exeName
    );
  } else {
    // __dirname in dev points to your src folder
    return path.join(__dirname, 'bin', exeName);
  }
}

async function loadPackageJson() {
  // app.getAppPath() returns:
  //  - in dev: the project root folder
  //  - in production: the path to resources/app.asar
  const appPath = app.getAppPath();
  const pkgPath = path.join(appPath, 'package.json');
  const data = await readFile(pkgPath, 'utf-8');
  return JSON.parse(data);
}

const pjson = await loadPackageJson();

const buttonStates = {
    back: false,
    dpdown: false,
};

const preferencesFilePath = path.join(app.getPath('userData'), "preferences.json");
const recentFilePath = path.join(app.getPath('userData'), "recently_played.json");

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

function loadRecents() {
    try {
        if (fs.existsSync(recentFilePath)) {
            const recentFileContent = fs.readFileSync(recentFilePath, 'utf8');

            try {
                const recent = JSON.parse(recentFileContent);

                if (!Array.isArray(recent)) {
                    throw new Error("Expected an array");
                }

                const isValidRecord = (record) =>
                      record &&
                      typeof record.fileName === 'string' &&
                      typeof record.filePath === 'string' &&
                      typeof record.gameName === 'string' &&
                      typeof record.emulator === 'string' &&
                      typeof record.emulatorArgs === 'string' && // Can be empty string
                      typeof record.platform === 'string' &&
                      typeof record.date === 'string' && !isNaN(Date.parse(record.date));

                const validRecords = recent.filter(isValidRecord);

                // Optionally overwrite the file if invalid entries were removed
                if (validRecords.length !== recent.length) {
                    fs.writeFileSync(recentFilePath, JSON.stringify(validRecords, null, 2), 'utf8');
                    console.warn(`Removed ${recent.length - validRecords.length} invalid entries from recents file.`);
                }

                return validRecords;

            } catch (parseError) {
                console.error('Invalid JSON in recent file:', parseError);
                return { error: 'INVALID_JSON', message: 'The recent file contains invalid JSON. It will now be reset.' };
            }
        } else {
            return { error: 'FILE_NOT_FOUND', message: 'No recent file found. Using default recent.' };
        }
    } catch (error) {
        console.error('Error loading recent:', error);
        return { error: 'UNKNOWN_ERROR', message: 'An unknown error occurred while loading recent.' };
    }
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
                                typeof platformPreferences.steamGridAPIKey !== 'string'
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
        const data = JSON.stringify(preferences, null, 4); // Pretty-print the JSON
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
        icon: path.join(__dirname, 'img/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });
    mainWindow.loadFile('src/html/index.html');

    if (app.isPackaged) {
        Menu.setApplicationMenu(null);
    }
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
    if (!app.isPackaged) {
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

ipcMain.on('fetch-images', (event, gameName, platformName, steamGridAPIKey, giantBombAPIKey) => {
    getAllCoverImageUrls(gameName, platformName, { steamGridAPIKey, giantBombAPIKey })
        .then((urls) => {
            event.reply('image-urls', urls);
        })
        .catch((err) => {
            console.error('Failed to fetch image URLs:', err);
            event.reply('image-urls', []);
        });
});

let childProcesses = new Map();

// ipcMain.on('run-command', (event, command) => {
//     const child = spawn(command, {
//         shell: true,
//         detached: true,
//         stdio: 'ignore'
//     });

//     childProcesses.set(child.pid, child);

//     child.on('exit', () => {
//         childProcesses.delete(child.pid);
//     });
// });

function getRecentlyPlayedPath() {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'recently_played.json');
}

// function runCommand(command) {

// }

ipcMain.on('run-command', (event, data) => {
    const { fileName, filePath, gameName, emulator, emulatorArgs, platform } = data;

    const recentEntry = {
        fileName,
        filePath,
        gameName,
        emulator,
        emulatorArgs,
        platform,
        date: new Date().toISOString()
    };

    const command = `${emulator} ${emulatorArgs || ""} "${filePath}"`;

    const recentFilePath = getRecentlyPlayedPath();
    let recents = [];

    if (fs.existsSync(recentFilePath)) {
        try {
            const fileData = fs.readFileSync(recentFilePath, 'utf8');
            recents = JSON.parse(fileData);
        } catch (readErr) {
            console.error("Error reading recently_played.json:", readErr);
            recents = [];
        }
    }

    // Check if an entry already exists with the same fileName.
    const existingIndex = recents.findIndex(entry => entry.fileName === fileName);

    if (existingIndex >= 0) {
        recents[existingIndex] = {
            ...recents[existingIndex],
            date: recentEntry.date
        };
    } else {
        recents.push(recentEntry);
    }

    try {
        fs.writeFileSync(recentFilePath, JSON.stringify(recents, null, 4), 'utf8');
        console.log("Updated recently_played.json with new/updated entry.");
    } catch (writeErr) {
        console.error("Error writing recently_played.json:", writeErr);
    }

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
        recentlyPlayedPolicy: "hide",
        theme: "default",
        steamGridAPIKey: "",
        giantBombAPIKey: ""
    }
};

const platforms = [
    { name: "nes", extensions: [".zip"] },
    { name: "sms", extensions: [".zip"] },
    { name: "pcengine", extensions: [".pce"] },
    { name: "amiga", extensions: [".lha", ".adf"] },
    { name: "megadrive", extensions: [".md"] },
    { name: "snes", extensions: [".smc"] },
    { name: "jaguar", extensions: [".jag"] },
    { name: "saturn", extensions: [".cue"] },
    { name: "psx", extensions: [".srm"] },
    { name: "n64", extensions: [".z64"] },
    { name: "dreamcast", extensions: [".gdi", ".cdi"] },
    { name: "ps2", extensions: [".bin", ".iso"] },
    { name: "gamecube", extensions: [".iso", ".ciso"] },
    { name: "xbox", extensions: [".iso"] },
    { name: "psp", extensions: [".iso"] },
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

ipcMain.handle('load-preferences', () => {
    const preferences = loadPreferences();
    const recents = loadRecents();

    const userDataPath = app.getPath('userData');
    const appPath = app.getAppPath();
    const versionNumber = pjson.version;

    if (recents.error) {
        console.log("recent.message: ", recents.message);
    }

    if (preferences.error && preferences.error === 'INVALID_JSON') {

        const result = dialog.showMessageBoxSync(mainWindow, {
            type: 'error',
            message: preferences.message,
            buttons: ['Reset', 'Quit'],
            defaultId: 0, // "Reset" (default)
            cancelId: 1,  // "Quit"
        });

        if (result === 0) {
            console.log("Resetting preferences to default...");
            fs.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 4), 'utf8');

            defaultPreferences.userDataPath = userDataPath;
            return defaultPreferences;
        } else {
            app.quit();
            return null;
        }

    } else if (preferences.error && preferences.error === 'FILE_NOT_FOUND') {

        console.log("Setting preferences to default...");
        fs.writeFileSync(preferencesFilePath, JSON.stringify(defaultPreferences, null, 4), 'utf8');

        defaultPreferences.userDataPath = userDataPath;
        return defaultPreferences;

    } else {

        preferences.userDataPath = userDataPath;
        preferences.appPath = appPath;
        preferences.versionNumber = versionNumber;
        preferences.kidsMode = process.argv.includes('--mediacenter');
        preferences.recents = recents;
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

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

ipcMain.handle('open-about-window', () => {
    const aboutWindow = new BrowserWindow({
        width: 300,
        height: 400,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: 'About Emulsion',
        modal: true,
        parent: mainWindow,
        icon: path.join(__dirname, 'img/icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    aboutWindow.removeMenu();
    aboutWindow.loadFile(path.join(__dirname, 'src/html/about.html'));
});

ipcMain.handle('get-version', () => {
    return pjson.version;
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

    globalShortcut.register('Ctrl+Shift+K', () => {
        killChildProcesses(childProcesses);
    });
});
