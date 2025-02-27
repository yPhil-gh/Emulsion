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
                    const prefString = localStorage.getItem(platform.name);
                    let prefs;

                    document.getElementById('loading-platform').textContent = platform.name;

                    if (prefString) {
                        prefs = JSON.parse(prefString);
                        let gamesDir = prefs.gamesDir;
                        let emulator = prefs.emulator;
                        let emulatorArgs = prefs.emulatorArgs;

                        const thisGallery = buildGallery(platform.name, gamesDir, emulator, emulatorArgs, userDataPath.userDataPath);
                        thisGallery.style.display = "none";

                        // Append the gallery to the container
                        galleriesContainer.appendChild(thisGallery);
                    } else {
                        console.log("No prefs for ", platform.name);
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
            if (platform.name !== "settings") {
                const form = buildSettingsForm(platform, formTemplate);
                settingsGallery.appendChild(form);
            }
        });

        settingsGallery.style.display = "none";

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


function capitalizeWord(word) {
    switch (word) {
    case 'snes':
        return "SNES";
        break;
    case 'pcengine':
        return "PCEngine";
        break;
    default:
        break;
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function buildSettingsForm(platform, formTemplate) {

    const platformName = platform.name;
    const platformDetails = platform.details;

    const prefString = localStorage.getItem(platformName);

    let prefs;

    if (prefString) {
        prefs = JSON.parse(prefString);
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
    form.id = `${platformName}-form-container`;

    // form.querySelector("#details-button").addEventListener("click", function (event) {
    //     event.stopPropagation();
    //     const dialog = document.getElementById("details-dialog");

    //     dialog.querySelector("#details-dialog-title").textContent = capitalizeWord(platformName);
    //     dialog.querySelector("#details-dialog-text").innerHTML = platformDetails;

    //     const links = dialog.querySelectorAll("a");

    //     links.forEach((link) => {
    //         console.log("link: ", link);
    //         link.addEventListener("click", (event) => {
    //             ipcRenderer.invoke('go-to-url', { url: event.target.dataset.href });
    //         });
    //     });

    //     dialog.querySelector("#details-dialog-ok-button").addEventListener("click", function (event) {
    //         event.stopPropagation();
    //         dialog.style.display = "none";
    //         window.control.initSettingsNav();
    //     });

    //     dialog.style.display = "block";

    //     function onKeyDown (event) {
    //         event.stopImmediatePropagation(); // Stop other listeners on document
    //         console.log("event!! ", event);
    //         if (event.key === 'Escape') {
    //             dialog.style.display = "none";
    //             window.control.initSettingsNav();
    //         }
    //     }

    //     document.addEventListener('keydown', onKeyDown);

    // });

    // Row 3: Checkbox, Emulator Args
    // const enableArgsCheckbox = form.getElementById('enable-args'); // Enable args checkbox
    const iconDiv = form.querySelector('#platform-icon');
    const icon = document.createElement("img");

    const formLabel = form.querySelector('#form-label');
    formLabel.textContent = capitalizeWord(platformName);

    icon.src = `img/platforms/${platformName}.png`; // Update the image source
    icon.alt = `${platformName} Icon`; // Update the alt text

    icon.className = `platform-form-icon`; // Update the alt text

    iconDiv.appendChild(icon);

    const platformForm = form.querySelector('#platform-form');
    platformForm.id = `${platformName}-form`;

    platformForm.querySelector("#details-text-div").innerHTML = platformDetails;

    const gamesDirInput = form.querySelector('#games-dir');
    gamesDirInput.id = `${platformName}-games-dir`;
    gamesDirInput.value = (prefs && prefs.gamesDir) ? prefs.gamesDir : "";

    gamesDirInput.placeholder = `${capitalizeWord(platformName)} Games Directory`;

    const browseDirButton = form.querySelector('.browse-button-dir');
    browseDirButton.setAttribute('data-platform', platformName);
    browseDirButton.setAttribute('data-input', `${platformName}-games-dir`);

    browseDirButton.addEventListener('click', browse);

    const emulatorInput = form.querySelector('#emulator');
    emulatorInput.id = `${platformName}-emulator`;
    emulatorInput.value = (prefs && prefs.emulator) ?  prefs.emulator : "";

    emulatorInput.placeholder = `${platformName} Emulator`;

    const emulatorArgsInput = form.querySelector('#emulator-args');
    emulatorArgsInput.id = `${platformName}-emulator-args`;
    emulatorArgsInput.classList.add('emulator-args');
    emulatorArgsInput.value = (prefs && prefs.emulatorArgs) ? prefs.emulatorArgs : "";
    emulatorArgsInput.placeholder = `args`;

    const browseEmulatorButton = form.querySelector('.browse-button-file');
    browseEmulatorButton.setAttribute('data-platform', platformName);
    browseEmulatorButton.setAttribute('data-input', `${platformName}-emulator`);

    browseEmulatorButton.addEventListener('click', browse);

    const saveButton = form.querySelector('.save-button');
    saveButton.setAttribute('data-platform', platformName);

    const toggleCheckbox = form.querySelector('#platform-toggle');
    toggleCheckbox.checked = window.control.isEnabled(platformName);

    saveButton.addEventListener('click', () => {
        const gamesDir = gamesDirInput.value;
        const emulator = emulatorInput.value;
        const emulatorArgs = emulatorArgsInput.value;

        if (!gamesDir || !emulator) {
            window.control.updateControlsMenu({
                message: "Please provide both a <strong>Games Directory</strong> and an <strong>Emulator</strong>."
            });
            return;
        }

        toggleCheckbox.checked = true;

        const preferences = { gamesDir, emulator, emulatorArgs };
        localStorage.setItem(platformName, JSON.stringify(preferences));

        window.control.updateControlsMenu({
            message: capitalizeWord(platformName) + "Preferences saved!"
        });

    });

    return form;
}

// Build the gallery for a specific platform
function buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath) {

    const galleryContainer = document.createElement('div');
    galleryContainer.id = `gallery-${platform}`;
    galleryContainer.classList.add('gallery');
    galleryContainer.tabindex = -1;

    const extensionsArrays = {
        gamecube:[".iso", ".ciso"],
        amiga:[".lha", ".adf"],
        pcengine:[".srm"],
        n64:[".z64"],
        snes:[".smc"],
        dreamcast:[".gdi", ".cdi"]
    };

    const extensions = extensionsArrays[platform];

    // Scan the platform games directory for valid files
    const gameFiles = scanDirectory(gamesDir, extensions, true);

    let i = 1;

    const imageFormats = ['jpg', 'png', 'webp'];

    function findImageFile(basePath, fileNameWithoutExt) {
        for (const format of imageFormats) {
            const imagePath = path.join(basePath, `${fileNameWithoutExt}.${format}`);
            if (fs.existsSync(imagePath)) {
                return imagePath;
            }
        }
        return null;
    }

    gameFiles.forEach(gameFile => {

        const fileName = path.basename(gameFile);

        document.getElementById('loading-platform').textContent = capitalizeWord(platform);
        document.getElementById('loading-game').textContent = i + " - " + fileName;

        const fileNameWithoutExt = path.parse(fileName).name;

        const coverImagePath = findImageFile(path.join(userDataPath, "covers", platform), fileNameWithoutExt);

        const missingImagePath = path.join(__dirname, "img", 'missing.png');
        const isImgExists = fs.existsSync(coverImagePath);

        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');
        gameContainer.setAttribute('data-command', `${emulator} ${emulatorArgs || ""} "${gameFile}"`);
        gameContainer.setAttribute('data-index', i++);

        if (!isImgExists) {
            gameContainer.classList.add('image-missing');
        }
        gameContainer.tabindex = -1;

        gameContainer.addEventListener('click', (event) => {
            event.stopPropagation();
            ipcRenderer.send('run-command', event.target.dataset.command);
        });

        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');

        const imgElement = document.createElement('img');
        imgElement.src = isImgExists ? coverImagePath : missingImagePath;
        imgElement.alt = fileNameWithoutExt;
        imgElement.title = fileNameWithoutExt;
        imgElement.classList.add('game-image');

        let debugClassName = fileNameWithoutExt.substring(0, 8);
        debugClassName = debugClassName.replace(/[^a-zA-Z]/g, '');
        if (debugClassName.length === 0) {
            debugClassName = 'default';
        }
        imgElement.classList.add(debugClassName);

        const nameElement = document.createElement('p');
        nameElement.textContent = `${fileNameWithoutExt}`;
        nameElement.classList.add('game-name');

        const fetchCoverButton = document.createElement('button');
        fetchCoverButton.classList.add('fetch-cover-button');
        fetchCoverButton.setAttribute('title', `Fetch cover for ${fileNameWithoutExt}`);
        fetchCoverButton.setAttribute('data-game', fileNameWithoutExt);
        fetchCoverButton.setAttribute('data-platform', platform);
        fetchCoverButton.setAttribute('data-image-status', fs.existsSync(coverImagePath) ? 'found' : 'missing');

        const icon1 = document.createElement('img');
        icon1.classList.add('fetch-icon');
        icon1.src = path.join(__dirname, "img", "controls", 'button-square.png');
        icon1.alt = 'F Key';

        const icon2 = document.createElement('img');
        icon2.classList.add('fetch-icon');
        icon2.src = path.join(__dirname, "img", "controls", 'key-f.png');
        icon2.alt = 'G Key';

        const label = document.createElement('span');
        label.classList.add('fetch-label');
        label.textContent = "Fetch";

        fetchCoverButton.appendChild(icon1);
        fetchCoverButton.appendChild(icon2);
        fetchCoverButton.appendChild(label);

        fetchCoverButton.addEventListener('click', async (event) => {

            event.stopPropagation();

            const parentContainer = event.target.parentElement;

            const img = parentContainer.querySelector("img");

            fetchCoverButton.classList.add('rotate');

            const gameName = event.target.getAttribute('data-game');
            const platform = event.target.getAttribute('data-platform');

            const isBatch = false;

            await window.coverDownloader.searchGame(gameName, platform)
                .then((details) => {

                    if (!isBatch) {
                        return window.control.showCoversDialog(details.imgSrcArray, gameName, platform, img);
                    } else {
                        return window.coverDownloader.downloadAndReload(details.imgSrcArray[0], gameName, platform, img);
                    }
                })
                .catch((error) => {
                    console.info('Error (probably image not found):', error.message);
                })
                .finally(() => {
                    console.log("finally: ");
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
