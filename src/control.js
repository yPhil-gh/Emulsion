function initSlideShow(platformToDisplay) {

    LB.utils.updateControls('dpad', 'button-dpad-ew', 'same');
    LB.utils.updateControls('square', 'same', 'same', 'off');
    LB.utils.updateControls('circle', 'same', 'Exit');

    const slideshow = document.getElementById("slideshow");

    document.getElementById('header').style.display = 'none';

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

            // Remove all state classes before reassigning
            slide.classList.remove('active', 'prev-slide', 'next-slide', 'adjacent');

            if (index === currentIndex) {
                slide.classList.add('active');
            } else if (index === (currentIndex - 1 + totalSlides) % totalSlides) {
                slide.classList.add('prev-slide');
            } else if (index === (currentIndex + 1) % totalSlides) {
                slide.classList.add('next-slide');
            } else {
                slide.classList.add('adjacent');
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
                simulateKeyDown('Enter');
            }
        });
    });

    window.addEventListener('keydown', onSlideShowKeyDown);

    function onSlideShowKeyDown (event) {
        event.stopPropagation();
        event.stopImmediatePropagation(); // Stops other listeners on the same element

        switch (event.key) {
        case 'ArrowRight':
            nextSlide();
            break;
        case 'ArrowLeft':
            prevSlide();
            break;
        case 'Enter':

            document.getElementById('slideshow').style.display = 'none';
            window.removeEventListener('keydown', onSlideShowKeyDown);

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

            if (LB.enabledPlatforms.includes(activePlatformName)) {
                initGallery(activeGalleryIndex);
            } else {
                initGallery(0, activePlatformName);
            }

            document.getElementById('galleries').style.display = "flex";

            break;
        case 'Escape':
            ipcRenderer.invoke('quit');
            break;
        }
    }

    // function onKeyUp (event) {
    //     document.getElementById('dpad-icon').src = '../img/controls/key-arrows-horiz.png';
    // }

    // window.addEventListener('keyup', onKeyUp);

    updateCarousel();
}

