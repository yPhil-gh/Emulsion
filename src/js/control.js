// document.getElementById('closeAbout').addEventListener('click', () => {
//     document.getElementById('aboutContainer').style.display = 'none';
//     document.getElementById('aboutContent').innerHTML = '';
// });

function initSlideShow(platformToDisplay) {

    const slideshow = document.getElementById("slideshow");

    document.getElementById('header').style.display = 'none';

    document.body.style.display = "block";
    const slides = Array.from(slideshow.querySelectorAll('.slide'));
    const totalSlides = slides.length;
    const radius = 500;
    let currentIndex = platformToDisplay ? platformToDisplay : 0;

    function updateHomeCarousel() {
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
        updateHomeCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
        updateHomeCarousel();
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
        slide.addEventListener('click', (event) => {
            event.stopPropagation();
            if (slide.classList.contains('adjacent')) {
                currentIndex = index; // Set the clicked slide as the current slide
                updateHomeCarousel();
            } else if (slide.classList.contains('active')) {
                simulateKeyDown('Enter');
            }
        });
    });

    window.addEventListener('keydown', homeKeyDown);

    function homeKeyDown (event) {
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
            window.removeEventListener('keydown', homeKeyDown);

            let activeGalleryIndex;
            let activePlatformName;

            slides.forEach((slide, index) => {
                // console.log("slide, index: ", slide, index);
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

    LB.utils.updateControls('dpad', 'button-dpad-ew', 'Browse<br>Platforms', 'on');
    LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'off');
    LB.utils.updateControls('square', 'same', 'same', 'off');
    LB.utils.updateControls('circle', 'same', 'Exit');

    updateHomeCarousel();
}

function setGalleryControls(currentIndex) {
    if (currentIndex === 0) {
        LB.utils.updateControls('dpad', 'button-dpad-nesw', 'Browse<br>Platforms', 'on');
        LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'off');
        LB.utils.updateControls('square', 'same', 'Fetch<br>cover', 'off');
    } else {
        LB.utils.updateControls('dpad', 'button-dpad-nesw', 'Browse<br>Games', 'on');
        LB.utils.updateControls('square', 'same', 'Fetch<br>cover', 'on');
        LB.utils.updateControls('shoulders', 'same', 'Browse<br>Platforms', 'on');
    }
    LB.utils.updateControls('circle', 'same', 'Back');
}

