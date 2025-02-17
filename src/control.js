const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

function updatePlatormsMenu({ pad = "Browse", cross = "Select", square = "Config", circle = "Exit" } = {}) {
    const squareSpan = document.getElementById("square-span");
    squareSpan.textContent = square;
}

function updateControlsMenu({ message = "plop" }) {
    const msgDiv = document.getElementById("message");
    const msgSpan = document.getElementById("message-span");

    msgDiv.style.visibility = "visible";
    msgSpan.textContent = message;

    setTimeout(() => {
        msgDiv.style.visibility = "hidden";
    }, 1000);

}

function showStatus(message) {

    const helpBar = document.getElementById("help-bar");
    helpBar.style.transform = "translateY(100%)";

    const statusBar = document.getElementById("status-bar");
    if (!statusBar) return;

    const statusSpan = document.getElementById("status-span");

    statusSpan.textContent = message;

    statusBar.style.transform = "translateY(0)";

    // After 6 seconds, hide the status bar again.
    setTimeout(() => {
        statusBar.style.transform = "translateY(100%)";
    }, 6000);
}

function simulateKeyPress(key) {

    function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
    }

    console.log("simulateKeyPress: ", key);
    const event = new KeyboardEvent('keydown', {
        key: key,
        code: key === 'Escape' ? 'Escape' : `Arrow${key.slice(5)}`,
        bubbles: true,
    });

    const slideshow = document.getElementById('slideshow');
    const gallery = document.getElementById('gallery');

    if (isElementVisible(slideshow)) {
        slideshow.dispatchEvent(event);
    }
    if (isElementVisible(gallery)) {
        gallery.dispatchEvent(event);
    }
}