function initGallery(currentIndex, disabledPlatform) {

    LB.utils.updateControls('dpad', 'button-dpad-nesw', 'same');
    LB.utils.updateControls('square', 'same', 'Fetch cover', 'on');
    LB.utils.updateControls('circle', 'same', 'Back');

    const header = document.getElementById('header');
    header.style.display = 'flex';

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const totalPages = pages.length;
    const angleIncrement = 360 / totalPages;
    const radius = (window.innerWidth / 2) / Math.tan((angleIncrement / 2) * (Math.PI / 180));

    let currentPageIndex;
    let gameContainers;

    function runCommand(event) {
        ipcRenderer.send('run-command', event.currentTarget.dataset.command);
    }

    // Update page display and controls
    function updatePages(direction) {


        pages.forEach((page, index) => {

            gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

            gameContainers.forEach((container) => {
                container.removeEventListener('click', runCommand);
                container.classList.remove('selected');
            });

            if (index === currentIndex) {

                gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

                page.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
                currentPageIndex = currentIndex;
                console.log("gameContainers.length: ", gameContainers.length);

                // Clear any previous selection and attach mouseenter for hover effect
                gameContainers.forEach((container) => {
                    container.classList.remove('selected');
                    container.addEventListener('mouseenter', function () {
                        gameContainers.forEach((c) => c.classList.remove('selected'));
                        container.classList.add('selected');
                    });

                    container.addEventListener('click', runCommand);

                });

                // Select and focus the first game container
                const firstGameContainer = page.querySelector('.game-container');
                if (firstGameContainer) {
                    firstGameContainer.classList.add('selected');
                    firstGameContainer.focus();
                    firstGameContainer.scrollIntoView({
                        behavior: "instant",
                        block: "center"
                    });
                    console.log("firstGameContainer: ", firstGameContainer);
                }

                // Update header platform name and image
                document.querySelector('header .platform-name').textContent = LB.utils.capitalizeWord(page.dataset.platform);
                document.querySelector('header .platform-image').style.backgroundImage =
                    `url('../img/platforms/${page.dataset.platform}.png')`;

                // Update navigation links
                document.querySelector('header .prev-link').onclick = function () {
                    prevPage();
                };
                document.querySelector('header .next-link').onclick = function () {
                    nextPage();
                };

                // Mark as active page
                page.classList.add('active');
                page.classList.remove('next', 'prev');

            } else if (index < currentIndex) {
                page.classList.remove('active', 'next');
                page.classList.add('prev');
            } else if (index > currentIndex) {
                page.classList.remove('active', 'prev');
                page.classList.add('next');
            }
        });
    }

    function nextPage() {
        currentIndex = (currentIndex + 1) % totalPages;
        updatePages('next');
    }

    function prevPage() {
        currentIndex = (currentIndex - 1 + totalPages) % totalPages;
        updatePages('prev');
    }

    // --- Toggling between gallery and menu key handlers ---

    let isMenuOpen = false;
    let selectedIndex = 0;
    let ImageMenuSelectedIndex = 0;

    // Initially, attach the gallery key handler globally.
    window.addEventListener('keydown', _onGalleryKeyDown);

    // If disabledPlatform was passed, open the menu immediately.
    if (disabledPlatform) {
        _toggleMenu(Array.from(document.querySelectorAll('.game-container') || []),
            selectedIndex, _onGalleryKeyDown, isMenuOpen, disabledPlatform);
    }

    // _toggleMenu switches keydown handlers between gallery and menu modes.
    function _toggleMenu(gameContainers, selectedIndex, galleryListener, isMenuOpen, platformToOpen) {
        const menu = document.getElementById('menu');
        const menuContainer = document.getElementById('menu-container');
        const controls = document.getElementById('controls');
        let menuSelectedIndex = 1;
        const selectedGame = LB.utils.getSelectedGame(gameContainers, selectedIndex);
        const selectedGameImg = selectedGame.querySelector('.game-image');

        // Menu-specific keydown handler
        function menuOnKeyDown(event) {
            console.log("menuSelectedIndex: ", menuSelectedIndex);
            console.log("isMenuOpen: ", isMenuOpen);

            // Stop propagation so no other listener reacts
            event.stopPropagation();
            event.stopImmediatePropagation();

            const menuGameContainers = Array.from(menu.querySelectorAll('.menu-game-container'));
            console.log("menuGameContainers len: ", menuGameContainers.length);

            switch (event.key) {
                case 'ArrowRight':
                    if (event.shiftKey) {
                        // Optionally, call nextPage();
                    } else {
                        menuSelectedIndex = (menuSelectedIndex + 1) % menuGameContainers.length;
                    }
                    break;
                case 'ArrowLeft':
                    if (event.shiftKey) {
                        // Optionally, call prevPage();
                    } else {
                        if (menuSelectedIndex !== 1) {
                            menuSelectedIndex = (menuSelectedIndex - 1 + menuGameContainers.length) % menuGameContainers.length;
                        }
                    }
                    break;
                case 'ArrowUp':
                    if (menuSelectedIndex > LB.galleryNumOfCols) {
                        menuSelectedIndex = Math.max(menuSelectedIndex - LB.galleryNumOfCols, 0);
                    }
                    break;
                case 'ArrowDown':
                    menuSelectedIndex = Math.min(menuSelectedIndex + LB.galleryNumOfCols, menuGameContainers.length);
                    break;
                case 'i':
                    _closeMenu();
                    break;
                case 'Enter':
                    {
                        const menuSelectedGame = LB.utils.getSelectedGame(menuGameContainers, menuSelectedIndex);
                        const menuSelectedGameImg = menuSelectedGame.querySelector('.game-image');
                        _closeMenu(menuSelectedGameImg.src);
                    }
                    break;
                case 'Escape':
                    _closeMenu();
                    break;
            }

            menuGameContainers.forEach((container, index) => {
                container.classList.toggle('selected', index === menuSelectedIndex);
            });
            if (!event.shiftKey) {
                if (menuSelectedIndex < menuGameContainers.length && menuSelectedIndex > 0) {
                    menuGameContainers[menuSelectedIndex].scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }
            }
        }

        const downloadImage = async (imgSrc, platform, gameName) => {
            try {
                const result = await ipcRenderer.invoke('download-image', imgSrc, platform, gameName);
                if (result.success) {
                    console.log(`Image saved at ${result.path}`);
                } else {
                    console.error(`Error saving image: ${result.error}`);
                }
            } catch (error) {
                console.error('Error communicating with main process:', error);
                alert('Failed to save image');
            }
        };

        async function _closeMenu(imgSrc) {
            // Restore header navigation opacity
            document.querySelector('header .prev-link').style.opacity = 1;
            document.querySelector('header .next-link').style.opacity = 1;
            console.log("selectedIndex after: ", selectedIndex);
            LB.imageSrc = imgSrc;
            console.log("closeMenu: ");
            menuContainer.innerHTML = '';
            menu.style.height = '0';

            // Remove menu key handler and reattach gallery handler
            window.removeEventListener('keydown', menuOnKeyDown);
            window.addEventListener('keydown', galleryListener);

            if (imgSrc) {
                const selectedGameImg = selectedGame.querySelector('.game-image');
                if (!selectedGameImg) return;
                selectedGameImg.src = imgSrc + '?t=' + new Date().getTime();

                const spinner = document.createElement('div');
                spinner.classList.add(`spinner-${Math.floor(Math.random() * 20) + 1}`, 'spinner', 'image-spinner');
                selectedGame.appendChild(spinner);

                selectedGameImg.onload = () => {
                    selectedGameImg.style.transform = "scale(1)";
                    selectedGameImg.style.opacity = "1";
                    spinner.remove();
                };

                downloadImage(imgSrc, selectedGame.dataset.platform, selectedGame.dataset.gameName);
            }
            isMenuOpen = false;
        }

        function _openMenu(platformToOpen) {
            menu.style.height = '83vh';
            document.querySelector('#header .prev-link').style.opacity = 0;
            document.querySelector('#header .next-link').style.opacity = 0;
            console.log("platformToOpen: ", platformToOpen);
            menuContainer.innerHTML = '';

            // Remove the gallery listener and add the menu listener
            window.removeEventListener('keydown', galleryListener);
            window.addEventListener('keydown', menuOnKeyDown);

            // Build menu content for the selected game
            gameContainers.forEach(async (container, index) => {
                if (index === selectedIndex) {
                    console.log("container: ", container);
                    if (container.classList.contains('settings')) {
                        const platformForm = LB.build.platformForm(platformToOpen || container.dataset.platform);
                        menuContainer.appendChild(platformForm);

                        const platformToggle = document.getElementById('input-platform-toggle-checkbox');
                        const gamesDirInput = document.getElementById('input-games-dir');
                        const emulatorInput = document.getElementById('input-emulator');
                        const emulatorArgs = document.getElementById('input-emulator-args');
                        const platformText = document.getElementById('platform-text-div');

                        if (platformToggle) {
                            platformToggle.addEventListener('click', (event) => {
                                console.log("event: ", event);
                                const gamesDir = gamesDirInput.value;
                                const emulator = emulatorInput.value;
                                const shouldPreventCheck = !gamesDir || !emulator;
                                console.log("shouldPreventCheck: ", shouldPreventCheck);
                                if (shouldPreventCheck) {
                                    event.preventDefault();
                                    console.log("Checkbox state change prevented.");
                                    platformText.textContent = 'Please provide both a games directory and an emulator and an emulator and an emulator.';
                                } else {
                                    platformToggle.addEventListener('change', () => {
                                        document.getElementById('form-status-label').textContent =
                                            platformToggle.checked ? "Enabled" : "Disabled";
                                    });
                                }
                            });
                        }
                    } else {
                        const gameImage = container.querySelector('img');
                        await LB.build.gameMenu(container.title, gameImage)
                            .then((gameMenu) => {
                                menuContainer.appendChild(gameMenu);
                                const spinner = document.body.querySelector('.spinner');
                                setTimeout(() => spinner.remove(), 500);
                                const menuGameContainers = Array.from(gameMenu.querySelectorAll('.menu-game-container'));
                                console.log("menuGameContainers len: ", menuGameContainers.length);
                            });
                    }
                }
            });
        }

        // Toggle between open/close states
        if (!isMenuOpen) {
            console.log("disabledPlatformZ: ", platformToOpen);
            _openMenu(platformToOpen);
            isMenuOpen = true;
        } else {
            _closeMenu();
            isMenuOpen = false;
        }
    }

    // Gallery keydown handler
    function _onGalleryKeyDown(event) {
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
            case 'PageUp':
                selectedIndex = Math.max(selectedIndex - LB.galleryNumOfCols * 10, 0);
                break;
            case 'PageDown': {
                const col = selectedIndex % LB.galleryNumOfCols;
                const currentRow = Math.floor(selectedIndex / LB.galleryNumOfCols);
                const newRow = currentRow + 10;
                let newIndex = newRow * LB.galleryNumOfCols + col;
                selectedIndex = Math.min(newIndex, gameContainers.length - 1);
                break;
            }
            case 'i':
                console.log("i: isMenuOpen: ", isMenuOpen);
                _toggleMenu(gameContainers, selectedIndex, _onGalleryKeyDown, isMenuOpen);
                break;
            case 'F5':
                window.location.reload();
                break;
            case 'Enter': {
                const selectedGame = LB.utils.getSelectedGame(gameContainers, selectedIndex);
                console.log("currentPageIndex: ", currentPageIndex);
                if (currentPageIndex === 0) {
                    _toggleMenu(gameContainers, selectedIndex, _onGalleryKeyDown, isMenuOpen);
                } else {
                    ipcRenderer.send('run-command', selectedGame.dataset.command);
                }
                break;
            }
            case 'Escape':
                document.getElementById('slideshow').style.display = 'flex';
                document.getElementById('galleries').style.display = 'none';
                window.removeEventListener('keydown', _onGalleryKeyDown);
                LB.control.initSlideShow(currentIndex);
                break;
            default:
                break;
        }

        // Update selected state for each container and attach click listeners if needed
        gameContainers.forEach((container, index) => {
            container.classList.toggle('selected', index === selectedIndex);
            container.addEventListener('click', (event) => {
                console.log("event.currentTarget in control: ", event.currentTarget);
                // Optionally send command: ipcRenderer.send('run-command', event.currentTarget.dataset.command);
            });
        });

        if (!event.shiftKey && selectedIndex < gameContainers.length && selectedIndex > 0) {
            gameContainers[selectedIndex].scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }

    // Wheel events for page navigation or simulating arrow key events
    galleries.addEventListener('wheel', (event) => {
        event.preventDefault();
        if (event.shiftKey) {
            if (event.deltaY > 0) {
                nextPage();
            } else if (event.deltaY < 0) {
                prevPage();
            }
        } else {
            if (event.deltaY > 0) {
                simulateKeyDown('ArrowDown');
            } else if (event.deltaY < 0) {
                simulateKeyDown('ArrowUp');
            }
        }
    });

    // Initialize the carousel pages
    updatePages();
}


