// document.getElementById('closeAbout').addEventListener('click', () => {
//     document.getElementById('aboutContainer').style.display = 'none';
//     document.getElementById('aboutContent').innerHTML = '';
// });

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
        slide.addEventListener('click', (event) => {
            event.stopPropagation();
            if (slide.classList.contains('adjacent')) {
                currentIndex = index; // Set the clicked slide as the current slide
                updateCarousel();
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
                    activeGalleryIndex = slide.dataset.index;
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
    console.log("currentIndex: ", currentIndex);

    LB.utils.updateControls('dpad', 'button-dpad-nesw', 'same');
    LB.utils.updateControls('square', 'same', 'Fetch cover', 'on');
    LB.utils.updateControls('circle', 'same', 'Back');

    const header = document.getElementById('header');
    header.style.display = 'flex';

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const totalPages = pages.length;

    let currentPageIndex = currentIndex; // Initialize currentPageIndex
    let gameContainers = []; // Initialize gameContainers

    function updateCarousel() {
        console.log("currentIndex: ", currentIndex);
        pages.forEach((page, pageIndex) => {
            // Convert page.dataset.index to a number for comparison
            const pageIndexNumber = Number(page.dataset.index);

            if (pageIndexNumber === currentIndex) {
                console.log("YEAH! page.dataset.index, currentIndex: ", pageIndexNumber, currentIndex);

                page.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });

                if (currentIndex === 0) {
                    console.log("Bingo!: ");
                    LB.utils.updateControls('square', 'same', 'Fetch cover', 'off');
                } else {
                    LB.utils.updateControls('square', 'same', 'Fetch cover', 'on');
                }

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

                if (page.dataset.platform === 'settings') {
                    document.querySelector('header .platform-image').style.backgroundImage = `url('../img/emume.png')`;
                } else {
                    document.querySelector('header .platform-image').style.backgroundImage = `url('../img/platforms/${page.dataset.platform}.png')`;
                }

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
                console.log("NOPE pageIndex, currentIndex: ", pageIndexNumber, currentIndex);
                // Previous page
                page.classList.remove('active', 'next');
                page.classList.add('prev');
            } else if (pageIndexNumber > currentIndex) {
                console.log("NOPE pageIndex, currentIndex: ", pageIndexNumber, currentIndex);
                // Next page
                page.classList.remove('active', 'prev');
                page.classList.add('next');
            }
        });
    }

    function nextPage() {
        currentIndex = (currentIndex + 1) % totalPages;
        console.log("currentIndex: ", currentIndex);
        updateCarousel();
    }

    function prevPage() {
        currentIndex = (currentIndex - 1 + totalPages) % totalPages;
        updateCarousel();
    }

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

    if (disabledPlatform) {
        _toggleMenu(Array.from(document.querySelectorAll('.game-container') || []), selectedIndex, galleryKeyDown, isMenuOpen, disabledPlatform);
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
    updateCarousel(); // Initialize the carousel
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
