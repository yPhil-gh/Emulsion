window.gallery = {
    buildGallery: function(platform, gamesDir, emulator, emulatorArgs, userDataPath) {
        ipcRenderer.send('change-window-title', "EmumE - Select a Game");
        return buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath);
    },
    buildGalleries: function(platforms, userDataPath) {
        return new Promise((resolve, reject) => {
            try {
                const galleriesContainer = document.getElementById('galleries');

                platforms.forEach((platform) => {
                    const prefString = localStorage.getItem(platform);
                    let prefs;

                    document.getElementById('loading-platform').textContent = platform;

                    if (prefString) {
                        prefs = JSON.parse(prefString);
                        let gamesDir = prefs.gamesDir;
                        let emulator = prefs.emulator;
                        let emulatorArgs = prefs.emulatorArgs;

                        const thisGallery = buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath.userDataPath);
                        thisGallery.style.display = "none";

                        // Append the gallery to the container
                        galleriesContainer.appendChild(thisGallery);
                    } else {
                        console.log("No prefs for ", platform);
                    }
                });

                // Resolve the promise with platforms
                resolve(platforms);
            } catch (error) {
                // Reject the promise if something goes wrong
                reject(error);
            }
        });
    }

};

// Recursively scan a directory for files with specific extensions.
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


// Build the gallery for a specific platform
function buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath) {

    const galleryContainer = document.createElement('div');
    galleryContainer.id = `gallery-${platform}`;
    galleryContainer.classList.add('gallery');
    galleryContainer.tabindex = -1;

    // Define valid extensions for the platform
    const extensionsArrays = {
        gamecube:[".iso", ".ciso"],
        amiga:[".lha", ".adf"],
        pcengine:[".srm"]
    };

    const extensions = extensionsArrays[platform];

    // Scan the platform games directory for valid files
    const gameFiles = scanDirectory(gamesDir, extensions, false);

    let i = 1;

    // Create a gallery item for each game
    gameFiles.forEach(gameFile => {

        const fileName = path.basename(gameFile);

        document.getElementById('loading-game').textContent = i + " - " + fileName;

        const fileNameWithoutExt = path.parse(fileName).name;
        const coverImagePath = path.join(userDataPath, "covers", platform, `${fileNameWithoutExt}.jpg`);
        const missingImagePath = path.join(__dirname, './img/missing.png');

        // Create the game container
        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');
        // gameContainer.setAttribute('tabindex', 0);
        gameContainer.setAttribute('data-command', `${emulator} ${emulatorArgs || ""} "${gameFile}"`);
        gameContainer.setAttribute('data-index', i++);

        gameContainer.tabindex = -1;

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


        // Create the image container
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');

        // Create the image element
        const imgElement = document.createElement('img');
        imgElement.src = fs.existsSync(coverImagePath) ? coverImagePath : missingImagePath;
        imgElement.alt = fileNameWithoutExt;
        imgElement.title = fileNameWithoutExt;
        imgElement.classList.add('game-image');

        const nameElement = document.createElement('p');
        nameElement.textContent = `${fileNameWithoutExt}`;
        nameElement.classList.add('game-name');

        // Create the fetch cover button
        const fetchCoverButton = document.createElement('button');
        fetchCoverButton.classList.add('fetch-cover-button');
        fetchCoverButton.setAttribute('title', `Fetch cover for ${fileNameWithoutExt}`);
        fetchCoverButton.setAttribute('data-game', fileNameWithoutExt);
        fetchCoverButton.setAttribute('data-platform', platform);
        fetchCoverButton.setAttribute('data-image-status', fs.existsSync(coverImagePath) ? 'found' : 'missing');

        fetchCoverButton.addEventListener('click', async (event) => {

            fetchCoverButton.classList.add('rotate');

            event.stopPropagation();
            const gameName = event.target.getAttribute('data-game');
            const platform = event.target.getAttribute('data-platform');

            function showImageDialog(imageUrls, gameName) {
                const coversDialog = document.getElementById('image-dialog');
                const dialogTitle = document.getElementById('image-dialog-title');
                const imageGrid = document.getElementById('image-grid');
                const selectButton = document.getElementById('image-dialog-select-button');
                const closeButton = document.getElementById('image-dialog-close-button');

                let selectedImageUrl = null;

                // Set the dialog title
                dialogTitle.textContent = `Select a Cover for ${gameName}`;

                // Clear any existing images in the grid
                imageGrid.innerHTML = '';

                // Add each image to the grid
                imageUrls.forEach((url) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.classList.add('image-container');
                    imgContainer.tabIndex = 0; // Make the container focusable

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

                coversDialog.classList.remove('hidden');

                // Handle the "Select" button click
                selectButton.addEventListener('click', () => {
                    if (selectedImageUrl) {
                        console.log('Selected Image URL:', selectedImageUrl);

                        downloadAndReload(selectedImageUrl, gameName)
                          .then(() => {
                            console.log('Selected image downloaded and reloaded!');
                          })
                          .catch((error) => {
                            console.error('Error:', error.message);
                          });

                        coversDialog.classList.add('hidden');

                        window.control.initGalleryNav(document.querySelector(`#gallery-${platform}`));

                    } else {
                        alert('Please select an image before pressing "Select".');
                    }
                });

                // Close the dialog when the close button is clicked
                closeButton.addEventListener('click', () => {
                    coversDialog.classList.add('hidden');
                });
            }

            function downloadAndReload(imageUrl, gameName) {
                return window.coverDownloader.downloadImage(imageUrl, gameName, platform)
                    .then(() => {
                        window.coverDownloader.reloadImage(imgElement, path.join(userDataPath, "covers", platform, `${gameName}.jpg`));
                        window.control.updateControlsMenu({message : `OK: ${gameName} (${platform})`});
                    })
                    .catch((error) => {
                        console.error('Error downloading image:', error.message);
                    });
            }


            const isBatch = false;

            await window.coverDownloader.searchGame(gameName, platform)
                .then((details) => {

                    // If there are multiple images, display them in the dialog
                    if (details.imgSrcArray.length > 1 && !isBatch) {
                        window.control.showCoversDialog(details.imgSrcArray, gameName);
                        // showImageDialog(details.imgSrcArray, gameName);
                    } else {
                        // If there's only one image (or menu/fetch covers), download it directly
                        return window.control.downloadAndReload(details.imgSrcArray[0], gameName, platform, imgElement);
                    }
                })
                .catch((error) => {
                    console.info('Error:', error.message);
                    // window.control.showStatus(`Cover not found: ${gameName} (${platform})`);
                    // alert("plop: " + error.message);
                })
                .finally(() => {
                    console.log("finally: ");
                    fetchCoverButton.classList.remove('rotate');
                });

        });

        imgContainer.appendChild(imgElement);
        imgContainer.appendChild(fetchCoverButton);
        gameContainer.appendChild(imgContainer);
        gameContainer.appendChild(nameElement);
        galleryContainer.appendChild(gameContainer);
    });

    document.body.style.perspective = "unset";

    return galleryContainer;

}
