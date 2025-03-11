async function buildGameMenu(gameName, image) {
    return new Promise((resolve, reject) => {
        const gameMenuContainer = document.createElement('div');
        gameMenuContainer.classList.add('page-content');

        const currentImageContainer = document.createElement('div');
        currentImageContainer.classList.add('menu-game-container', 'current-image');
        const currentImage = document.createElement('img');
        currentImage.src = image.src;
        currentImage.alt = 'Current game image';
        currentImageContainer.appendChild(currentImage);

        const spinner = document.createElement('div');
        spinner.classList.add(`spinner-${Math.floor(Math.random() * 20) + 1}`, 'spinner');

        document.body.appendChild(spinner);

        gameMenuContainer.appendChild(currentImageContainer);

        // Send a request to fetch images
        ipcRenderer.send('fetch-images', gameName);

        // Use 'once' to ensure the event handler runs only one time
        ipcRenderer.once('image-urls', (event, urls) => {
            urls.forEach((url) => {
                const gameContainer = document.createElement('div');
                gameContainer.classList.add('menu-game-container');

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

function createFormTableRow(labelText, inputId, inputDescription, buttonText, platformName) {

    const isInputIdSave = inputId === 'save';

    async function _formBrowseButtonClick(event) {
        // event.stopPropagation();

        if (inputId === 'input-games-dir') {
            const selectedPath = await ipcRenderer.invoke('select-file-or-directory', 'openDirectory');
            if (selectedPath) {
                document.getElementById(inputId).value = selectedPath;
            }
        }

        if (inputId === 'input-emulator') {
            const selectedPath = await ipcRenderer.invoke('select-file-or-directory', 'openFile');
            if (selectedPath) {
                document.getElementById(inputId).value = selectedPath;
            }
        }

    }

    const row = document.createElement('tr');

    // Label
    const firstCol = document.createElement('td');
    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.textContent = labelText;
    firstCol.appendChild(label);
    firstCol.classList.add('col1');

    // Input
    const secondCol = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.classList.add('input-text');
    input.id = inputId;
    input.title = inputDescription;
    input.placeholder = inputDescription;

    if (inputId === 'input-games-dir') {
        LB.prefs.getValue(platformName, 'gamesDir')
            .then((value) => {
                input.value = value;
            })
            .catch((error) => {
                console.error('Failed to get platform preference:', error);
            });
    }

    if (inputId === 'input-emulator') {
        LB.prefs.getValue(platformName, 'emulator')
            .then((value) => {
                input.value = value;
            })
            .catch((error) => {
                console.error('Failed to get platform preference:', error);
            });
    }

    if (inputId === 'input-emulator-args') {
        LB.prefs.getValue(platformName, 'emulatorArgs')
            .then((value) => {
                input.value = value;
            })
            .catch((error) => {
                console.error('Failed to get platform preference:', error);
            });
    }

    secondCol.appendChild(input);
    secondCol.classList.add('col2');

    // Button (or nothing if 3rd col)
    const thirdCol = document.createElement('td');

    if (inputId === 'input-games-dir' || inputId === 'input-emulator') {

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'button';
        button.classList.add(isInputIdSave ? 'success' : 'info');
        button.textContent = buttonText;
        thirdCol.appendChild(button);
        thirdCol.classList.add('col3');
        button.addEventListener('click', _formBrowseButtonClick);

    }

    row.appendChild(firstCol);
    row.appendChild(secondCol);
    row.appendChild(thirdCol);

    return row;
}

function buildPlatformForm(platformName) {

    console.log("platformName: ", platformName);

    const formContainer = document.createElement('div');
    formContainer.id = 'form-container';

    const menuImageContainer = document.createElement('div');
    menuImageContainer.className = 'menu-image-container';
    const menuImage = document.createElement('img');
    menuImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    menuImage.width = '350';
    menuImageContainer.appendChild(menuImage);

    const form = document.createElement('form');
    form.id = 'platform-form';
    form.className = 'platform-form';

    formContainer.appendChild(form);
    formContainer.appendChild(menuImageContainer);

    // Row 1: Toggle switch and Platform label
    const row1 = document.createElement('div');

    // Toggle switch
    const toggleContainer = document.createElement('label');
    toggleContainer.className = 'input-platform-toggle-switch';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'input-platform-toggle-checkbox';

    const sliderSpan = document.createElement('span');
    sliderSpan.className = 'input-platform-toggle-slider';

    toggleContainer.appendChild(toggleInput);
    toggleContainer.appendChild(sliderSpan);
    row1.appendChild(toggleContainer);

    const toggleLabel = document.createElement('span');
    toggleLabel.id = 'form-status-label';
    toggleLabel.setAttribute('for', 'input-platform-toggle-checkbox');

    row1.appendChild(toggleLabel);
    form.appendChild(row1);

    // Row 2: Details text
    const detailsText = document.createElement('div');
    detailsText.id = 'details-text-div';
    detailsText.className = 'details-text-div';
    detailsText.textContent = 'plop';
    form.appendChild(detailsText);

    const inputsTable = document.createElement('table');

    // Row 3: Games Directory
    const gamesDirRow = createFormTableRow('Games', 'input-games-dir', `Select your ${LB.utils.capitalizeWord(platformName)} games directory path`, 'Browse', platformName);
    inputsTable.appendChild(gamesDirRow);

    // Row 4: Emulator
    const emulatorRow = createFormTableRow('Emulator', 'input-emulator', `Select your ${LB.utils.capitalizeWord(platformName)} emulator (file path or name)`, 'Browse', platformName);
    inputsTable.appendChild(emulatorRow);

    // Row 5: Emulator Args
    const emulatorArgsRow = createFormTableRow('Args', 'input-emulator-args', `The arguments to your ${LB.utils.capitalizeWord(platformName)} emulator`, null, platformName);
    inputsTable.appendChild(emulatorArgsRow);

    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button';
    saveButton.classList.add('success');
    saveButton.textContent = 'Save';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'button';
    cancelButton.classList.add('info');
    cancelButton.textContent = 'Cancel';

    buttons.appendChild(cancelButton);
    buttons.appendChild(saveButton);

    function _formCancelButtonClick(event) {

        const escapeKeyEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            keyCode: 27,
            code: 'Escape', // The physical key on the keyboard
            which: 27,     // Same as keyCode
            bubbles: true
        });

        document.dispatchEvent(escapeKeyEvent);
    }

    async function _formSaveButtonClick(event) {

        const isEnabled = document.getElementById('input-platform-toggle-checkbox').checked;
        const gamesDir = document.getElementById('input-games-dir').value;
        const emulator = document.getElementById('input-emulator').value;
        const emulatorArgs = document.getElementById('input-emulator-args').value;

        try {
            await LB.prefs.save(platformName, 'isEnabled', isEnabled);
            await LB.prefs.save(platformName, 'gamesDir', gamesDir);
            await LB.prefs.save(platformName, 'emulator', emulator);
            await LB.prefs.save(platformName, 'emulatorArgs', emulatorArgs);
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    cancelButton.addEventListener('click', _formCancelButtonClick);
    saveButton.addEventListener('click', _formSaveButtonClick);

    form.appendChild(inputsTable);
    form.appendChild(buttons);

    LB.prefs.getValue(platformName, 'isEnabled')
        .then((value) => {
            console.log("value!", value);
            toggleInput.checked = value;
            toggleInput.dispatchEvent(new Event('change'));
            toggleLabel.textContent = value ? 'Enabled' : 'Disabled';
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });


    // toggleInput.addEventListener('change', (event) => {
    //     console.log("event.target.checked: ", event.target.checked);
    //     const label = document.getElementById('form-status-label');
    //     console.log("label: ", label);
    //     document.getElementById('form-status-label').textContent = event.target.checked ? "Disabled" : "Enabled";
    // });

    return form;
}

LB.build = {
    gameMenu: buildGameMenu,
    platformForm: buildPlatformForm
};
