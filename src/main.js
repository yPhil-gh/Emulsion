const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow, gamesWindow, settingsWindow;

function createWindows() {
  // Create the main window (menu)
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Hide the window until all pages are ready
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // Create the games window (hidden)
  gamesWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // Create the settings window (hidden)
  settingsWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // Load all pages
  mainWindow.loadFile('src/menu.html');
  gamesWindow.loadFile('src/games.html');
  settingsWindow.loadFile('src/settings.html');

  // Send data to each page and wait for confirmation
  const userDataPath = app.getPath('userData');

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('populate-menu', { userDataPath });
  });

  gamesWindow.webContents.on('did-finish-load', () => {
    gamesWindow.webContents.send('populate-games', { userDataPath });
  });

  settingsWindow.webContents.on('did-finish-load', () => {
    settingsWindow.webContents.send('populate-settings', { userDataPath });
  });

  // Wait for all pages to confirm they are ready
  let pagesReady = 0;
  ipcMain.on('page-ready', () => {
    pagesReady++;
    if (pagesReady === 3) {
      // All pages are ready, show the main window and enable navigation
      mainWindow.show();
      mainWindow.webContents.send('enable-navigation');
    }
  });
}

// Handle navigation requests
ipcMain.on('navigate-to', (event, page) => {
  if (page === 'games') {
    // mainWindow.hide();
    gamesWindow.show();
  } else if (page === 'settings') {
    // mainWindow.hide();
    settingsWindow.show();
  } else if (page === 'menu') {
    // gamesWindow.hide();
    // settingsWindow.hide();
    mainWindow.show();
  }
});

app.whenReady().then(createWindows);
