window.gallery = {
    buildGallery: function(platform, gamesDir, emulator, emulatorArgs, userDataPath) {
        ipcRenderer.send('change-window-title', "EmumE - Select a Game");
        buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath);
    }
};

// Recursively scan a directory for files with specific extensions.
// If recursive is false, only the top-level directory is scanned.
// If gamesDir is invalid, it returns an empty array.
function scanDirectory(gamesDir, extensions, recursive = true) {
    let files = [];

    console.log("gamesDir, extensions: ", gamesDir, extensions);

  // Validate the gamesDir argument
  if (!gamesDir || typeof gamesDir !== 'string') {
    console.warn("scanDirectory: Invalid directory path provided:", gamesDir);
    return files;
  }

  try {
    const items = fs.readdirSync(gamesDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(gamesDir, item.name);
        console.log("path.extname(item.name).toLowerCase(): ", path.extname(item.name).toLowerCase());
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
    galleryContainer.id = `gallery`;
    galleryContainer.classList.add('gallery');

    // Define valid extensions for the platform
    const extensionsArrays = {
        gamecube:[".iso", ".ciso"],
        amiga:[".lha", ".adf"]
    };

    const extensions = extensionsArrays[platform];

    // Scan the platform games directory for valid files
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

            // Function to display the dialog with multiple images
            function showImageDialog(imageUrls, gameName) {
                const coversDialog = document.getElementById('imageDialog');
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
                    imgContainer.tabindex = 0;
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
                coversDialog.showModal();

                window.control.initCoversDialogNav(coversDialog);

                // const focusableElements = coversDialog.querySelectorAll(
                //     'button, div, [tabindex]:not([tabindex="-1"])'
                // );


                window.coverDownloader.searchGame(gameName, platform)
                    .then((details) => {

                        console.log("details: ", details);

                        // If there are multiple images, display them in the dialog
                        if (details.imgSrcArray.length > 1 && !isBatch) {
                            showImageDialog(details.imgSrcArray, gameName);
                        } else {
                            // If there's only one image (or menu/fetch covers), download it directly
                            return downloadAndReload(details.imgSrcArray[0], gameName);
                        }
                    })
                    .catch((error) => {
                        console.error('Error!!!', error.message);
                        // alert(error.message);
                    })
                    .finally(() => {
                        // Remove the rotation class when the operation is complete
                        button.classList.remove('rotate');
                    });


                // Handle the "Select" button click
                selectButton.addEventListener('click', () => {
                    if (selectedImageUrl) {
                        console.log('Selected Image URL:', selectedImageUrl);

                        dialog.close(); // Close the dialog after selection

                        // Download the selected image and reload
                        downloadAndReload(selectedImageUrl, gameName)
                            .then(() => {
                                console.log('Selected image downloaded and reloaded!');
                            })
                            .catch((error) => {
                                console.error('Error:', error.message);
                            });
                    } else {
                        alert('Please select an image before pressing "Select".');
                    }
                });

                // Close the dialog when the close button is clicked
                document.getElementById('closeDialog').addEventListener('click', () => {
                    coversDialog.close();
                });
            }

            function downloadAndReload(imageUrl, gameName) {
                return window.coverDownloader.downloadImage(imageUrl, gameName, platform)
                    .then(() => {
                        window.coverDownloader.reloadImage(imgElement, path.join(userDataPath, "covers", platform, `${gameName}.jpg`));
                        window.control.showStatus(`Downloaded cover: ${gameName} (${platform})`);
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
                        showImageDialog(details.imgSrcArray, gameName);
                    } else {
                        // If there's only one image (or menu/fetch covers), download it directly
                        return downloadAndReload(details.imgSrcArray[0], gameName);
                    }
                })
                .catch((error) => {
                    // console.error('Error:', error.message);
                    window.control.showStatus(`Cover not found: ${gameName} (${platform})`);
                    // alert("plop: " + error.message);
                })
                .finally(() => {
                    fetchCoverButton.classList.remove('rotate');
                });

        });

        imgContainer.appendChild(imgElement);
        imgContainer.appendChild(fetchCoverButton);
        gameContainer.appendChild(imgContainer);
        gameContainer.appendChild(nameElement);
        galleryContainer.appendChild(gameContainer);
    });

    document.body.appendChild(galleryContainer);
    window.control.initGalleryNav(galleryContainer);
}