function initGallery(currentIndex, disabledPlatform) {

    console.log("currentIndex init gal: ", currentIndex);

    setGalleryControls(currentIndex);

    const header = document.getElementById('header');
    header.style.display = 'flex';

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const totalPages = pages.length;

    let currentPageIndex = currentIndex; // Initialize currentPageIndex
    let gameContainers = []; // Initialize gameContainers

    const enabledPages = pages.filter(page => page.dataset.status !== 'disabled');

    function updatePagesCarousel() {
        pages.forEach((page, pageIndex) => {
            const pageIndexNumber = Number(page.dataset.index);

            if (page.dataset.status === 'disabled') {
                // Skip disabled pages
                page.classList.remove('active', 'next', 'prev');
                return;
            }

            if (pageIndexNumber === currentIndex) {

                page.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                // if (currentIndex === 0) {
                //     LB.utils.updateControls('square', 'same', 'Fetch cover', 'off');
                // } else {
                //     LB.utils.updateControls('square', 'same', 'Fetch<br>cover', 'on');
                // }

                setGalleryControls(currentIndex);

                currentPageIndex = currentIndex;
                gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

                gameContainers.forEach((container, index) => {
                    container.addEventListener('click', (event) => {
                        if (event.currentTarget.classList.contains('settings')) {
                            _toggleMenu(Array.from(document.querySelectorAll('.game-container') || []), event.currentTarget.dataset.index / 1, galleryKeyDown, false, disabledPlatform);
                        } else {
                            ipcRenderer.send('run-command', event.currentTarget.dataset.command);
                        }
                    });
                    container.classList.remove('selected');
                });

                const firstGameContainer = page.querySelector('.game-container');
                firstGameContainer.classList.add('selected');
                firstGameContainer.focus();
                firstGameContainer.scrollIntoView({
                    behavior: "instant",
                    block: "center"
                });

                document.querySelector('header .platform-name').textContent = LB.utils.capitalizeWord(page.dataset.platform);
                document.querySelector('header .item-type').textContent = currentIndex === 0 ? ' platforms' : ' games';
                document.querySelector('header .item-number').textContent = gameContainers.length;

                const platformImage = document.createElement('img');
                if (page.dataset.platform === 'settings') {
                    document.querySelector('header .platform-image').style.backgroundImage = `url('../../img/emulsion.png')`;
                } else {
                    platformImage.src = `../img/platforms/${page.dataset.platform}.png`;
                    platformImage.classList.add(page.dataset.platform);
                    document.querySelector('header .platform-image').style.backgroundImage = `url('../../img/platforms/${page.dataset.platform}.png')`;
                }

                // document.querySelector('header .platform-image').appendChild(platformImage);

                document.querySelector('header .prev-link').onclick = function() {
                    prevPage();
                };

                document.querySelector('header .next-link').onclick = function() {
                    nextPage();
                };

                // Active page
                page.classList.add('active');
                page.classList.remove('next', 'prev');
            } else if (pageIndexNumber < currentIndex) {
                // Previous page
                page.classList.remove('active', 'next');
                page.classList.add('prev');
            } else if (pageIndexNumber > currentIndex) {
                // Next page
                page.classList.remove('active', 'prev');
                page.classList.add('next');
            }
        });
    }

    function nextPage() {
        // Find the index of the current page in the enabledPages array
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentIndex);
        const nextEnabledIndex = (currentEnabledIndex + 1) % enabledPages.length;

        // Update currentIndex to the next enabled page's dataset.index
        currentIndex = Number(enabledPages[nextEnabledIndex].dataset.index);

        updatePagesCarousel();
    }

    function prevPage() {
        const currentEnabledIndex = enabledPages.findIndex(page => Number(page.dataset.index) === currentIndex);
        const prevEnabledIndex = (currentEnabledIndex - 1 + enabledPages.length) % enabledPages.length;
        currentIndex = Number(enabledPages[prevEnabledIndex].dataset.index);
        updatePagesCarousel();
    }

    let isMenuOpen = false;
    let selectedIndex = 0;

    if (disabledPlatform) {
        _toggleMenu(Array.from(document.querySelectorAll('.game-container') || []), selectedIndex, galleryKeyDown, isMenuOpen, disabledPlatform);
    }

    function _toggleMenu(gameContainers, selectedIndex, listener, isMenuOpen, platformToOpen) {

        const menu = document.getElementById('menu');
        const menuContainer = document.getElementById('menu-container');

        // const footer = document.getElementById('footer');
        // const footerMenuContainer = document.getElementById('footer-menu-container');

        const controls = document.getElementById('controls');

        let menuSelectedIndex = 1;

        const selectedGame = LB.utils.getSelectedGame(gameContainers, selectedIndex);
        const selectedGameImg = selectedGame.querySelector('.game-image');

        function menuKeyDown(event) {

            event.stopPropagation();
            event.stopImmediatePropagation(); // Stops other listeners on the same element
            const menuGameContainers = Array.from(menu.querySelectorAll('.menu-game-container'));
            console.log("menuGameContainers len: ", menuGameContainers.length);

            switch (event.key) {
            case 'ArrowRight':
                if (event.shiftKey) {
                    // nextPage();
                } else {
                    menuSelectedIndex = (menuSelectedIndex + 1) % menuGameContainers.length;
                    // selectedIndex = (selectedIndex + 1) % gameContainers.length;
                }
                break;
            case 'ArrowLeft':
                if (event.shiftKey) {
                    // prevPage();
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
            case 'Enter':
                const menuSelectedGame = LB.utils.getSelectedGame(menuGameContainers, menuSelectedIndex);
                const menuSelectedGameImg = menuSelectedGame.querySelector('.game-image');
                _closeMenu(menuSelectedGameImg.src);
                break;
            case 'F5':
                window.location.reload();
                break;
            case 'Escape':
                window.location.reload();
                // _closeMenu();
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

        function _openMenu(platformToOpen) {

            LB.utils.updateControls('square', 'same', 'Fetch cover', 'off');
            LB.utils.updateControls('dpad', 'same', 'Fetch cover', 'off');

            menu.style.height = '83vh';

            document.querySelector('#header .prev-link').style.opacity = 0;
            document.querySelector('#header .next-link').style.opacity = 0;

            menuContainer.innerHTML = '';

            window.removeEventListener('keydown', listener);
            window.addEventListener('keydown', menuKeyDown);


            gameContainers.forEach(async (container, index) => {
                if (index === selectedIndex) {

                    if (container.classList.contains('settings')) {

                        const platformForm = LB.build.platformForm(platformToOpen || container.dataset.platform);
                        menuContainer.appendChild(platformForm);

                        document.querySelector('header .item-number').textContent = gameContainers.length;
                        document.querySelector('header .item-type').textContent = ' platforms';

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

        async function _closeMenu(imgSrc) {

            // LB.utils.updateControls('square', 'same', 'Fetch cover', 'on');
            LB.utils.updateControls('dpad', 'same', 'Browse', 'on');

            document.querySelector('header .prev-link').style.opacity = 1;
            document.querySelector('header .next-link').style.opacity = 1;

            console.log("selectedIndex after: ", selectedIndex);

            LB.imageSrc = imgSrc;
            console.log("closeMenu: ");
            document.getElementById('menu-container').innerHTML = '';
            // footer.style.height = '100px'; // original height

            menu.style.height = '0';

            // controls.style.display = 'flex';
            window.removeEventListener('keydown', menuKeyDown);
            window.addEventListener('keydown', listener);

            if (imgSrc) {
                const selectedGameImg = selectedGame.querySelector('.game-image');
                if (!selectedGameImg) return;

                // LB.utils.updateControls('circle', 'same', 'Back');

                // Create a burst effect by rapidly scaling and fading out
                // selectedGameImg.style.transform = "scale(1.3)";
                // selectedGameImg.style.opacity = "0";

                selectedGameImg.src = imgSrc + '?t=' + new Date().getTime();

                const spinner = document.createElement('div');
                spinner.classList.add(`spinner-${Math.floor(Math.random() * 20) + 1}`, 'spinner');
                spinner.classList.add('image-spinner');

                selectedGame.appendChild(spinner);

                selectedGameImg.onload = () => {
                    // Zoom in with a punchy effect
                    selectedGameImg.style.transform = "scale(1)";
                    selectedGameImg.style.opacity = "1";
                    spinner.remove();
                };

                downloadImage(imgSrc, selectedGame.dataset.platform, selectedGame.dataset.gameName);

            }


            isMenuOpen = false;
        }

        if (!isMenuOpen) {
            _openMenu(disabledPlatform);
            isMenuOpen = true;
        } else {
            _closeMenu();
            isMenuOpen = false;
        }
    }

    function galleryKeyDown(event) {
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
        case 'Home':
            selectedIndex = 3;
            break;
        case 'End':
            selectedIndex = gameContainers.length - 1;
            break;
        case 'PageDown':
            // selectedIndex = Math.min(selectedIndex + (LB.galleryNumOfCols + 10), gameContainers.length);
            // Assume LB.galleryNumOfCols is the number of columns
            const col = selectedIndex % LB.galleryNumOfCols;              // current column index
            const currentRow = Math.floor(selectedIndex / LB.galleryNumOfCols); // current row
            const newRow = currentRow + 10;                                // move 10 rows down

            // Compute the new index in the same column
            let newIndex = newRow * LB.galleryNumOfCols + col;

            // Clamp the new index to ensure it doesn't exceed the number of containers
            selectedIndex = Math.min(newIndex, gameContainers.length - 1);
            break;
        case 'i':
            console.log("i: isMenuOpen: ", isMenuOpen);
            _toggleMenu(gameContainers, selectedIndex, galleryKeyDown, isMenuOpen);
            // window.removeEventListener('keydown', _handleKeyDown);
            break;
        case 'F5':
            window.location.reload();
            break;

        case 'Enter':
            const selectedGameContainer = LB.utils.getSelectedGame(gameContainers, selectedIndex);
            if (currentPageIndex === 0) {
                _toggleMenu(gameContainers, selectedIndex, galleryKeyDown, isMenuOpen);
            } else {
                selectedGameContainer.classList.add('launching');
                setTimeout(() => {
                    ipcRenderer.send('run-command', selectedGameContainer.dataset.command);
                }, 600);
            }
            break;
        case 'Escape':
            document.getElementById('slideshow').style.display = 'flex';
            document.getElementById('galleries').style.display = 'none';
            window.removeEventListener('keydown', galleryKeyDown);
            LB.control.initSlideShow(currentIndex);
            document.querySelector('header .item-number').textContent = '';
            break;
        }

        gameContainers.forEach((container, index) => {
            container.classList.toggle('selected', index === selectedIndex);
        });

        if (!event.shiftKey && selectedIndex < gameContainers.length && selectedIndex > 0) {
            gameContainers[selectedIndex].scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }

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

    window.addEventListener('keydown', galleryKeyDown);
    updatePagesCarousel(); // Initialize the carousel
}

function simulateKeyDown(key) {

    let keyCode;
    switch (key) {
    case 'ArrowLeft':
        keyCode = 37;
        break;
    case 'ArrowRight':
        keyCode = 39;
        break;
    case 'ArrowUp':
        keyCode = 38;
        break;
    case 'ArrowDown':
        keyCode = 40;
        break;
    case 'Shift':
        keyCode = 16;
        break;
    case 'Enter':
        keyCode = 13;
        break;
    case 'Escape':
        keyCode = 27;
        break;
    }

    const keyboardEvent = new KeyboardEvent('keydown', {
        key:key,
        code: key,
        keyCode:keyCode,
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
