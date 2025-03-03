const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow, page2Window, page3Window;

function createWindows() {
  // Main window (Page 1)
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  mainWindow.loadFile('src/menu.html');

  // Preload Page 2
  page2Window = new BrowserWindow({
    show: false, // Hide the window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  page2Window.loadFile('src/games.html');

  // Preload Page 3
  page3Window = new BrowserWindow({
    show: false, // Hide the window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });
  page3Window.loadFile('src/settings.html');

  // Send data to the renderer process after the window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    const userDataPath = app.getPath('userData');
    const menuData = { message: 'Welcome to the Menu!', userDataPath };
    mainWindow.webContents.send('populate-menu', menuData);
  });

  page2Window.webContents.on('did-finish-load', () => {
    const userDataPath = app.getPath('userData');
    const gamesData = { message: 'Welcome to the Games Page!', userDataPath };
    page2Window.webContents.send('populate-games', gamesData);
  });

  page3Window.webContents.on('did-finish-load', () => {
    const userDataPath = app.getPath('userData');
    const settingsData = { message: 'Welcome to the Settings Page!', userDataPath };
    page3Window.webContents.send('populate-settings', settingsData);
  });
}

ipcMain.on('navigate-to', (event, page) => {
  if (page === 'menu') {
    mainWindow.loadFile('src/menu.html');
  } else if (page === 'games') {
    mainWindow.loadFile('src/games.html');
  } else if (page === 'settings') {
    mainWindow.loadFile('src/settings.html');
  }
});

app.whenReady().then(createWindows);
