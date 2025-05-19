function buildHomeSlide(platformName, preferences) {

    console.log("buildHomeSlide: ");

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platformName;
    const platformImgPath = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    const bgImageUrl = `url("file://${platformImgPath.replace(/\\/g, '/')}")`;

    slide.style.backgroundImage = bgImageUrl;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";
    const platformInfo = LB.utils.getPlatformInfo(platformName);
    slideContent.innerHTML = `<p class="vendor">${platformInfo.vendor}</p> <p class="name">${platformInfo.name}</p>`;

    slide.setAttribute('data-platform', platformName);

    slide.appendChild(slideContent);

    if (platformName === 'recents') {
        slide.setAttribute('data-index', LB.totalNumberOfPlatforms);
        return slide;
    }

    if (platformName !== 'settings') {
        if (LB.disabledPlatformsPolicy === 'hide' && !preferences[platformName].isEnabled) {
            return null;
        }
    }

    if (LB.kidsMode && platformName === 'settings') {
        return null;
    }

    slide.setAttribute('data-index', preferences[platformName].index);
    slide.setAttribute('data-is-enabled', preferences[platformName].isEnabled);

    return slide;
}


function buildGameMenu(gameName, image) {
    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('page-content');
    gameMenuContainer.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const currentImageContainer = document.createElement('div');
    currentImageContainer.classList.add('menu-game-container', 'current-image');
    currentImageContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

    const currentImage = document.createElement('img');
    currentImage.src = image.src;
    currentImage.className = 'current-image';
    currentImage.alt = 'Current game image';

    const gameLabel = document.createElement('div');
    gameLabel.classList.add('game-label');
    gameLabel.textContent = 'Current Image';

    currentImageContainer.appendChild(gameLabel);
    currentImageContainer.appendChild(currentImage);
    gameMenuContainer.appendChild(currentImageContainer);

    const dummyGameContainer = document.createElement('div');
    dummyGameContainer.classList.add('menu-game-container', 'dummy-game-container');
    dummyGameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
    dummyGameContainer.innerHTML = `Searching for <strong>${gameName}<strong>...`;

    gameMenuContainer.appendChild(dummyGameContainer);

    return gameMenuContainer;
}

async function populateGameMenu(gameMenuContainer, gameName, platformName) {
    const infoGameContainer = gameMenuContainer.querySelector('.dummy-game-container');

    const currentImageGameContainer = gameMenuContainer.querySelector('.current-image');

    ipcRenderer.send('fetch-images', gameName, platformName, LB.steamGridAPIKey, LB.giantBombAPIKey);

    ipcRenderer.once('image-urls', (event, urls) => {

        if (urls.length === 0) {

            const manualImgSelectButton = document.createElement('button');
            manualImgSelectButton.classList.add('button');
            manualImgSelectButton.textContent = 'Select image';

            manualImgSelectButton.addEventListener('click', async e => {
                e.stopPropagation();

                // open image picker (main will filter to images)
                const srcPath = await ipcRenderer.invoke('pick-image');
                if (!srcPath) return; // user cancelled

                const destPath = path.join(LB.userDataPath, 'covers', platformName, `${gameName}.jpg`);

                currentImageGameContainer.src = destPath;

                console.log("destPath: ", destPath);

                const ok = await ipcRenderer.invoke('save-cover', srcPath, destPath);
                console.log(ok ? `Cover saved to ${destPath}` : 'Failed to save cover');
            });

            // Clear the container first
            infoGameContainer.textContent = '';

            // <p><i class="fa fa‑binoculars fa-5x" aria-hidden="true"></i></p>
            const pIcon   = document.createElement('p');
            const icon    = document.createElement('i');
            icon.className = 'fa fa-binoculars fa-5x';
            icon.setAttribute('aria-hidden', 'true');
            pIcon.appendChild(icon);

            // <p>No cover art found for</p>
            const pMsg = document.createElement('p');
            pMsg.textContent = 'No cover art found for';

            // <p><code>${gameName}</code></p>
            const pCode = document.createElement('p');
            const code  = document.createElement('code');
            code.textContent = gameName;
            pCode.appendChild(code);

            // append everything to the container
            infoGameContainer.appendChild(pIcon);
            infoGameContainer.appendChild(pMsg);
            infoGameContainer.appendChild(pCode);
            infoGameContainer.appendChild(manualImgSelectButton);

            infoGameContainer.style.gridColumn = `2 / calc(${LB.galleryNumOfCols} + 1)`;

            infoGameContainer.style.animation = 'unset';
        } else {
            gameMenuContainer.removeChild(infoGameContainer);

            urls.forEach(({ url, source }) => {

                const img = new Image();
                img.src = url;
                img.title = `${gameName}\n\n- Found on ${source}\n- Click to download and save`;
                img.classList.add('game-image');
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease-in';

                const gameContainer = document.createElement('div');
                gameContainer.classList.add('menu-game-container');
                gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
                gameContainer.appendChild(img);

                gameMenuContainer.appendChild(gameContainer);

                img.onload = () => {
                    requestAnimationFrame(() => {
                        img.style.opacity = '1';
                    });
                };

                img.onerror = () => {
                    console.warn('Failed to load image:', url);
                };
            });
        }
    });
}

