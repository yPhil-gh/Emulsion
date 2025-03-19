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

function createFormTableRow(labelText, inputId, inputDescription, buttonText, platformName, colSpan) {

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

    if (colSpan) {
        secondCol.colSpan = colSpan;
    }

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

function buildPrefsForm() {

    const formTable = document.createElement('table');

    const form = document.createElement('form');
    form.id = 'platform-form';
    form.className = 'platform-form';

    const menuImageContainer = document.createElement('div');
    menuImageContainer.className = 'menu-image-container';
    const menuImage = document.createElement('img');
    menuImage.src = path.join(LB.baseDir, 'img', `emume.png`);
    menuImage.width = '250';
    menuImageContainer.appendChild(menuImage);

    const row0 = document.createElement('tr');
    const row0td1 = document.createElement('td');
    row0td1.colSpan = 3;
    row0td1.style.textAlign = 'center';

    row0td1.appendChild(menuImage);
    row0.appendChild(row0td1);

    // Row 1: Toggle switch and Platform label
    const row1 = document.createElement('tr');
    const row1td1 = document.createElement('td');
    row1td1.className = 'form-checkbox-container';

    const row1td2 = document.createElement('td');
    const row1td3 = document.createElement('td');

    const statusCheckBox = document.createElement('input');
    statusCheckBox.type = 'checkbox';
    statusCheckBox.id = 'input-platform-toggle-checkbox';

    const statusLabel = document.createElement('div');
    statusLabel.id = 'form-status-label';
    statusLabel.setAttribute('for', 'input-platform-toggle-checkbox');

    const statusLabelPlatormName = document.createElement('span');
    statusLabelPlatormName.id = 'form-status-label-platform-name';
    statusLabelPlatormName.textContent = `EmumE is Cool`;

    const statusLabelPlatormStatus = document.createElement('span');
    statusLabelPlatormStatus.id = 'form-status-label-platform-status';
    statusLabelPlatormStatus.textContent = `On`;

    statusLabel.appendChild(statusLabelPlatormName);
    statusLabel.appendChild(statusLabelPlatormStatus);

    row1td2.colSpan = 2;
    row1td2.appendChild(statusLabel);

    row1.appendChild(row1td1);
    row1.appendChild(row1td2);
    row1.appendChild(row1td3);
    form.appendChild(row1);

    // Row 2: Details text
    const row2 = document.createElement('tr');
    const platformText = document.createElement('div');
    const row2td1 = document.createElement('td');
    row2td1.colSpan = 3;
    platformText.id = 'platform-text-div';
    platformText.textContent = 'plop';
    row2td1.appendChild(platformText);
    row2.appendChild(row2td1);

    formTable.appendChild(row0);
    formTable.appendChild(row1);
    formTable.appendChild(row2);

    const buttons = document.createElement('div');
    buttons.className = 'buttons';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.className = 'button';
    saveButton.classList.add('success');
    saveButton.textContent = 'Save';

    const aboutButton = document.createElement('button');
    aboutButton.type = 'button';
    aboutButton.className = 'button';
    aboutButton.classList.add('success');
    aboutButton.textContent = 'About';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'button';
    cancelButton.classList.add('info');
    cancelButton.textContent = 'Cancel';

    buttons.appendChild(cancelButton);
    buttons.appendChild(aboutButton);
    buttons.appendChild(saveButton);

    function _formAboutButtonClick(event) {

        const canvas = document.getElementById('canvas');

        if (!canvas) {

            ipcRenderer.send('request-about-content');

            document.getElementById('close-about').addEventListener('click', (event) => {
                event.stopPropagation();
                // window.audioContext.suspend();
                document.getElementById('about-container').style.display = 'none';
            });

        } else {
            document.getElementById('about-container').style.display = 'block';
        }

    }

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
    aboutButton.addEventListener('click', _formAboutButtonClick);
    saveButton.addEventListener('click', _formSaveButtonClick);

    form.appendChild(formTable);
    form.appendChild(buttons);

    return form;
}

function buildPlatformForm(platformName) {

    if (platformName === 'settings') {
        return buildPrefsForm();
    }

   //  <div class="field has-addons">
  //    <div class="control">
  //    <input class="input" type="text" placeholder="Find a repository">
  //   </div>
  //   <div class="control">
  //     <button class="button is-info">
  //      Search
  //     </button>
  //    </div>
  //   </div>

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
    statusCheckBox.classList.add('is-medium');


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

    // Row 2: Details text
    const platformText = document.createElement('div');
    platformText.classList.add('box');
    platformText.id = 'platform-text-div';
    platformText.textContent = 'plop';

    const gamesDirField = document.createElement('div');
    gamesDirField.classList.add('field', 'has-addons', 'is-expanded');
    const gamesDirInputControl = document.createElement('div');
    gamesDirInputControl.classList.add('control', 'is-expanded');
    const gamesDirInput = document.createElement('input');
    gamesDirInput.type = 'text';
    gamesDirInput.classList.add('input', 'is-medium');
    gamesDirInput.placeholder = 'Your games directory';

    const gamesDirButtonControl = document.createElement('div');
    gamesDirButtonControl.classList.add('control');
    gamesDirButtonControl.type = 'text';
    const gamesDirButton = document.createElement('button', 'is-info');
    gamesDirButton.classList.add('button', 'is-medium');
    gamesDirButton.textContent = 'Browse';

    gamesDirInputControl.appendChild(gamesDirInput);
    gamesDirButtonControl.appendChild(gamesDirButton);
    gamesDirField.appendChild(gamesDirInputControl);
    gamesDirField.appendChild(gamesDirButtonControl);

    const emulatorField = document.createElement('div');
    emulatorField.classList.add('field', 'has-addons', 'is-expanded');
    const emulatorInputControl = document.createElement('div');
    emulatorInputControl.classList.add('control', 'is-expanded');
    const emulatorInput = document.createElement('input');
    emulatorInput.type = 'text';
    emulatorInput.classList.add('input', 'is-medium');
    emulatorInput.placeholder = 'Your emulator';

    const emulatorButtonControl = document.createElement('div');
    emulatorButtonControl.classList.add('control');
    const emulatorButton = document.createElement('button', 'is-info');
    emulatorButtonControl.type = 'text';
    emulatorButton.classList.add('button', 'is-medium');
    emulatorButton.textContent = 'Browse';

    emulatorInputControl.appendChild(emulatorInput);
    emulatorButtonControl.appendChild(emulatorButton);
    emulatorField.appendChild(emulatorInputControl);
    emulatorField.appendChild(emulatorButtonControl);

    const emulatorArgsDirField = document.createElement('div');
    emulatorArgsDirField.classList.add('field');
    const emulatorArgsInputControl = document.createElement('div');
    emulatorArgsInputControl.classList.add('control');
    const emulatorArgsInput = document.createElement('input', 'is-medium');
    emulatorArgsInputControl.classList.add('input');
    emulatorArgsInputControl.type = 'text';
    emulatorArgsInputControl.placeholder = 'Your emulator args';
    emulatorArgsInput.classList.add('input', 'is-medium');
    emulatorArgsInput.placeholder = 'Your emulator arguments';

    const saveButton = document.createElement('button');
    saveButton.type = 'button';
    saveButton.classList.add('button', 'is-success', 'is-medium');
    saveButton.textContent = 'Save';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.classList.add('is-info', 'button', 'is-medium');
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
    formContainer.appendChild(platformText);
    formContainer.appendChild(gamesDirField);
    formContainer.appendChild(emulatorField);
    formContainer.appendChild(emulatorArgsInput);
    formContainer.appendChild(cancelButton);

    const formContainerButtons = document.createElement('div');
    formContainerButtons.className = 'form-buttons';
    formContainerButtons.appendChild(cancelButton);
    formContainerButtons.appendChild(saveButton);

    LB.prefs.getValue(platformName, 'isEnabled')
        .then((value) => {
            console.log("value!", value);
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

        try {
            await LB.prefs.save(platformName, 'isEnabled', statusCheckBox.checked);
            await LB.prefs.save(platformName, 'gamesDir', gamesDirInput.value);
            await LB.prefs.save(platformName, 'emulator', emulatorInput.value);
            await LB.prefs.save(platformName, 'emulatorArgs', emulatorArgsInput.value);
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    formContainer.appendChild(formContainerButtons);

    // OLD


    const formTable = document.createElement('table');

    const form = document.createElement('form');
    form.id = 'platform-form';
    form.className = 'platform-form';

    const menuImage = document.createElement('img');
    menuImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    menuImage.width = '250';

    const row0 = document.createElement('tr');
    const row0td1 = document.createElement('td');
    row0td1.colSpan = 3;
    row0td1.style.textAlign = 'center';

    row0td1.appendChild(menuImage);
    row0.appendChild(row0td1);

    // Row 1: Toggle switch and Platform label
    const row1 = document.createElement('tr');
    const row1td1 = document.createElement('td');
    row1td1.className = 'form-checkbox-container';

    const row1td2 = document.createElement('td');
    const row1td3 = document.createElement('td');

    // const statusCheckBox = document.createElement('input');
    // statusCheckBox.type = 'checkbox';
    // statusCheckBox.id = 'input-platform-toggle-checkbox';

    // const statusLabel = document.createElement('div');
    // statusLabel.id = 'form-status-label';
    // statusLabel.setAttribute('for', 'input-platform-toggle-checkbox');

    // const statusLabelPlatormName = document.createElement('span');
    // statusLabelPlatormName.id = 'form-status-label-platform-name';
    // statusLabelPlatormName.textContent = `${platformName} is `;

    // const statusLabelPlatormStatus = document.createElement('span');
    // statusLabelPlatormStatus.id = 'form-status-label-platform-status';

    // statusLabel.appendChild(statusLabelPlatormName);
    // statusLabel.appendChild(statusLabelPlatormStatus);

    // row1td2.colSpan = 2;
    // row1td1.appendChild(statusCheckBox);
    // row1td2.appendChild(statusLabel);

    // row1.appendChild(row1td1);
    // row1.appendChild(row1td2);
    // row1.appendChild(row1td3);
    // form.appendChild(row1);

    // // Row 2: Details text
    // const row2 = document.createElement('tr');
    // const platformText = document.createElement('div');
    // const row2td1 = document.createElement('td');
    // row2td1.colSpan = 3;
    // platformText.id = 'platform-text-div';
    // platformText.textContent = 'plop';
    // row2td1.appendChild(platformText);
    // row2.appendChild(row2td1);

    // formTable.appendChild(row0);
    // formTable.appendChild(row1);
    // formTable.appendChild(row2);

    // // Row 3: Games Directory
    // const gamesDirRow = createFormTableRow('Games', 'input-games-dir', `Select your ${LB.utils.capitalizeWord(platformName)} games directory path`, 'Browse', platformName);
    // formTable.appendChild(gamesDirRow);

    // // Row 4: Emulator
    // const emulatorRow = createFormTableRow('Emulator', 'input-emulator', `Select your ${LB.utils.capitalizeWord(platformName)} emulator (file path or name)`, 'Browse', platformName);
    // formTable.appendChild(emulatorRow);

    // // Row 5: Emulator Args
    // const emulatorArgsRow = createFormTableRow('Args', 'input-emulator-args', `The arguments to your ${LB.utils.capitalizeWord(platformName)} emulator`, null, platformName, 2);
    // formTable.appendChild(emulatorArgsRow);

    // const buttons = document.createElement('div');
    // buttons.className = 'buttons';

    // // const saveButton = document.createElement('button');
    // // saveButton.type = 'button';
    // // saveButton.className = 'button';
    // // saveButton.classList.add('success');
    // // saveButton.textContent = 'Save';

    // // const cancelButton = document.createElement('button');
    // // cancelButton.type = 'button';
    // // cancelButton.className = 'button';
    // // cancelButton.classList.add('info');
    // // cancelButton.textContent = 'Cancel';

    // // buttons.appendChild(cancelButton);
    // // buttons.appendChild(saveButton);

    // function _formCancelButtonClick(event) {

    //     const escapeKeyEvent = new KeyboardEvent('keydown', {
    //         key: 'Escape',
    //         keyCode: 27,
    //         code: 'Escape', // The physical key on the keyboard
    //         which: 27,     // Same as keyCode
    //         bubbles: true
    //     });

    //     document.dispatchEvent(escapeKeyEvent);
    // }

    // async function _formSaveButtonClick(event) {

    //     const isEnabled = document.getElementById('input-platform-toggle-checkbox').checked;
    //     const gamesDir = document.getElementById('input-games-dir').value;
    //     const emulator = document.getElementById('input-emulator').value;
    //     const emulatorArgs = document.getElementById('input-emulator-args').value;

    //     try {
    //         await LB.prefs.save(platformName, 'isEnabled', isEnabled);
    //         await LB.prefs.save(platformName, 'gamesDir', gamesDir);
    //         await LB.prefs.save(platformName, 'emulator', emulator);
    //         await LB.prefs.save(platformName, 'emulatorArgs', emulatorArgs);
    //     } catch (error) {
    //         console.error('Failed to save preferences:', error);
    //     }
    // }

    // cancelButton.addEventListener('click', _formCancelButtonClick);
    // saveButton.addEventListener('click', _formSaveButtonClick);

    // form.appendChild(formTable);
    // form.appendChild(buttons);

    // LB.prefs.getValue(platformName, 'isEnabled')
    //     .then((value) => {
    //         console.log("value!", value);
    //         statusCheckBox.checked = value;
    //         statusLabelPlatormStatus.textContent = value ? 'On' : 'Off';
    //     })
    //     .catch((error) => {
    //         console.error('Failed to get platform preference:', error);
    //     });


    // toggleInput.addEventListener('change', (event) => {
    //     console.log("event.target.checked: ", event.target.checked);
    //     const label = document.getElementById('form-status-label');
    //     console.log("label: ", label);
    //     document.getElementById('form-status-label').textContent = event.target.checked ? "Disabled" : "Enabled";
    // });

    return formContainer;
}

LB.build = {
    gameMenu: buildGameMenu,
    platformForm: buildPlatformForm
};
