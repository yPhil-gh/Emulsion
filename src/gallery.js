// const { ipcRenderer } = require('electron');
// const fs = require('fs');
// const path = require('path');

window.gallery = {
    buildGallery: function(platform, gamesDir, emulator, emulatorArgs, userDataPath) {
        buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath);
    }
};

// Function to recursively scan a directory for files with specific extensions.
// If recursive is false, only the top-level directory is scanned.
// If gamesDir is invalid, it returns an empty array.
function scanDirectory(gamesDir, extensions, recursive = true) {
  let files = [];

  // Validate the gamesDir argument
  if (!gamesDir || typeof gamesDir !== 'string') {
    console.warn("scanDirectory: Invalid directory path provided:", gamesDir);
    return files;
  }

  try {
    const items = fs.readdirSync(gamesDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(gamesDir, item.name);
      if (item.isDirectory()) {
        if (recursive) {
          files = files.concat(scanDirectory(fullPath, extensions, recursive));
        }
      } else if (extensions.includes(path.extname(item.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error("Error reading directory:", gamesDir, err);
  }

  return files;
}


// Function to build the gallery for a specific platform
function buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath) {
    const galleryContainer = document.createElement('div');
    galleryContainer.id = `${platform}-gallery`;
    galleryContainer.classList.add('gallery');

    // Define valid extensions for the platform
    const extensions = ['.iso', '.ciso']; // Add more extensions as needed

    // Scan the games directory for valid files
    const gameFiles = scanDirectory(gamesDir, extensions, false);

    // Create a gallery item for each game
    gameFiles.forEach(gameFile => {
        const fileName = path.basename(gameFile);
        const fileNameWithoutExt = path.parse(fileName).name;
        const coverImagePath = path.join(userDataPath, "covers", `${fileNameWithoutExt}.jpg`);
        const missingImagePath = path.join(__dirname, './img/missing.png');

        // Create the game container
        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');
        gameContainer.setAttribute('tabindex', 0);

        // gameContainer.addEventListener('click', () => {

        //     console.log("click!!");

        //     const command = path.join(gamesDir, fileName);

        //     console.log("command: ", command);

        //     // Escape spaces or quote the command based on the platform
        //     const escapedCommand = process.platform === 'win32' ? `"${command}"` : command.replace(/(["'`\\\s!$&*(){}\[\]|<>?;])/g, '\\$1');

        //     console.log("escapedCommand: ", escapedCommand);

        //     // console.log("yo: ", `${emulator} ${emulatorArgs} ${escapedCommand}`);

        //     // if (!fs.existsSync(emulator)) {
        //     //     console.log("No emulator",);
        //     //     // showPreferencesDialog(`Can't find "${emulator} anywhere"`, emulatorInput);
        //     // }

        //     ipcRenderer.send('run-command', `${emulator} ${emulatorArgs ? emulatorArgs : ""} ${escapedCommand}`);
        // });


        // Add click event to launch the game
        gameContainer.addEventListener('click', () => {
            // const command = `${emulator} ${emulatorArgs} "${gameFile}"`;
            const command = `${emulator} -b -e "${gameFile}"`;

            const escapedCommand = process.platform === 'win32' ? `"${command}"` : command.replace(/(["'`\\\s!$&*(){}\[\]|<>?;])/g, '\\$1');

            console.log("command: ", command);
            ipcRenderer.send('run-command', command); // Send the command to the main process
        });


        // Create the image element
        const imgElement = document.createElement('img');
        imgElement.src = fs.existsSync(coverImagePath) ? coverImagePath : missingImagePath;
        imgElement.alt = fileNameWithoutExt;
        imgElement.title = fileNameWithoutExt;
        imgElement.classList.add('game-image');

        const nameElement = document.createElement('p');
        nameElement.textContent = `${fileNameWithoutExt}`;

        // Create the fetch cover button
        const fetchCoverButton = document.createElement('button');
        fetchCoverButton.classList.add('fetchCoverButton');
        fetchCoverButton.setAttribute('title', `Fetch cover for ${fileNameWithoutExt}`);
        fetchCoverButton.setAttribute('data-game', fileNameWithoutExt);
        fetchCoverButton.setAttribute('data-platform', platform);
        fetchCoverButton.setAttribute('data-image-status', fs.existsSync(coverImagePath) ? 'found' : 'missing');

        fetchCoverButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            const gameName = event.target.getAttribute('data-game');
            const platform = event.target.getAttribute('data-platform');

            // Rotate the button
            fetchCoverButton.classList.add('rotate');

            try {
                const imageUrl = await searchGame(gameName, platform); // Fetch the cover image URL
                if (imageUrl) {
                    await downloadImage(imageUrl, gameName, platform); // Download the image
                    imgElement.src = path.join(gamesDir, `${fileNameWithoutExt}.jpg`); // Update the image source
                    fetchCoverButton.setAttribute('data-image-status', 'found');
                }
            } catch (error) {
                console.error('Error fetching cover:', error);
            } finally {
                fetchCoverButton.classList.remove('rotate');
            }
        });

        // Append elements to the game container
        gameContainer.appendChild(imgElement);
        gameContainer.appendChild(nameElement);
        gameContainer.appendChild(fetchCoverButton);

        // Append the game container to the gallery
        galleryContainer.appendChild(gameContainer);
    });

    // Append the gallery to the body
    document.body.appendChild(galleryContainer);

    // Initialize navigation for the gallery
    // initializeGalleryNavigation(galleryContainer);
    window.control.initNav(galleryContainer);
}

// Function to initialize the gallery for all platforms
function initializeGallery() {
  const platforms = JSON.parse(fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')).platforms || [];

  platforms.forEach(platform => {
    const preferences = JSON.parse(localStorage.getItem(platform));
    if (preferences && preferences.gamesDir && preferences.emulator) {
      buildGallery(platform, preferences.gamesDir, preferences.emulator, preferences.emulatorArgs);
    }
  });
}