window.control = {
    updateControlsMenu: updateControlsMenu,
    showStatus: showStatus,
    initSlideShow: function (slideshow) {
        document.body.style.display = "block";
        const slides = Array.from(slideshow.querySelectorAll('.slide'));
        const totalSlides = slides.length;
        const radius = 500;
        let currentIndex = 0;

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

        function showForm(slide) {
            const isReady = slide.classList.contains('ready');
            const form = slides[currentIndex].querySelector('.slide-form-container');
            if (!isReady) {
                form.style.display = 'block';
            }
        }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
            showForm(slides[currentIndex]);
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
            showForm(slides[currentIndex]);
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
                    simulateKeyPress('Enter');
                }
            });
        });

        async function showExitDialog() {
            const response = await ipcRenderer.invoke('show-quit-dialog');
            if (response === 'yes') {
                ipcRenderer.send('quit');
            }

        }

        // Keyboard navigation
        slideshow.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowRight') {
                nextSlide();
            } else if (event.key === 'ArrowLeft') {
                prevSlide();
            } else if (event.key === 'Escape') {

                updateControlsMenu({message: "Really Exit?"});
                showExitDialog();
            } else if (event.key === 'i') {
                const form = slides[currentIndex].querySelector('.slide-form-container');

                if (form.style.display === 'block' && slides[currentIndex].classList.contains("ready")) {
                    form.style.display = 'none';
                } else {
                    form.style.display = 'block';
                }

            } else if (event.key === 'Enter') {

                if (slides[currentIndex].classList.contains('ready')) {
                    // Hide the slideshow div
                    document.getElementById('slideshow').style.display = 'none';
                    document.getElementById('galleries').style.display = "block";
                    document.getElementById('top-menu').style.display = "flex";

                    const platform = slides[currentIndex].getAttribute('data-platform');
                    const gamesDir = slides[currentIndex].getAttribute('data-games-dir');
                    const emulator = slides[currentIndex].getAttribute('data-emulator');
                    const emulatorArgs = slides[currentIndex].getAttribute('data-emulator-args');

                    const galleries = document.querySelectorAll('.gallery');

                    galleries.forEach(gallery => {
                        gallery.style.display = "none";
                    });

                    const galleryToShow = document.querySelector(`#gallery-${platform}`);

                    galleryToShow.style.display = "grid";

                    window.topMenu.style.visibility = "visible";

                    window.control.initGalleryNav(galleryToShow);
                    // window.control.initTopMenuNav();
                    window.control.setTopMenuPlatform(platform);

                    // setDisplayedPlatform(platform);
                }
            }
        });

        updateCarousel();
    },
    initTopMenuNav: function() {

        document.getElementById('dpad-icon').src = "./img/controls/dpad-horiz.png";

        const arrows = document.querySelectorAll('.arrows');

        arrows.forEach(arrow => {
            arrow.style.display = "block";
        });

        document.getElementById('top-menu').style.display = "flex";

        let currentIndex = 0; // Track the current slide index
        let isFirstSet = true; // Flag to track if it's the first time setting the slide

        // Get references to the slider and items
        const slider = document.getElementById('top-menu-slider');
        const items = document.getElementById('top-menu-items');
        const slides = document.querySelectorAll('.top-menu-slide');
        const slideWidth = slides[0].offsetWidth; // Width of one slide

        // Function to update the slide position
        const updateSlidePosition = () => {
            if (isFirstSet) {
                // Disable transition for the first set
                items.style.transition = 'none';
            } else {
                // Enable transition for subsequent sets
                items.style.transition = 'transform 0.5s ease';
            }

            items.style.transform = `translateX(-${currentIndex * slideWidth}px)`;

            // Force a reflow to apply the transition change
            void items.offsetWidth;

            // Reset the transition after the first set
            if (isFirstSet) {
                isFirstSet = false;
            }
        };

        const galleries = document.getElementById('galleries');

        function displayGallery(index) {
            const galleries = document.querySelectorAll('.gallery');
            const totalGalleries = galleries.length;

            // Calculate the current index with wrap-around
            currentIndex = (index + totalGalleries) % totalGalleries;

            // Hide all galleries
            galleries.forEach(gallery => {
                gallery.style.display = "none";
            });

            // Display the selected gallery
            const galleryToDisplay = galleries[currentIndex];
            galleryToDisplay.style.display = "grid";
            galleryToDisplay.classList.add('fadeIn');

        }

        function updatePlatformName(index) {
            const allPlatformSlides = document.querySelectorAll('.top-menu-slide');
            const slides = Array.from(allPlatformSlides);

            allPlatformSlides.forEach(platform => {
                platform.style.opacity = "0";
                platform.style.display = "none";
            });
            // document.body.offsetHeight; // force a reflow
            slides[index].style.display = "flex";
            slides[index].classList.add('fadeIn');

            console.log("index: ", slides[index]);
        }

        // Function to handle left arrow click or key press
        const goToPreviousSlide = () => {
            console.log("currentIndex: ", currentIndex);
            currentIndex = (currentIndex - 1 + slides.length) % slides.length; // Wrap around
            displayGallery(currentIndex - 1);
            // updateSlidePosition();
            console.log("currentIndex: ", currentIndex);
            updatePlatformName(currentIndex);
        };

        // Function to handle right arrow click or key press
        const goToNextSlide = () => {
            currentIndex = (currentIndex + 1) % slides.length; // Wrap around
            displayGallery(currentIndex + 1);
            // updateSlidePosition();
            updatePlatformName(currentIndex);
        };

        // Function to unregister menu listeners and perform another action
        const unregisterListeners = () => {
            // Remove event listeners
            // topMenu.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleKeyDown);

            // Perform another action (e.g., hide the menu or do something else)
            console.log('Menu listeners unregistered. Perform another action here.');

            const galleries = document.querySelectorAll('.gallery');

            const visibleGallery = Array.from(galleries).find(el => window.getComputedStyle(el).display !== 'none');
            window.control.initGalleryNav(visibleGallery);

            const arrows = document.querySelectorAll('.arrows');

            arrows.forEach(arrow => {
                arrow.style.display = "none";
            });

            visibleGallery.focus();

        };

        // Event handler for clicks (event delegation)
        const handleClick = (event) => {
            if (event.target.closest('.left-arrow')) {
                goToPreviousSlide();
            } else if (event.target.closest('.right-arrow')) {
                goToNextSlide();
            }
        };

        // Event handler for keyboard input
        const handleKeyDown = (event) => {
            switch (event.key) {
            case 'ArrowLeft':
                goToPreviousSlide();
                break;
            case 'ArrowRight':
                goToNextSlide();
                break;
            case 'ArrowDown':
                unregisterListeners();

                break;
            case 'Escape':
                window.control.removeGalleryAndShowSlideshow();
                break;
            case 'ArrowUp':
                // Do nothing
                break;
            default:
                // Ignore other keys
                break;
            }
        };

        // Get the top menu element
        const topMenu = document.getElementById('top-menu');

        // Add event listeners
        topMenu.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);

    },
    setTopMenuPlatform: function(platform) {
        const slides = document.querySelectorAll('.top-menu-slide');
        const items = document.getElementById('top-menu-items');

        if (!slides || !items) {
            console.error('Slides or items container not found.');
            return;
        }

        // Find the index of the slide with the matching platform name
        const index = Array.from(slides).findIndex(slide => {
            const label = slide.querySelector('.top-menu-slide-label').textContent.toLowerCase();
            return label === platform.toLowerCase();
        });

        if (index === -1) {
            console.error(`Platform "${platform}" not found.`);
            return;
        }

        // Calculate the slide width (assuming all slides have the same width)
        const slideWidth = slides[0].offsetWidth;

        // Update the slide position
        // items.style.transition = 'transform 0.5s ease';
        // items.style.transform = `translateX(-${index * slideWidth}px)`;
    },
    removeGalleryAndShowSlideshow: function() {

        document.getElementById('galleries').style.display = "none";
        document.getElementById('top-menu').style.display = "none";

        const slideshow = document.getElementById('slideshow');
        if (slideshow) {
            slideshow.style.display = 'flex';
            document.body.style.perspective = "600px";
            slideshow.focus();
            ipcRenderer.send('change-window-title', "EmumE - Select a Platform");
        }

    },
    initGalleryNav: function(galleryContainer) {

        document.getElementById('dpad-icon').src = "./img/controls/dpad-active.png";

        // Function to simulate a key press
        function simulateKeyPress(key) {
            const event = new KeyboardEvent('keydown', {
                key: key,
                keyCode: key === 'ArrowUp' ? 38 : key === 'ArrowDown' ? 40 : key === 'ArrowLeft' ? 37 : 39, // Key codes for arrow keys
                code: `Arrow${key.slice(5)}`, // Extract direction from key (e.g., "ArrowUp")
                bubbles: true,
            });
            document.dispatchEvent(event);
        }

        const gameContainers = Array.from(galleryContainer.querySelectorAll('.game-container'));

        if (gameContainers.length === 0) return;

        let selectedIndex = 0;
        const columns = 6; // Fixed number of columns

        galleryContainer.tabIndex = -1; // Make the container focusable

        galleryContainer.focus();

        let isOpeningTheMenu = false;

        // Gallery nav
        galleryContainer.addEventListener('keydown', (event) => {

            switch (event.key) {
            case 'ArrowRight':
                selectedIndex = (selectedIndex + 1) % gameContainers.length;
                break;
            case 'ArrowLeft':
                selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
                break;
            case 'ArrowDown':
                selectedIndex = Math.min(selectedIndex + columns, gameContainers.length);
                break;
            case 'ArrowUp':

                const topMenu = document.getElementById('top-menu');


                if (selectedIndex < 6) {
                    gameContainers[selectedIndex].style.border = "none";

                    gameContainers.forEach((container, index) => {
                        container.classList.remove('selected');
                    });

                    console.log("MENU: ");
                    isOpeningTheMenu = true;
                    topMenu.focus();
                    window.control.initTopMenuNav();
                } else {
                    selectedIndex = Math.max(selectedIndex - columns, 0);
                }

                break;
            case 'i':
                const fetchCoverButton = gameContainers[selectedIndex].querySelector('button');

                fetchCoverButton.click();
                break;
            case 'Enter':
                if (document.querySelector('.gallery')) {
                    gameContainers[selectedIndex].click();
                }
                break;
            case 'Escape':
                window.control.removeGalleryAndShowSlideshow();
                break;
            default:
                return; // Exit if no relevant key is pressed
            }

            // Update the selected state
            gameContainers.forEach((container, index) => {
                container.classList.toggle('selected', index === selectedIndex);
            });

            if (selectedIndex < gameContainers.length && selectedIndex > 0) {

                gameContainers[selectedIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'center'
                });

            }

        });

        // Set the first game container as selected by default
        gameContainers[selectedIndex].classList.add('selected');
    },
    initCoversDialogNav: function(coversDialog) {
        const imageContainers = Array.from(coversDialog.querySelectorAll('.image-container'));

        console.log("initCoversDialogNav!!");

        if (imageContainers.length === 0) return;

        let selectedIndex = 0;

        // Make the container focusable
        coversDialog.tabIndex = 0;
        coversDialog.focus();

        coversDialog.addEventListener('keydown', (event) => {
            switch (event.key) {
            case 'ArrowRight':
                // Move to the next image container (wrap around if at the end)
                selectedIndex = (selectedIndex + 1) % imageContainers.length;
                break;
            case 'ArrowLeft':
                // Move to the previous image container (wrap around if at the start)
                selectedIndex = (selectedIndex - 1 + imageContainers.length) % imageContainers.length;
                break;
            case 'Enter':
                // Handle the 'Enter' key
                if (document.querySelector('.gallery')) {
                    imageContainers[selectedIndex].click();
                }
                break;
            case 'Escape':
                // Handle the 'Escape' key
                console.log("Escape pressed");
                break;
            default:
                return; // Ignore other keys
            }

            // Update the selected state
            imageContainers.forEach((container, index) => {
                container.classList.toggle('selected', index === selectedIndex);
            });
        });

        // Set the first image container as selected by default
        imageContainers[selectedIndex].classList.add('selected');
    },
    initGamepad: function() {
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
                simulateKeyPress('Enter');
                ipcRenderer.send('un-focus');
                const selectedContainer = document.querySelector('.game-container.selected');
                if (selectedContainer) {
                    selectedContainer.click();
                }
                break;
            case 1:
                simulateKeyPress('Escape');
                break;
            case 2:
                // simulateKeyPress('Escape');
                console.log("2: ");
                break;
            case 3:
                // simulateKeyPress('Escape');
                console.log("3");
                break;
            case 12:
                simulateKeyPress('ArrowUp');
                break;
            case 13:
                simulateKeyPress('ArrowDown');
                break;
            case 14:
                simulateKeyPress('ArrowLeft');
                break;
            case 15:
                simulateKeyPress('ArrowRight');
                break;
            }
        }

    }

};