function _buildPrefsFormItem(name, iconName, type, description, shortDescription, value, onChangeFct) {

    let input;
    const group = document.createElement('div');

    const radios = [];

    if (typeof type === 'object') {
        const types = type;

        const inputCtn = document.createElement('div');
        inputCtn.classList.add('input-ctn');

        const radiosContainer = document.createElement('div');
        radiosContainer.classList.add('radio-container');

        types.forEach((type, index) => {

            const label = document.createElement('label');

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = type;
            radio.checked = type === value;

            const radioBox = document.createElement('div');
            radioBox.classList.add('radio-box');
            radioBox.textContent = type;

            if (index === types.length - 1) {
                radioBox.classList.add('last');
            }

            radios.push(radio);

            const text = document.createTextNode(type.charAt(0).toUpperCase() + type.slice(1));

            radio.addEventListener('change', () => {
                console.log("change!: ");
                if (radio.checked && onChangeFct) onChangeFct(type);
            });

            label.appendChild(radio);
            label.appendChild(radioBox);
            radiosContainer.appendChild(label);

        });

        inputCtn.appendChild(radiosContainer);

        input = inputCtn;

    } else if (type === 'menu') {

    } else {

        input = document.createElement('input');
        input.type = type;
        input.id = name;
        input.name = name;
        input.min = '2';
        input.max = '12';
        input.placeholder = description;

        input.classList.add('input');
        input.value = value;

    }

    const icon = document.createElement('div');
    icon.classList.add('form-icon');
    icon.innerHTML = `<i class="form-icon fa fa-2x fa-${iconName}" aria-hidden="true"></i>`;

    const label = document.createElement('label');
    label.textContent = shortDescription;

    const SubLabel = document.createElement('label');
    SubLabel.id = 'num-cols-sub-label';
    SubLabel.classList.add('sub-label');

    const ctn = document.createElement('div');
    ctn.classList.add('dual-ctn');

    ctn.appendChild(icon);
    ctn.appendChild(input);

    group.appendChild(label);
    group.appendChild(ctn);

    return { group, input, radios };
}

