async function buildGameMenu(gameName, image) {
    return new Promise((resolve, reject) => {
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



        const spinner = document.createElement('div');
        spinner.classList.add(`spinner-${Math.floor(Math.random() * 9) + 1}`, 'spinner');

        document.body.appendChild(spinner);

        gameMenuContainer.appendChild(currentImageContainer);

        // Send a request to fetch images
        ipcRenderer.send('fetch-images', gameName, LB.steamGridAPIKey);

        // Use 'once' to ensure the event handler runs only one time
        ipcRenderer.once('image-urls', (event, urls) => {
            urls.forEach((url) => {
                const gameContainer = document.createElement('div');
                gameContainer.classList.add('menu-game-container');
                gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

                const img = document.createElement('img');
                img.src = url;
                img.alt = 'Game image from SteamGrid';
                img.classList.add('game-image');
                gameContainer.appendChild(img);
                gameMenuContainer.appendChild(gameContainer);
            });
            // At this point, all images have been added.
            resolve(gameMenuContainer);
        });
    });
}

function _buildPrefsForm() {

    const formContainer = document.createElement('div');
    formContainer.classList.add('platform-menu-container');

    const platformMenuImageCtn = document.createElement('div');
    platformMenuImageCtn.classList.add('platform-menu-image-ctn');
    const platformMenuImage = document.createElement('img');
    platformMenuImage.src = path.join(LB.baseDir, 'img', 'emulsion.png');
    platformMenuImage.width = '250';

    platformMenuImageCtn.appendChild(platformMenuImage);

    const numberOfColumnsGroup = document.createElement('div');

    const numberOfColumnsInput = document.createElement('input');
    numberOfColumnsInput.type = 'number';
    numberOfColumnsInput.id = 'numberOfColumns';
    numberOfColumnsInput.name = 'numberOfColumns';
    numberOfColumnsInput.min = '2';
    numberOfColumnsInput.max = '12';
    numberOfColumnsInput.placeholder = 'The number of columns in each platform gallery';

    numberOfColumnsInput.classList.add('input');

    const numberOfColumnsIcon = document.createElement('div');
    numberOfColumnsIcon.classList.add('form-icon');
    numberOfColumnsIcon.innerHTML = '<i class="form-icon num-cols-icon fa fa-2x fa-columns" aria-hidden="true"></i>';

    const numberOfColumnsLabel = document.createElement('label');
    numberOfColumnsLabel.textContent = 'Number of columns';

    const numberOfColumnsSubLabel = document.createElement('label');
    numberOfColumnsSubLabel.id = 'num-cols-sub-label';
    numberOfColumnsSubLabel.classList.add('sub-label');

    const numberOfColumnsCtn = document.createElement('div');
    numberOfColumnsCtn.classList.add('dual-ctn');

    numberOfColumnsCtn.appendChild(numberOfColumnsIcon);
    numberOfColumnsCtn.appendChild(numberOfColumnsInput);
    numberOfColumnsGroup.appendChild(numberOfColumnsLabel);
    numberOfColumnsGroup.appendChild(numberOfColumnsCtn);

    numberOfColumnsGroup.appendChild(numberOfColumnsLabel);
    numberOfColumnsGroup.appendChild(numberOfColumnsCtn);

    numberOfColumnsInput.value = LB.galleryNumOfCols;

    const steamGridKeyGroup = document.createElement('div');

    const steamGridKeyCtn = document.createElement('div');
    steamGridKeyCtn.classList.add('dual-ctn');

    const steamGridKeyIcon = document.createElement('div');
    steamGridKeyIcon.classList.add('form-icon');
    steamGridKeyIcon.innerHTML = '<i class="form-icon emulator-args-icon fa fa-2x fa-cog" aria-hidden="true"></i>';

    const steamGridKeyLabel = document.createElement('label');
    steamGridKeyLabel.textContent = 'Steam Grid API Key';

    const steamGridKeyInput = document.createElement('input');
    steamGridKeyInput.classList.add('input');
    steamGridKeyInput.type = 'text';
    steamGridKeyInput.placeholder = 'Your Steam Grid API Key';

    steamGridKeyCtn.appendChild(steamGridKeyIcon);
    steamGridKeyCtn.appendChild(steamGridKeyInput);
    steamGridKeyGroup.appendChild(steamGridKeyLabel);
    steamGridKeyGroup.appendChild(steamGridKeyCtn);

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

    if (LB.steamGridAPIKey) {
        steamGridKeyInput.value = LB.steamGridAPIKey;
    }

    // LB.prefs.getValue('settings', 'steamGridAPIKey')
    //     .then((value) => {
    //         steamGridKeyInput.value = value;
    //     })
    //     .catch((error) => {
    //         console.error('Failed to get platform preference:', error);
    //     });

    // gamesDirButton.addEventListener('click', _gamesDirButtonClick);

    formContainer.appendChild(platformMenuImageCtn);
    formContainer.appendChild(numberOfColumnsGroup);
    formContainer.appendChild(steamGridKeyGroup);
    // formContainer.appendChild(cancelButton);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.classList.add('cancel-save-buttons');
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(aboutButton);
    formContainerButtons.appendChild(saveButton);

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

    async function _saveButtonClick(event) {

        if (!numberOfColumnsInput.value) {
            numberOfColumnsSubLabel.textContent = 'This field cannot be empty';
            return;
        }

        try {
            await LB.prefs.save('settings', 'numberOfColumns', steamGridKeyInput.value);
            await LB.prefs.save('settings', 'steamGridKey', steamGridKeyInput.value);
            window.location.reload();
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    formContainer.appendChild(formContainerButtons);

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

    statusCheckBox.addEventListener('change', (event) => {
        console.log("event: ", event);
        const gamesDir = gamesDirInput.value;
        const emulator = emulatorInput.value;
        const isNotEnablable = !gamesDir || !emulator;

        if (isNotEnablable) {
            event.preventDefault(); // Prevent the default behavior
            statusCheckBox.checked = !statusCheckBox.checked; // Revert the checkbox state
            console.log("Checkbox state change prevented.");
            platformText.textContent = 'Please provide both a games directory and an emulator.';
        } else {
            // Update the label text after the state changes
            document.getElementById('form-status-label-platform-status').textContent = statusCheckBox.checked ? 'On' : 'Off';
        }
    });


    const statusLabel = document.createElement('label');
    statusLabel.classList.add('checkbox');
    statusLabel.id = 'form-status-label';

    const statusLabelPlatormName = document.createElement('span');
    statusLabelPlatormName.id = 'form-status-label-platform-name';
    statusLabelPlatormName.textContent = `${platformName} is `;

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
    emulatorArgsIcon.innerHTML = '<i class="form-icon emulator-args-icon fa fa-2x fa-cog" aria-hidden="true"></i>';

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
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
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
    gameMenu: buildGameMenu,
    platformForm: buildPlatformForm
};