function simulateKeyDown(key) {
  const keyCode = key === 'ArrowDown' ? 40 : 38;
  const keyboardEvent = new KeyboardEvent('keydown', {
    key,
    code: key,
    keyCode,
    which: keyCode,
    bubbles: true
  });
  document.dispatchEvent(keyboardEvent);
}

function initGamepad () {
    const gamepads = navigator.getGamepads();
    const connected = Array.from(gamepads).some(gamepad => gamepad !== null);

    if (connected) {
        console.log('Gamepad connected at startup:', gamepads[0].id);
    } else {
        console.log('No gamepad connected at startup.');
    }

    const buttonStates = {
        0: false, // Cross button (X)
        1: false, // Circle button (O)
        2: false, // Square button
        3: false, // Triangle button
        4: false, // L1 button
        5: false, // R1 button
        6: false, // L2 button
        7: false, // R2 button
        8: false, // Share button
        9: false, // Options button
        10: false, // L3 button (Left stick click)
        11: false, // R3 button (Right stick click)
        12: false, // D-pad up
        13: false, // D-pad down
        14: false, // D-pad left
        15: false, // D-pad right
        16: false, // PS button (Home button)
    };

    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', (event) => {
        console.log('Gamepad connected:', event.gamepad.id);
        requestAnimationFrame(pollGamepad);
    });

    window.addEventListener('gamepaddisconnected', (event) => {
        console.log('Gamepad disconnected:', event.gamepad.id);
        cancelAnimationFrame(pollGamepad);
    });

    function pollGamepad() {
        let animationFrameId = null;
        // If the document doesn't have focus, simply skip processing
        if (!document.hasFocus()) {
            // Optionally, we can cancel polling here
            // or simply schedule the next check
            animationFrameId = requestAnimationFrame(pollGamepad);
            return;
        }

        const gamepads = navigator.getGamepads();
        const gamepad = gamepads[0]; // Use the first connected gamepad

        if (gamepad) {
            // Check all relevant buttons
            [0, 1, 2, 3, 12, 13, 14, 15].forEach((buttonIndex) => {
                const button = gamepad.buttons[buttonIndex];
                const wasPressed = buttonStates[buttonIndex];

                if (button.pressed && !wasPressed) {
                    // Button is pressed for the first time
                    buttonStates[buttonIndex] = true;
                } else if (!button.pressed && wasPressed) {
                    // Button is released
                    buttonStates[buttonIndex] = false;
                    console.log("Button released:", buttonIndex);

                    // Trigger the action only on button release
                    handleButtonPress(buttonIndex);
                }
            });
        }

        // Continue polling
        animationFrameId = requestAnimationFrame(pollGamepad);
    }

    function handleButtonPress(buttonIndex) {

        switch (buttonIndex) {
        case 0:
            simulateKeyDown('Enter');
            break;
        case 1:
            simulateKeyDown('Escape');
            break;
        case 2:
            simulateKeyDown('i');
            break;
        case 3:
            console.log("3 (triangle)");
            break;
        case 12:
            simulateKeyDown('ArrowUp');
            break;
        case 13:
            simulateKeyDown('ArrowDown');
            break;
        case 14:
            simulateKeyDown('ArrowLeft');
            break;
        case 15:
            simulateKeyDown('ArrowRight');
            break;
        case 15:
            simulateKeyDown('ArrowRight');
            break;
        case 15:
            simulateKeyDown('ArrowRight');
            break;
        }
    }

}

LB.control = {
    initGallery: initGallery,
    initSlideShow: initSlideShow,
    initGamepad: initGamepad
};
