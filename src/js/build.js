function buildGameMenu(gameName, image) {
    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('page-content');
    gameMenuContainer.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    const currentImageContainer = document.createElement('div');
    currentImageContainer.classList.add('menu-game-container', 'current-image');
    currentImageContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

    const currentImage = document.createElement('img');
    currentImage.src = image.src;
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
    dummyGameContainer.textContent = 'Searching...';

    gameMenuContainer.appendChild(dummyGameContainer);

    return gameMenuContainer;
}

async function populateGameMenu(gameMenuContainer, gameName) {
    const dummyGameContainer = gameMenuContainer.querySelector('.dummy-game-container');

    ipcRenderer.send('fetch-images', gameName, LB.steamGridKey);

    ipcRenderer.once('image-urls', (event, urls) => {
        if (urls.length === 0) {
            dummyGameContainer.innerHTML = `No cover art found for <br><strong>${gameName}</strong>.`;
        } else {
            gameMenuContainer.removeChild(dummyGameContainer);
        }

        urls.forEach((url) => {
            const gameContainer = document.createElement('div');
            gameContainer.classList.add('menu-game-container');
            gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

            const img = document.createElement('img');
            img.src = url;
            img.title = 'Click to save';
            img.classList.add('game-image');
            gameContainer.appendChild(img);
            gameMenuContainer.appendChild(gameContainer);
        });
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
        // radiosContainer.style.display = 'flex';
        // radiosContainer.style.gap = '20px';
        // radiosContainer.style.alignItems = 'center';

        types.forEach(type => {

            const label = document.createElement('label');
            // label.style.display = 'flex';
            // label.style.alignItems = 'center';
            // label.style.gap = '6px';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = name;
            radio.value = type;
            radio.checked = type === value;

            const radioBox = document.createElement('div');
            radioBox.classList.add('radio-box');
            radioBox.textContent = type;

            radios.push(radio);

            // radio.style.margin = '0';
            // radio.style.accentColor = 'var(--color-accent)';

            const text = document.createTextNode(type.charAt(0).toUpperCase() + type.slice(1));

            radio.addEventListener('change', () => {
                console.log("change!: ");
                if (radio.checked && onChangeFct) onChangeFct(type);
            });

            label.appendChild(radio);
            label.appendChild(radioBox);
            // label.appendChild(text);
            radiosContainer.appendChild(label);

        });

        inputCtn.appendChild(radiosContainer);

        input = inputCtn;

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
    platformMenuImage.src = path.join(LB.baseDir, 'img', 'emulsion.png');
    platformMenuImage.width = '250';
    platformMenuImageCtn.appendChild(platformMenuImage);

    // Rows
    const numberOfColumns = _buildPrefsFormItem('numberOfColumns', 'th', 'number', 'The number of columns in each platform gallery', 'Number of columns', LB.galleryNumOfCols);
    const numberOfColumnsGroup = numberOfColumns.group;
    const numberOfColumnsInput = numberOfColumns.input;

    const footerSize = _buildPrefsFormItem('footerSize', 'arrows', ['small', 'medium', 'big'], '', 'Footer menu size', LB.footerSize, LB.control.setFooterSize);
    const footerSizeGroup = footerSize.group;
    const footerSizeRadios = footerSize.radios;

    const homeMenuTheme = _buildPrefsFormItem('homeMenuTheme', 'arrows-h', ['flat', '3D'], '', 'Home menu style', LB.homeMenuTheme);
    const homeMenuThemeGroup = homeMenuTheme.group;
    const homeMenuThemeRadios = homeMenuTheme.radios;

    console.log("LB.disabledPlatformsPolicy: ", LB.disabledPlatformsPolicy);

    const disabledPlatformsPolicy = _buildPrefsFormItem('disabledPlatformsPolicy', 'check-square-o', ['show', 'hide'], '', 'Disabled Platforms', LB.disabledPlatformsPolicy);
    const disabledPlatformsPolicyGroup = disabledPlatformsPolicy.group;
    const disabledPlatformsPolicyRadios = disabledPlatformsPolicy.radios;

    const steamGridKey = _buildPrefsFormItem('steamGridKey', 'cog', 'text', 'Your SteamGrid API Key', 'SteamGrid API Key', LB.steamGridKey || '');
    const steamGridKeyGroup = steamGridKey.group;
    const steamGridKeyInput = steamGridKey.input;

    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(numberOfColumnsGroup);
    formContainer.appendChild(homeMenuThemeGroup);
    formContainer.appendChild(footerSizeGroup);
    formContainer.appendChild(disabledPlatformsPolicyGroup);
    formContainer.appendChild(steamGridKeyGroup);

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

    cancelButton.addEventListener('click', _cancelButtonClick);

    aboutButton.addEventListener('click', () => {
        ipcRenderer.invoke('go-to-url', 'https://yphil.gitlab.io/ext/emulsion.html?v=' + LB.versionNumber);
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
            await LB.prefs.save('settings', 'numberOfColumns', parseInt(numberOfColumnsInput.value, 10));
            await LB.prefs.save('settings', 'footerSize', footerSizeRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'homeMenuTheme', homeMenuThemeRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'disabledPlatformsPolicy', disabledPlatformsPolicyRadios.find(radio => radio.checked)?.value);
            await LB.prefs.save('settings', 'steamGridKey', steamGridKeyInput.value);
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
    statusLabelPlatormName.innerHTML = `${LB.utils.getPlatformName(platformName)} is&nbsp;`;

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

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('is-info', 'button');
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
    formContainer.appendChild(emulatorArgsGroup);
    formContainer.appendChild(cancelButton);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
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

        statusLabelPlatormStatus.classList.remove('on', 'off');

        gamesDirSubLabel.textContent = '';
        emulatorSubLabel.textContent = '';

        if (!gamesDirInput.value) {
            gamesDirSubLabel.textContent = 'This field cannot be empty';
        }


        if (!emulatorInput.value) {
            emulatorSubLabel.textContent = 'This field cannot be empty';
        }

        if (isNotEnablable) {
            event.preventDefault(); // Prevent the default behavior
            statusCheckBox.checked = !statusCheckBox.checked; // Revert the checkbox state
            console.log("Checkbox state change prevented.");
            // platformText.textContent = 'Please provide both a games directory and an emulator.';
        } else {
            statusLabelPlatormStatus.textContent = statusCheckBox.checked ? 'On' : 'Off';
            statusLabelPlatormStatus.classList.add(statusCheckBox.checked ? 'on' : 'off');

        }
    });


    cancelButton.addEventListener('click', _cancelButtonClick);
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

        try {
            await LB.prefs.save(platformName, 'isEnabled', statusCheckBox.checked);
            await LB.prefs.save(platformName, 'gamesDir', gamesDirInput.value);
            await LB.prefs.save(platformName, 'emulator', emulatorInput.value);
            await LB.prefs.save(platformName, 'emulatorArgs', emulatorArgsInput.value);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    formContainer.appendChild(formContainerButtons);

    return formContainer;
}

LB.build = {
    populateGameMenu: populateGameMenu,
    gameMenu: buildGameMenu,
    platformForm: buildPlatformForm
};
