function initSlideShow(platformToDisplay) {

    const slideshow = document.getElementById("slideshow");

    document.body.style.display = "block";
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const totalSlides = slides.length;
    const radius = 500;
    let currentIndex = platformToDisplay ? platformToDisplay : 0;

    function updateCarousel() {
        const angleIncrement = 360 / totalSlides;

        slides.forEach((slide, index) => {

            const angle = angleIncrement * (index - currentIndex);
            slide.style.setProperty('--angle', angle);
            slide.style.setProperty('--radius', radius);

            if (index === currentIndex) {
                slide.classList.add('active');
                slide.classList.remove('adjacent');
            } else {
                slide.classList.add('adjacent');
                slide.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % totalSlides;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateCarousel();
    }

    slideshow.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent default scrolling behavior
        if (event.deltaY > 0) {
            nextSlide();
        } else if (event.deltaY < 0) {
            prevSlide();
        }
    });

    // Click to select adjacent slides
    slides.forEach((slide, index) => {
        slide.addEventListener('click', () => {
            if (slide.classList.contains('adjacent')) {
                currentIndex = index; // Set the clicked slide as the current slide
                updateCarousel();
            } else if (slide.classList.contains('active')) {
                // simulateKeyPress('Enter');
            }
        });
    });

    window.addEventListener('keydown', onKeyDown);

    function onKeyDown (event) {
        event.stopPropagation();
        event.stopImmediatePropagation(); // Stops other listeners on the same element
        if (event.key === 'ArrowRight') {
            // document.getElementById('dpad-icon').src = '../img/controls/key-arrows-horiz-right.png';

            nextSlide();
        } else if (event.key === 'ArrowLeft') {
            // document.getElementById('dpad-icon').src = '../img/controls/key-arrows-horiz-left.png';
            prevSlide();
        } else if (event.key === 'Escape') {

            window.control.showExitDialog();

        } else if (event.key === 'Enter') {

            document.getElementById('slideshow').style.display = 'none';
            document.getElementById('galleries').style.display = "flex";
            window.removeEventListener('keydown', onKeyDown);

            let activeGalleryIndex;
            let numberOfPlatforms = 0;
            let activePlatformName;

            slides.forEach((slide, index) => {
                // console.log("slide, index: ", slide, index);
                numberOfPlatforms++;
                if (slide.classList.contains('active')) {
                    activePlatformName = slide.dataset.platform;
                    activeGalleryIndex = index;
                }
            });

            LB.control.initGallery(activeGalleryIndex);

        }
    }

    // function onKeyUp (event) {
    //     document.getElementById('dpad-icon').src = '../img/controls/key-arrows-horiz.png';
    // }

    // window.addEventListener('keyup', onKeyUp);

    updateCarousel();
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

// Helper function to create an input row
function createFormTableRow(labelText, inputId, inputDescription, buttonText, platformName) {

    const isInputIdSave = inputId === 'save';

    async function _formBrowseButtonClick(event) {
        event.stopPropagation();

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
    // Create the form element
    const form = document.createElement('form');
    form.id = 'platform-form';
    form.className = 'platform-form';

    // Row 1: Toggle switch and Platform label
    const row1 = document.createElement('div');

    // Toggle switch
    const toggleContainer = document.createElement('label');
    toggleContainer.className = 'switch';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'input-platform-toggle';

    const sliderSpan = document.createElement('span');
    sliderSpan.className = 'slider';

    toggleContainer.appendChild(toggleInput);
    toggleContainer.appendChild(sliderSpan);
    row1.appendChild(toggleContainer);

    const toggleLabel = document.createElement('span');
    toggleLabel.id = 'form-status-label';

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
    const gamesDirRow = createFormTableRow('Games', 'input-games-dir', `Select your ${capitalizeWord(platformName)} games directory path`, 'Browse', platformName);
    inputsTable.appendChild(gamesDirRow);

    // Row 4: Emulator
    const emulatorRow = createFormTableRow('Emulator', 'input-emulator', `Select your ${capitalizeWord(platformName)} emulator (file path or name)`, 'Browse', platformName);
    inputsTable.appendChild(emulatorRow);

    // Row 5: Emulator Args
    const emulatorArgsRow = createFormTableRow('Args', 'input-emulator-args', `The arguments to your ${capitalizeWord(platformName)} emulator`, null, platformName);
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

        const sw = document.getElementById('input-platform-toggle');

        console.log("sw: ", sw);

        const isEnabled = document.getElementById('input-platform-toggle').checked;
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
            console.log("value: ", value);
            toggleInput.checked = value;
            toggleLabel.textContent = value ? 'Enabled' : 'Disabled';
        })
        .catch((error) => {
            console.error('Failed to get platform preference:', error);
        });


    // toggleInput.addEventListener('change', (event) => {
    //     console.log("event.target.checked: ", event.target.checked);
    //     document.getElementById('form-status-label').textContent = event.target.checked ? "Disabled" : "Enabled";
    // });

    return form;
}

function initGallery(currentIndex) {
    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const totalPages = pages.length;
    const angleIncrement = 360 / totalPages;

    const radius = (window.innerWidth / 2) / Math.tan((angleIncrement / 2) * (Math.PI / 180));
    console.log("radius: ", radius);

    let selectedPage;
    let gameContainers;

    function updateCarousel() {

        pages.forEach((page, index) => {
            const angle = angleIncrement * (index - currentIndex);
            page.style.setProperty('--angle', angle);
            page.style.setProperty('--radius', radius);

            if (index === currentIndex) {
                selectedPage = page;
                gameContainers = Array.from(page.querySelectorAll('.game-container') || []);
                gameContainers[0].classList.add('selected');

                document.querySelector('header .platform-name').textContent = capitalizeWord(page.dataset.platform);
                document.querySelector('header .platform-image img').src = `../img/platforms/${page.dataset.platform}.png`;

                page.classList.add('active');
                page.classList.remove('adjacent');
            } else {
                page.classList.add('adjacent');
                page.classList.remove('active');
            }
        });
    }

    function nextPage() {
        currentIndex = (currentIndex + 1) % totalPages;
        updateCarousel();
    }

    function prevPage() {
        currentIndex = (currentIndex - 1 + totalPages) % totalPages;
        updateCarousel();
    }

    // Handle wheel events for scrolling
    galleries.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent default scrolling behavior
        if (event.deltaY > 0) {
            nextPage();
        } else if (event.deltaY < 0) {
            prevPage();
        }
    });

    // Handle click events on adjacent pages
    pages.forEach((page, index) => {
        page.addEventListener('click', () => {
            if (page.classList.contains('adjacent')) {
                currentIndex = index; // Set the clicked page as the current page
                updateCarousel();
            }
        });
    });

    let isMenuOpen = false;

    let selectedIndex = 0;

    function _toggleFooterMenu(selectedIndex, listener, isMenuOpen) {

        window.removeEventListener('keydown', listener);

        const footer = document.getElementById('footer');
        const controls = document.getElementById('controls');
        const footerTitle = document.getElementById('footer-title');
        const footerMenu = document.getElementById('footer-menu');
        const footerMenuImg = document.getElementById('footer-menu-image');


        function onKeyDown (event) {
            event.stopPropagation();
            event.stopImmediatePropagation(); // Stops other listeners on the same element
            switch (event.key) {
            case 'i':
                _closeMenu();
                break;
            case 'Escape':
                _closeMenu();
                break;
            }
        }

        function _closeMenu() {
            footer.style.height = '100px'; // original height
            controls.style.display = 'flex';
            footerTitle.style.display = 'none';
            footerMenu.style.display = 'none';
            footerMenuImg.classList.add('hidden');
            footerMenuImg.src ='';
            window.removeEventListener('keydown', onKeyDown);
            window.addEventListener('keydown', listener);

            while (footerMenu.firstChild) {
                footerMenu.removeChild(footerMenu.firstChild);
            }
        }

        function onToggle (event) {
            // event.stopPropagation();
            // event.stopImmediatePropagation(); // Stops other listeners on the same element
            console.log("event: ", event);
            // document.getElementById('input-platform-toggle')
        }

        function _openMenu() {
            footer.style.height = '50vh';
            controls.style.display = 'none';
            footerTitle.style.display = 'block';
            footerMenu.style.display = 'block';

            gameContainers.forEach((container, index) => {
                if (index === selectedIndex) {
                    footerTitle.textContent = capitalizeWord(container.title);

                    if (container.classList.contains('settings')) {
                        const platformForm = buildPlatformForm(container.dataset.platform);
                        footerMenuImg.src = path.join(LB.baseDir, 'img', 'platforms', `${container.dataset.platform}.png`);
                        footerMenuImg.classList.remove('hidden');
                        footerMenu.appendChild(platformForm);
                    }

                }
            });

            document.getElementById('input-platform-toggle').addEventListener('click', onToggle);
            window.addEventListener('keydown', onKeyDown);
        }


        if (!isMenuOpen) {
            _openMenu();
            isMenuOpen = true;
        } else {
            _closeMenu();
            isMenuOpen = false;
        }
    }


    function _handleKeyDown(event) {
        event.preventDefault(); // Prevent default scrolling behavior
        switch (event.key) {
        case 'ArrowRight':
            if (event.shiftKey) {
                nextPage();
            } else {
                selectedIndex = (selectedIndex + 1) % gameContainers.length;
            }
            break;
        case 'ArrowLeft':
            if (event.shiftKey) {
                prevPage();
            } else {
                selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
            }
            break;
        case 'ArrowUp':
            selectedIndex = Math.max(selectedIndex - LB.galleryNumOfCols, 0);
            break;
        case 'ArrowDown':
            selectedIndex = Math.min(selectedIndex + LB.galleryNumOfCols, gameContainers.length);
            break;
        case 'i':
            _toggleFooterMenu(selectedIndex, _handleKeyDown, isMenuOpen);
            // window.removeEventListener('keydown', _handleKeyDown);
            break;
        case 'F5':
            window.location.reload();
            break;
        case 'Escape':
            document.getElementById('slideshow').style.display = 'flex';
            document.getElementById('galleries').style.display = 'none';
            window.removeEventListener('keydown', _handleKeyDown);
            LB.control.initSlideShow(currentIndex);
            break;
        default:
            break;
        }

        gameContainers.forEach((container, index) => {
            container.classList.toggle('selected', index === selectedIndex);
        });

        if (!event.shiftKey) {
            if (selectedIndex < gameContainers.length && selectedIndex > 0) {
                // gameContainers[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });

                gameContainers[selectedIndex].scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

                // gameContainers[selectedIndex].scrollIntoViewIfNeeded();

            }
        }


    }


    window.addEventListener('keydown', _handleKeyDown);

    // Initialize the carousel
    updateCarousel();


}

LB.control = {
    initGallery: initGallery,
    initSlideShow: initSlideShow
};
