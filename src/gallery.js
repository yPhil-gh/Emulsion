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
    const extensionsArrays = {
        gamecube:['.iso', '.ciso'],
        amiga:['.adf']
    };

    const extensions = extensionsArrays[platform];

    // Scan the games directory for valid files
    const gameFiles = scanDirectory(gamesDir, extensions, false);

    // Create a gallery item for each game
    gameFiles.forEach(gameFile => {
        const fileName = path.basename(gameFile);
        const fileNameWithoutExt = path.parse(fileName).name;
        const coverImagePath = path.join(userDataPath, "covers", platform, `${fileNameWithoutExt}.jpg`);
        const missingImagePath = path.join(__dirname, './img/missing.png');

        // Create the game container
        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');
        // gameContainer.setAttribute('tabindex', 0);
        gameContainer.setAttribute('data-command', `${emulator} ${emulatorArgs || ""} "${gameFile}"`);

        // fetchCoverButton.setAttribute('data-game', fileNameWithoutExt);

        // Add click event to launch the game
        gameContainer.addEventListener('click', (event) => {

            console.log("data-plop:", event.target.dataset.command);

            event.stopPropagation();
            // const command = `${emulator} ${emulatorArgs} "${gameFile}"`;
            const command = `${emulator} -b -e "${gameFile}"`;

            const escapedCommand = process.platform === 'win32' ? `"${event.target.dataset.command}"` : event.target.dataset.command.replace(/(["'`\\\s!$&*(){}\[\]|<>?;])/g, '\\$1');

            console.log("command, fileName: ", command, fileName);
            ipcRenderer.send('run-command', event.target.dataset.command); // Send the command to the main process
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
        fetchCoverButton.classList.add('fetch-cover-button');
        fetchCoverButton.setAttribute('title', `Fetch cover for ${fileNameWithoutExt}`);
        fetchCoverButton.setAttribute('data-game', fileNameWithoutExt);
        fetchCoverButton.setAttribute('data-platform', platform);
        fetchCoverButton.setAttribute('data-image-status', fs.existsSync(coverImagePath) ? 'found' : 'missing');

        fetchCoverButton.addEventListener('click', async (event) => {
            event.stopPropagation();
            const gameName = event.target.getAttribute('data-game');
            const platform = event.target.getAttribute('data-platform');

            // Function to display the dialog with multiple images
            function showImageDialog(imageUrls, gameName) {
                const dialog = document.getElementById('imageDialog');
                const dialogTitle = document.getElementById('dialogTitle');
                const imageGrid = document.getElementById('imageGrid');
                const selectButton = document.getElementById('selectButton');

                let selectedImageUrl = null; // Store the selected image URL

                // Set the dialog title
                dialogTitle.textContent = `Select a Cover for ${gameName}`;

                // Clear any existing images in the grid
                imageGrid.innerHTML = '';

                // Add each image to the grid
                imageUrls.forEach((url) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('image-container');

                    const img = document.createElement('img');
                    img.src = url;

                    // Add click handler to select the image visually
                    imgContainer.addEventListener('click', () => {
                        // Remove the 'selected' class from all image containers
                        document.querySelectorAll('.image-container').forEach((container) => {
                            container.classList.remove('selected');
                        });

                        // Add the 'selected' class to the clicked image container
                        imgContainer.classList.add('selected');

                        // Store the selected image URL
                        selectedImageUrl = url;
                    });

                    imgContainer.appendChild(img);
                    imageGrid.appendChild(imgContainer);
                });

                // Show the dialog
                dialog.showModal();

                // Handle the "Select" button click
                selectButton.addEventListener('click', () => {
                    if (selectedImageUrl) {
                        console.log('Selected Image URL:', selectedImageUrl);

                        // dialog.close(); // Close the dialog after selection

                        // // Download the selected image and reload
                        // downloadAndReload(selectedImageUrl, gameName)
                        //     .then(() => {
                        //         console.log('Selected image downloaded and reloaded!');
                        //     })
                        //     .catch((error) => {
                        //         console.error('Error:', error.message);
                        //     });
                    } else {
                        alert('Please select an image before pressing "Select".');
                    }
                });

                // Close the dialog when the close button is clicked
                document.getElementById('closeDialog').addEventListener('click', () => {
                    dialog.close();
                });
            }

            fetchCoverButton.classList.add('rotate');

            const isBatch = false;

            try {
                const { imgSrcArray } = await window.coverDownloader.searchGame(gameName, platform);

                if (imgSrcArray.length > 1 && !isBatch) {
                    showImageDialog(imgSrcArray, gameName);
                } else if (imgSrcArray && imgSrcArray.length > 0) {
                    // If there's only one image (or menu/fetch covers), download it directly
                    const coverPath = await window.coverDownloader.downloadCover(imgSrcArray[0], gameName, platform);
                    window.coverDownloader.reloadImage(imgElement, coverPath);
                    fetchCoverButton.setAttribute('data-image-status', 'found');
                }

                // if (imgSrcArray && imgSrcArray.length > 0) {
                //     const coverPath = await window.coverDownloader.downloadCover(imgSrcArray[0], gameName, platform);
                //     window.coverDownloader.reloadImage(imgElement, coverPath);
                //     fetchCoverButton.setAttribute('data-image-status', 'found');
                // }
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
