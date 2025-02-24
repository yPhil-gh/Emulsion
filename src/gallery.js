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
    },
    buildSettingsForm: function(platform, formTemplate) {
        return buildSettingsForm(platform, formTemplate);
    },
    buildSettingsForms: function(platforms, formTemplate) {

        const settingsGallery = document.getElementById("gallery-settings");

        platforms.forEach((platform) => {
            console.log("buildSettingsForm: ", platform);
            if (platform !== "settings") {
                const form = buildSettingsForm(platform, formTemplate);
                settingsGallery.appendChild(form);
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


function buildSettingsForm(platform, formTemplate) {

    const prefString = localStorage.getItem(platform);

    let prefs;

    if (prefString) {
        prefs = JSON.parse(prefString);
    }

    function capitalizeWord(word) {
        if (!word) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    async function browse(event) {
        console.log("event.target: ", event.target);
        let type;
        if (event.target.classList.contains("browse-button-dir")) {
            type = "directory";
        } else {
            type = "file";
        }

        event.stopPropagation();
        const inputId = browseDirButton.getAttribute('data-input');
        const inputElement = document.getElementById(inputId);
        const selectedPath = await ipcRenderer.invoke('select-file-or-directory', { type: type });
        if (selectedPath) {
            inputElement.value = selectedPath;
            inputElement.title = selectedPath;
        }
    }

    const form = document.createElement("div");
    form.innerHTML = formTemplate;
    form.className = "settings-form-container";

    // Row 3: Checkbox, Emulator Args
    // const enableArgsCheckbox = form.getElementById('enable-args'); // Enable args checkbox
    const iconDiv = form.querySelector('#platform-icon');
    const icon = document.createElement("img");

    const formLabel = form.querySelector('#form-label');
    formLabel.textContent = platform;

    icon.src = `img/platforms/${platform}.png`; // Update the image source
    icon.alt = `${platform} Icon`; // Update the alt text

    icon.className = `platform-form-icon`; // Update the alt text

    iconDiv.appendChild(icon);

    const platformForm = form.querySelector('#platform-form');
    platformForm.id = `${platform}-form`;

    const gamesDirInput = form.querySelector('#games-dir');
    gamesDirInput.id = `${platform}-games-dir`;
    gamesDirInput.value = (prefs && prefs.gamesDir) ? prefs.gamesDir : "";

    gamesDirInput.placeholder = `${capitalizeWord(platform)} Games Directory`;

    const browseDirButton = form.querySelector('.browse-button-dir');
    browseDirButton.setAttribute('data-platform', platform);
    browseDirButton.setAttribute('data-input', `${platform}-games-dir`);

    browseDirButton.addEventListener('click', browse);

    const emulatorInput = form.querySelector('#emulator');
    emulatorInput.id = `${platform}-emulator`;
    emulatorInput.value = (prefs && prefs.emulator) ?  prefs.emulator : "";

    emulatorInput.placeholder = `${platform} Emulator`;

    const emulatorArgsInput = form.querySelector('#emulator-args');
    emulatorArgsInput.id = `${platform}-emulator-args`;
    emulatorArgsInput.classList.add('emulator-args');
    emulatorArgsInput.value = (prefs && prefs.emulatorArgs) ? prefs.emulatorArgs : "";
    emulatorArgsInput.placeholder = `args`;

    const browseEmulatorButton = form.querySelector('.browse-button-file');
    browseEmulatorButton.setAttribute('data-platform', platform);
    browseEmulatorButton.setAttribute('data-input', `${platform}-emulator`);

    browseEmulatorButton.addEventListener('click', browse);

    const saveButton = form.querySelector('.save-button');
    saveButton.setAttribute('data-platform', platform);

    return form;
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
        pcengine:[".srm"],
        n64:[".z64"],
        dreamcast:[".gdi", ".cdi"]
    };

    const extensions = extensionsArrays[platform];

    // Scan the platform games directory for valid files
    const gameFiles = scanDirectory(gamesDir, extensions, true);

    let i = 1;

    // Create a gallery item for each game
    gameFiles.forEach(gameFile => {

        const fileName = path.basename(gameFile);

        document.getElementById('loading-game').textContent = i + " - " + fileName;

        const fileNameWithoutExt = path.parse(fileName).name;
        const coverImagePath = path.join(userDataPath, "covers", platform, `${fileNameWithoutExt}.jpg`);
        const missingImagePath = path.join(__dirname, "img", 'missing.png');

        // Create the game container
        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');
        // gameContainer.setAttribute('tabindex', 0);
        gameContainer.setAttribute('data-command', `${emulator} ${emulatorArgs || ""} "${gameFile}"`);
        gameContainer.setAttribute('data-index', i++);

        gameContainer.tabindex = -1;

        // Add click event to launch the game
        gameContainer.addEventListener('click', (event) => {

            event.stopPropagation();
            // const command = `${emulator} ${emulatorArgs} "${gameFile}"`;
            const command = `${emulator} -b -e "${gameFile}"`;

            const escapedCommand = process.platform === 'win32' ? `"${event.target.dataset.command}"` : event.target.dataset.command.replace(/(["'`\\\s!$&*(){}\[\]|<>?;])/g, '\\$1');

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


        // Create the first icon (F key)
        const icon1 = document.createElement('img');
        icon1.classList.add('fetch-icon');

        icon1.src = path.join(__dirname, "img", "controls", 'button-square.png');

        icon1.alt = 'F Key';

        // Create the second icon (G key)
        const icon2 = document.createElement('img');
        icon2.classList.add('fetch-icon');
        icon2.src = path.join(__dirname, "img", "controls", 'key-f.png');
        icon2.alt = 'G Key';

        // Create the label
        const label = document.createElement('span');
        label.classList.add('fetch-label');
        label.textContent = "Fetch";

        // Append elements to the button
        fetchCoverButton.appendChild(icon1);
        fetchCoverButton.appendChild(icon2);
        fetchCoverButton.appendChild(label);

        fetchCoverButton.addEventListener('click', async (event) => {


            const parentContainer = event.target.parentElement;

            const img = fetchCoverButton.previousElementSibling;

            fetchCoverButton.classList.add('rotate');

            event.stopPropagation();
            const gameName = event.target.getAttribute('data-game');
            const platform = event.target.getAttribute('data-platform');

            const isBatch = false;

            await window.coverDownloader.searchGame(gameName, platform)
                .then((details) => {

                    if (!isBatch) {
                        window.control.showCoversDialog(details.imgSrcArray, gameName, platform, img);
                    } else {
                        return window.control.downloadAndReload(details.imgSrcArray[0], gameName, platform, img);
                    }
                })
                .catch((error) => {
                    console.info('Error (probably image not found):', error.message);
                })
                .finally(() => {
                    console.log("finally: ");
                    // window.control.initGalleryNav(galleryContainer);
                    gameContainer.focus();
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