function _buildPrefsForm() {

    // Image
    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');
    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = path.join(LB.baseDir, 'img', 'platforms', `settings.png`);
    platformMenuImage.title = `Emulsion version ${LB.versionNumber}`;

    platformMenuImage.width = '250';
    platformMenuImageCtn.appendChild(platformMenuImage);

    // Rows
    const numberOfColumns = _buildPrefsFormItem('numberOfColumns', 'th', 'number', 'The number of columns in each platform gallery', 'Number of columns', LB.galleryNumOfCols);
    const numberOfColumnsGroup = numberOfColumns.group;
    const numberOfColumnsInput = numberOfColumns.input;

    const footerSize = _buildPrefsFormItem('footerSize', 'arrows', ['small', 'medium', 'big'], '', 'Footer menu size', LB.footerSize, LB.utils.setFooterSize);
    const footerSizeGroup = footerSize.group;
    const footerSizeRadios = footerSize.radios;

    const homeMenuTheme = _buildPrefsFormItem('homeMenuTheme', 'arrows-h', ['flat', '3D'], '', 'Home menu style', LB.homeMenuTheme);
    const homeMenuThemeGroup = homeMenuTheme.group;
    const homeMenuThemeRadios = homeMenuTheme.radios;

    const theme = _buildPrefsFormItem('theme', 'eyedropper', ['default', 'day', 'night'], '', 'Emulsion Theme', LB.theme, LB.utils.applyTheme);
    const themeGroup = theme.group;
    const themeRadios = theme.radios;

    const disabledPlatformsPolicy = _buildPrefsFormItem('disabledPlatformsPolicy', 'check-square-o', ['show', 'hide'], '', 'Disabled Platforms', LB.disabledPlatformsPolicy);
    const disabledPlatformsPolicyGroup = disabledPlatformsPolicy.group;
    const disabledPlatformsPolicyRadios = disabledPlatformsPolicy.radios;

    const recentlyPlayedPolicy = _buildPrefsFormItem('recentlyPlayedPolicy', 'clock-o', ['show', 'hide'], '', 'Recently Played', LB.recentlyPlayedPolicy);
    const recentlyPlayedPolicyGroup = recentlyPlayedPolicy.group;
    const recentlyPlayedPolicyRadios = recentlyPlayedPolicy.radios;

    const steamGridAPIKey = _buildPrefsFormItem('steamGridAPIKey', 'steam-square', 'text', 'Your SteamGrid API Key', 'SteamGrid API Key', LB.steamGridAPIKey || '');
    const steamGridAPIKeyGroup = steamGridAPIKey.group;
    const steamGridAPIKeyInput = steamGridAPIKey.input;

    const giantBombAPIKey = _buildPrefsFormItem('giantBombAPIKey', 'bomb', 'text', 'Your GiantBomb API Key', 'GiantBomb API Key', LB.giantBombAPIKey || '');
    const giantBombAPIKeyGroup = giantBombAPIKey.group;
    const giantBombAPIKeyInput = giantBombAPIKey.input;

    // formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(numberOfColumnsGroup);
    formContainer.appendChild(homeMenuThemeGroup);
    formContainer.appendChild(themeGroup);
    formContainer.appendChild(footerSizeGroup);
    formContainer.appendChild(disabledPlatformsPolicyGroup);
    formContainer.appendChild(recentlyPlayedPolicyGroup);
    formContainer.appendChild(steamGridAPIKeyGroup);
    formContainer.appendChild(giantBombAPIKeyGroup);

    // Buttons
    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button');
    saveButton.textContent = 'Save';

    const aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = 'button';
    aboutButton.textContent = 'About';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('is-info', 'button');
    cancelButton.textContent = 'Cancel';

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(aboutButton);
    formContainerButtons.appendChild(saveButton);

    formContainer.appendChild(formContainerButtons);

    const formContainerVSpacerDiv = document.createElement('div');
    formContainerVSpacerDiv.classList.add('spacer-div');

    formContainer.appendChild(formContainerVSpacerDiv);

    cancelButton.addEventListener('click', _cancelButtonClick);

    aboutButton.addEventListener('click', () => {
        ipcRenderer.invoke('open-about-window');
    });

    saveButton.addEventListener('click', _saveButtonClick);

    function _cancelButtonClick(event) {

        const escapeKeyEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            code: 'Escape', // The physical key on the keyboard
            which: 27,     // Same as keyCode
            bubbles: true
        });

        document.dispatchEvent(escapeKeyEvent);
    }

    async function _saveButtonClick() {
        try {
            let numberOfColumns = parseInt(numberOfColumnsInput.value, 10);

            if (numberOfColumns < 2) {
                numberOfColumns = 2;
            } else if (numberOfColumns > 12) {
                numberOfColumns = 12;
            }

            await LB.prefs.save('settings', 'numberOfColumns', numberOfColumns);
            await LB.prefs.save('settings', 'footerSize', footerSizeRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'homeMenuTheme', homeMenuThemeRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'theme', themeRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'disabledPlatformsPolicy', disabledPlatformsPolicyRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'recentlyPlayedPolicy', recentlyPlayedPolicyRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'steamGridAPIKey', steamGridAPIKeyInput.value);
            await LB.prefs.save('settings', 'giantBombAPIKey', giantBombAPIKeyInput.value);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    return formContainer;
}

function buildPlatformForm(platformName) {

    if (platformName === 'settings') {
        return _buildPrefsForm();
    }

    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    platformMenuImage.width = '250';

    platformMenuImageCtn.appendChild(platformMenuImage);

    const statusCheckBox = document.createElement('input');
    statusCheckBox.type = 'checkbox';
    statusCheckBox.id = 'input-platform-toggle-checkbox';
    statusCheckBox.classList.add('checkbox');

    const statusLabel = document.createElement('label');
    statusLabel.classList.add('checkbox');
    statusLabel.id = 'form-status-label';

    const statusLabelPlatormName = document.createElement('span');
    statusLabelPlatormName.id = 'form-status-label-platform-name';

    const platformInfo = LB.utils.getPlatformInfo(platformName);

    statusLabelPlatormName.innerHTML = `${platformInfo.name} is&nbsp;`;

    const statusLabelPlatormStatus = document.createElement('span');
    statusLabelPlatormStatus.id = 'form-status-label-platform-status';

    statusLabel.appendChild(statusCheckBox);
    statusLabel.appendChild(statusLabelPlatormName);
    statusLabel.appendChild(statusLabelPlatormStatus);

    const gamesDirGroup = document.createElement('div');

    const gamesDirInput = document.createElement('input');
    gamesDirInput.type = 'text';
    gamesDirInput.classList.add('input');
    gamesDirInput.placeholder = 'Your games directory';

    const gamesDirLabel = document.createElement('label');
    gamesDirLabel.textContent = 'Games directory';

    const gamesDirSubLabel = document.createElement('label');
    gamesDirSubLabel.id = 'games-dir-sub-label';
    gamesDirSubLabel.classList.add('sub-label');

    const gamesDirButton = document.createElement('button');
    gamesDirButton.classList.add('button', 'button-browse', 'info');
    gamesDirButton.textContent = 'Browse';

    const gamesDirCtn = document.createElement('div');
    gamesDirCtn.classList.add('dual-ctn');

    const gamesDirIcon = document.createElement('div');
    gamesDirIcon.classList.add('form-icon');
    gamesDirIcon.innerHTML = '<i class="form-icon fa fa-2x fa-folder-open-o" aria-hidden="true"></i>';

    gamesDirCtn.appendChild(gamesDirIcon);
    gamesDirCtn.appendChild(gamesDirInput);
    gamesDirCtn.appendChild(gamesDirButton);

    gamesDirGroup.appendChild(gamesDirLabel);
    gamesDirGroup.appendChild(gamesDirCtn);
    gamesDirGroup.appendChild(gamesDirSubLabel);

    const emulatorGroup = document.createElement('div');

    const emulatorIcon = document.createElement('div');
    emulatorIcon.classList.add('form-icon');
    emulatorIcon.innerHTML = '<i class="form-icon fa fa-2x fa-gamepad" aria-hidden="true"></i>';

    const emulatorInputLabel = document.createElement('label');
    emulatorInputLabel.textContent = "Emulator";

    const emulatorSubLabel = document.createElement('label');
    emulatorSubLabel.id = 'emulator-sub-label';
    emulatorSubLabel.classList.add('sub-label');

    const emulatorInput = document.createElement('input');
    emulatorInput.type = 'text';
    emulatorInput.classList.add('input');
    emulatorInput.placeholder = 'Your emulator';

    const emulatorCtn = document.createElement('div');
    emulatorCtn.classList.add('dual-ctn');

    const emulatorButton = document.createElement('button');
    emulatorButton.classList.add('button', 'button-browse');
    emulatorButton.textContent = 'Browse';

    emulatorCtn.appendChild(emulatorIcon);
    emulatorCtn.appendChild(emulatorInput);
    emulatorCtn.appendChild(emulatorButton);

    emulatorGroup.appendChild(emulatorInputLabel);
    emulatorGroup.appendChild(emulatorCtn);
    emulatorGroup.appendChild(emulatorSubLabel);

    // ======== NEW EXTENSIONS SECTION ========
    const extensionsGroup = document.createElement('div');
    const extensionsLabel = document.createElement('label');
    extensionsLabel.textContent = 'File Extensions';

    const extensionsCtn = document.createElement('div');
    extensionsCtn.classList.add('dual-ctn');

    const extensionsIcon = document.createElement('div');
    extensionsIcon.classList.add('form-icon');
    extensionsIcon.innerHTML = '<i class="form-icon fa fa-2x fa-file-archive-o" aria-hidden="true"></i>';

    const extensionsInputsContainer = document.createElement('div');
    extensionsInputsContainer.classList.add('extensions-inputs-container');

    // Load existing extensions
    LB.prefs.getValue(platformName, 'extensions')
        .then(extensions => {
            const initialExtensions = extensions || ['.iso'];
            initialExtensions.forEach((ext, index) => {
                const inputRow = _createExtensionInputRow(ext, index === 0);
                extensionsInputsContainer.appendChild(inputRow);
            });
        })
        .catch(console.error);

    // Add button for new extensions
    const addExtensionBtn = document.createElement('button');
    addExtensionBtn.classList.add('button', 'small');
    addExtensionBtn.innerHTML = '<i class="form-icon emulator-args-icon fa fa-plus" aria-hidden="true"></i>';
    addExtensionBtn.addEventListener('click', () => {
        extensionsInputsContainer.appendChild(_createExtensionInputRow('', false));
    });

    extensionsCtn.appendChild(extensionsIcon);
    extensionsCtn.appendChild(extensionsInputsContainer);
    extensionsInputsContainer.appendChild(addExtensionBtn);

    extensionsGroup.appendChild(extensionsLabel);
    extensionsGroup.appendChild(extensionsCtn);
    // ======== END EXTENSIONS SECTION ========

    const emulatorArgsGroup = document.createElement('div');

    const emulatorArgsCtn = document.createElement('div');
    emulatorArgsCtn.classList.add('dual-ctn');

    const emulatorArgsIcon = document.createElement('div');
    emulatorArgsIcon.classList.add('form-icon');
    emulatorArgsIcon.innerHTML = '<i class="form-icon emulator-args-icon fa fa-2x fa-rocket" aria-hidden="true"></i>';

    const emulatorArgsLabel = document.createElement('label');
    emulatorArgsLabel.textContent = 'Emulator Arguments';

    const emulatorArgsInput = document.createElement('input');
    emulatorArgsInput.classList.add('input');
    emulatorArgsInput.type = 'text';
    emulatorArgsInput.placeholder = 'Your emulator arguments';

    emulatorArgsCtn.appendChild(emulatorArgsIcon);
    emulatorArgsCtn.appendChild(emulatorArgsInput);
    emulatorArgsGroup.appendChild(emulatorArgsLabel);
    emulatorArgsGroup.appendChild(emulatorArgsCtn);

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button');
    saveButton.textContent = 'Save';

    const helpButton = document.createElement('button');
    helpButton.type = 'button';
    helpButton.classList.add('button');
    helpButton.textContent = 'Help';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('button');
    cancelButton.textContent = 'Cancel';

    LB.prefs.getValue(platformName, 'gamesDir')
        .then((value) => {
            gamesDirInput.value = value;
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });

    LB.prefs.getValue(platformName, 'emulator')
        .then((value) => {
            emulatorInput.value = value;
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });

    LB.prefs.getValue(platformName, 'emulatorArgs')
        .then((value) => {
            emulatorArgsInput.value = value;
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });


    gamesDirButton.addEventListener('click', _gamesDirButtonClick);
    emulatorButton.addEventListener('click', _emulatorButtonClick);

    async function _gamesDirButtonClick(event) {
        event.stopPropagation();
        const selectedPath = await ipcRenderer.invoke('select-file-or-directory', 'openDirectory');
        if (selectedPath) {
            gamesDirInput.value = selectedPath;
        }
    }

    async function _emulatorButtonClick(event) {
        event.stopPropagation();
        const selectedPath = await ipcRenderer.invoke('select-file-or-directory', 'openFile');
        if (selectedPath) {
            emulatorInput.value = selectedPath;
        }
    }

    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(statusLabel);
    formContainer.appendChild(gamesDirGroup);
    formContainer.appendChild(emulatorGroup);
    formContainer.appendChild(extensionsGroup);  // <-- New addition
    formContainer.appendChild(emulatorArgsGroup);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(helpButton);
    formContainerButtons.appendChild(saveButton);

    LB.prefs.getValue(platformName, 'isEnabled')
        .then((value) => {
            statusCheckBox.checked = value;
            statusLabelPlatormStatus.textContent = value ? 'On' : 'Off';
            statusLabelPlatormStatus.classList.add(value ? 'on' : 'off');
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });

    statusCheckBox.addEventListener('change', (event) => {
        console.log("event: ", event);
        const isNotEnablable = !gamesDirInput.value || !emulatorInput.value;
        const isEnabling = statusCheckBox.checked;

        statusLabelPlatormStatus.classList.remove('on', 'off');

        gamesDirSubLabel.textContent = '';
        emulatorSubLabel.textContent = '';

        if (isEnabling) {
            if (!gamesDirInput.value) {
                gamesDirSubLabel.textContent = 'Please enter a game directory';
            }
            if (!emulatorInput.value) {
                emulatorSubLabel.textContent = 'Please enter an emulator (name or path)';
            }
        }

        if (isEnabling && isNotEnablable) {
            event.preventDefault();
            statusCheckBox.checked = false;
            console.log("Cannot enable platform - missing requirements");
        }
        else {
            statusLabelPlatormStatus.textContent = statusCheckBox.checked ? 'On' : 'Off';
            statusLabelPlatormStatus.classList.add(statusCheckBox.checked ? 'on' : 'off');
        }
    });

    cancelButton.addEventListener('click', _cancelButtonClick);

    helpButton.addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://gitlab.com/yphil/emulsion/-/blob/master/README.md#usage');
    });

    saveButton.addEventListener('click', _saveButtonClick);

    function _cancelButtonClick(event) {

        const escapeKeyEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            code: 'Escape', // The physical key on the keyboard
            which: 27,     // Same as keyCode
            bubbles: true
        });

        document.dispatchEvent(escapeKeyEvent);
    }

    async function _saveButtonClick(event) {

        if (!gamesDirInput.value) {
            gamesDirSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        gamesDirSubLabel.textContent = '';

        if (!emulatorInput.value) {
            emulatorSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        emulatorSubLabel.textContent = '';

        // Process extensions
        const extensions = Array.from(extensionsInputsContainer.querySelectorAll('input'))
              .map(input => {
                  let val = input.value.trim().toLowerCase();
                  if (!val.startsWith('.')) val = '.' + val;
                  return val.replace(/[^a-z0-9.]/gi, '');
              })
              .filter(ext => ext.length > 1);  // Filter out empty/. only

        try {
            await LB.prefs.save(platformName, 'isEnabled', statusCheckBox.checked);
            await LB.prefs.save(platformName, 'gamesDir', gamesDirInput.value);
            await LB.prefs.save(platformName, 'emulator', emulatorInput.value);
            await LB.prefs.save(platformName, 'extensions', extensions);
            await LB.prefs.save(platformName, 'emulatorArgs', emulatorArgsInput.value);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

        // EXTENSION INPUT ROW CREATOR
    function _createExtensionInputRow(value, isFirst) {
        const row = document.createElement('div');
        row.classList.add('extension-input-row');

        const input = document.createElement('input');
        input.type = 'text';
        input.value = value;
        input.placeholder = '.ext';
        input.classList.add('input', 'small');

        // Auto-format on blur
        input.addEventListener('blur', () => {
            let val = input.value.trim().toLowerCase();
            if (!val.startsWith('.')) val = '.' + val;
            input.value = val.replace(/[^a-z0-9.]/gi, '');
        });

        if (!isFirst) {
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('button', 'small', 'danger');
            removeBtn.innerHTML = '<i class="form-icon emulator-args-icon fa fa-remove" aria-hidden="true"></i>';
            removeBtn.addEventListener('click', () => row.remove());
            row.appendChild(removeBtn);
        }

        row.appendChild(input);
        return row;
    }

    formContainer.appendChild(formContainerButtons);

    return formContainer;
}

LB.build = {
    homeSlide: buildHomeSlide,
    gameMenu: buildGameMenu,
    platformForm: buildPlatformForm,
    populateGameMenu: populateGameMenu
};
