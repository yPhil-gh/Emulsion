const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is fully loaded!');

  // Load the platforms menu
  loadPlatformsMenu();
});

// Load the platforms menu
function loadPlatformsMenu() {
  const platformsMenu = document.getElementById('platforms-menu');
  platformsMenu.innerHTML = ''; // Clear previous content

  const platforms = ['amiga', 'dreamcast', 'gamecube'];
  platforms.forEach(platform => {
    const platformDiv = document.createElement('div');
    platformDiv.className = 'platform';
    platformDiv.style.backgroundImage = `url(./img/${platform}.png)`;
    platformDiv.textContent = platform.toUpperCase();

    // Add click event listener
    platformDiv.addEventListener('click', () => handlePlatformClick(platform));

    platformsMenu.appendChild(platformDiv);
  });
}

// Handle platform click
function handlePlatformClick(platform) {
  console.log(`Platform clicked: ${platform}`);

  // Check if [platform]GamesDir and [platform]Emulator are set
  const gamesDir = localStorage.getItem(`${platform}GamesDir`);
  const emulator = localStorage.getItem(`${platform}Emulator`);

  if (!gamesDir || !emulator) {
    loadPlatformForm(platform); // Load the form
  } else {
    loadGameGallery(platform); // Load the game gallery
  }
}

// Load the platform form
function loadPlatformForm(platform) {
  fetch('src/html/platform-form.html')
    .then(response => response.text())
    .then(html => {
      const content = document.getElementById('content');
      content.innerHTML = html;

      // Set the platform name
      document.getElementById('platform-name').textContent = platform.toUpperCase();

      // Add event listeners for the form
      document.getElementById('browse-games-dir').addEventListener('click', () => {
        ipcRenderer.invoke('open-directory-dialog').then(result => {
          if (result) {
            document.getElementById('games-dir').value = result;
          }
        });
      });

      document.getElementById('browse-emulator').addEventListener('click', () => {
        ipcRenderer.invoke('open-file-dialog').then(result => {
          if (result) {
            document.getElementById('emulator').value = result;
          }
        });
      });

      document.getElementById('save-config').addEventListener('click', () => {
        const gamesDir = document.getElementById('games-dir').value;
        const emulator = document.getElementById('emulator').value;

        if (gamesDir && emulator) {
          // Save the configuration
          localStorage.setItem(`${platform}GamesDir`, gamesDir);
          localStorage.setItem(`${platform}Emulator`, emulator);

          // Reload the platforms menu
          loadPlatformsMenu();
        } else {
          alert('Please fill in all fields.');
        }
      });
    });
}

// Load the game gallery
function loadGameGallery(platform) {
  fetch('src/html/game-gallery.html')
    .then(response => response.text())
    .then(html => {
      const content = document.getElementById('content');
      content.innerHTML = html;

      // Build the game gallery for the selected platform
      buildGameGallery(platform);
    });
}

// Build the game gallery
function buildGameGallery(platform) {
  const gameGallery = document.getElementById('game-gallery');
  gameGallery.innerHTML = ''; // Clear previous content

  // Simulate some games for the selected platform
  const games = [
    { name: 'Game 1', cover: 'img/missing.png' },
    { name: 'Game 2', cover: 'img/missing.png' },
    { name: 'Game 3', cover: 'img/missing.png' },
  ];

  games.forEach(game => {
    const gameContainer = document.createElement('div');
    gameContainer.className = 'game-container';
    gameContainer.style.backgroundImage = `url(${game.cover})`;

    const gameName = document.createElement('div');
    gameName.className = 'game-name';
    gameName.textContent = game.name;
    gameContainer.appendChild(gameName);

    gameGallery.appendChild(gameContainer);
  });
}
