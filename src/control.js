const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

function showHelp() {
    const helpBar = document.getElementById("help-bar");
    if (!helpBar) return;

    helpBar.style.transform = "translateY(0)";

    // After 6 seconds, hide the status bar again.
    setTimeout(() => {
        helpBar.style.transform = "translateY(100%)";
    }, 6000);
}

function showStatus(message) {

    const helpBar = document.getElementById("help-bar");
    helpBar.style.transform = "translateY(100%)";

    const statusBar = document.getElementById("status-bar");
    if (!statusBar) return;

    console.log("message: ", message);

    statusBar.textContent = message;

    statusBar.style.transform = "translateY(0)";

    // After 6 seconds, hide the status bar again.
    setTimeout(() => {
        statusBar.style.transform = "translateY(100%)";
    }, 6000);
}

window.control = {
    showStatus: showStatus,
    showHelp: showHelp,
    initSlideShow: function(slideshow) {
        const slides = document.querySelectorAll('.slide');
        let currentSlide = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.classList.remove('active', 'adjacent', 'active-left', 'active-right');
                if (i === index) {
                    slide.classList.add('active');
                } else if (i === (index - 1 + slides.length) % slides.length) {
                    slide.classList.add('adjacent', 'active-left');
                } else if (i === (index + 1) % slides.length) {
                    slide.classList.add('adjacent', 'active-right');
                }
            });
        }

        slideshow.addEventListener('keydown', async (event) => {

            showHelp();

            if (event.key === 'ArrowRight') {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
            } else if (event.key === 'Escape') {
                const result = await ipcRenderer.invoke('show-quit-dialog');
                if (result === 'yes') {
                    ipcRenderer.send('quit');
                }
            } else if (event.key === 'ArrowLeft') {
                currentSlide = (currentSlide - 1 + slides.length) % slides.length;
                showSlide(currentSlide);
            } else if (event.key === 'i') {
                console.log("i & I: ", currentSlide);
                const platform = slides[currentSlide].getAttribute('data-platform');
                console.log("platform: ", platform);
                slides[currentSlide].querySelector('.platform-form').style.display = "block";

            } else if (event.key === 'Enter') {
                console.log(`Slide selected via RETURN: ${slides[currentSlide].textContent.trim()}`);
                console.log('Current slide classList:', slides[currentSlide].classList);

                if (slides[currentSlide].classList.contains('runnable')) {
                    // Hide the slideshow div
                    document.getElementById('slideshow').style.display = 'none';
                    console.log("platform: ", slides[currentSlide].getAttribute('data-platform'));
                    console.log("games-dir: ", slides[currentSlide].getAttribute('data-games-dir'));

                    const platform = slides[currentSlide].getAttribute('data-platform');
                    const gamesDir = slides[currentSlide].getAttribute('data-games-dir');
                    const emulator = slides[currentSlide].getAttribute('data-emulator');
                    const emulatorArgs = slides[currentSlide].getAttribute('data-emulator-args');

                    ipcRenderer.invoke('get-main-data')
                        .then(({ userDataPath }) => {
                            window.userDataPath = userDataPath;
                            if (!document.querySelector('.gallery')) {
                                gallery.buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath);
                            }
                        });
                }
            }
        });


        // Mouse navigation
        slides.forEach((slide, index) => {
            slide.addEventListener('click', () => {
                currentSlide = index;
                showSlide(currentSlide);
            });
        });

        // Initialize slideshow
        showSlide(currentSlide);
    },
    initGalleryNav: function(galleryContainer) {

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

        function removeGalleryAndShowSlideshow() {
            // Remove the gallery element (all elements with class "gallery")
            const galleryElement = document.querySelector('.gallery');
            if (galleryElement) {
                galleryElement.remove();
                console.log("Gallery removed from DOM.");
            } else {
                console.log("No gallery element found to remove.");
            }

            // Ensure the slideshow is visible
            const slideshow = document.getElementById('slideshow');
            if (slideshow) {
                slideshow.style.display = 'block';
                slideshow.focus();
                console.log("Slideshow is now visible.");
                ipcRenderer.send('change-window-title', "EmumE - Select a Platform");
            } else {
                console.warn("Slideshow element not found.");
            }
        }

        const gameContainers = Array.from(galleryContainer.querySelectorAll('.game-container'));

        if (gameContainers.length === 0) return;

        let selectedIndex = 0;
        const columns = 6; // Fixed number of columns

        galleryContainer.tabIndex = 0; // Make the container focusable

        galleryContainer.focus();

        // Gallery nav
        galleryContainer.addEventListener('keydown', (event) => {

            showHelp();

            switch (event.key) {
            case 'ArrowRight':
                selectedIndex = (selectedIndex + 1) % gameContainers.length;
                break;
            case 'ArrowLeft':
                selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
                break;
            case 'ArrowDown':
                console.log("ArrowDown selectedIndex Before: ", selectedIndex);
                selectedIndex = Math.min(selectedIndex + columns, gameContainers.length);
                console.log("ArrowDown selectedIndex After: ", selectedIndex);
                break;
            case 'ArrowUp':
                console.log("ArrowUp selectedIndex Before: ", selectedIndex);
                selectedIndex = Math.max(selectedIndex - columns, 0);
                console.log("ArrowUp selectedIndex After: ", selectedIndex);
                break;
            case 'i':
                console.log("I!");
                const plop = gameContainers[selectedIndex].classList;
                const pElement = gameContainers[selectedIndex].querySelector('p');
                const fetchCoverButton = gameContainers[selectedIndex].querySelector('button');

                fetchCoverButton.click();

                console.log("pElement: ", pElement);
                break;
            case 'Enter':
                if (document.querySelector('.gallery')) {
                    gameContainers[selectedIndex].click();
                }
                break;
            case 'Escape':
                console.log("Escape pressed");
                removeGalleryAndShowSlideshow();
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

        if (imageContainers.length === 0) return;

        let selectedIndex = 0;

        // Make the container focusable
        coversDialog.tabIndex = 0;
        coversDialog.focus();

        // Gallery navigation
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

        function simulateKeyPress(key) {

            function isElementVisible(el) {
                if (!el) return false;
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
            }

            console.log("simulateKeyPress: ");
            const event = new KeyboardEvent('keydown', {
                key: key, // The value of the key (e.g., "ArrowUp", "Escape")
                code: key === 'Escape' ? 'Escape' : `Arrow${key.slice(5)}`, // Handle Escape and arrow keys
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

