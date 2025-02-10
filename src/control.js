const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

function showStatusBar(context) {
    const statusBar = document.getElementById("statusBar");
    if (!statusBar) return;

    statusBar.style.transform = "translateY(0)";

    // After 6 seconds, hide the status bar again.
    setTimeout(() => {
        statusBar.style.transform = "translateY(100%)";
    }, 6000);
}

window.control = {
    showStatusBar: function(slideshow) {
        showStatusBar("slideshow");
    },
    initSlideShow: function(slideshow) {
        const slides = document.querySelectorAll('.slide');
        let currentSlide = 0;

        // Function to update slide classes
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

        // Keyboard navigation
        slideshow.addEventListener('keydown', (event) => {

            showStatusBar("slideshow"); // or showStatusBar("left") for leftward slide.
            // event.stopPropagation();

            if (event.key === 'ArrowRight') {
                currentSlide = (currentSlide + 1) % slides.length;
                showSlide(currentSlide);
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
    initNav: function(galleryContainer) {

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
            } else {
                console.warn("Slideshow element not found.");
            }
        }

        const gameContainers = Array.from(galleryContainer.querySelectorAll('.game-container'));

        if (gameContainers.length === 0) return;

        let selectedIndex = 0;
        const columns = 4; // Fixed number of columns

        // Add event listener for keyboard navigation
        document.addEventListener('keydown', (event) => {

            showStatusBar("up", "gallery"); // or showStatusBar("left") for leftward slide.

            switch (event.key) {
            case 'ArrowRight':
                selectedIndex = (selectedIndex + 1) % gameContainers.length;
                break;
            case 'ArrowLeft':
                selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
                break;
            case 'ArrowDown':
                selectedIndex = Math.min(selectedIndex + columns, gameContainers.length) + 2;
                console.log("ArrowDown selectedIndex: ", selectedIndex);
                console.log("gameContainers.length: ", gameContainers.length);
                break;
            case 'ArrowUp':
                selectedIndex = Math.max(selectedIndex - columns, 0) - 2;
                console.log("ArrowUp selectedIndex: ", selectedIndex);
                break;
            case 'Enter':
                function isElementVisible(el) {
                    if (!el) return false;
                    const style = window.getComputedStyle(el);
                    return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
                }

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

            if (gameContainers.length !== selectedIndex) {
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
    logStatus: function() {
        const gamepads = navigator.getGamepads();
        const connected = Array.from(gamepads).some(gamepad => gamepad !== null);

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

        if (connected) {
            console.log('Gamepad connected at startup:', gamepads[0].id);
        } else {
            console.log('No gamepad connected at startup.');
        }

        // Listen for gamepad connection events
        window.addEventListener('gamepadconnected', (event) => {
            console.log('Gamepad connected:', event.gamepad.id);
            requestAnimationFrame(pollGamepad);
        });

        window.addEventListener('gamepaddisconnected', (event) => {
            console.log('Gamepad disconnected:', event.gamepad.id);
            cancelAnimationFrame(pollGamepad);
        });

        // Track the state of each button
        const buttonStates = {
            0: false, // X button
            1: false, // O button
            12: false, // D-pad up
            13: false, // D-pad down
            14: false, // D-pad left
            15: false, // D-pad right
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
                [0, 1, 12, 13, 14, 15].forEach((buttonIndex) => {
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

        function handleButtonPress(buttonIndex) {
            // Trigger the action only on button release
            switch (buttonIndex) {
            case 0: // X button
                ipcRenderer.send('un-focus');
                const selectedContainer = document.querySelector('.game-container.selected');
                if (selectedContainer) {
                    selectedContainer.click();
                }
                break;
            case 1: // O button
                console.log("O button pressed");
                // Add your O button logic here
                ipcRenderer.send('quit'); // Send a message to the main process
                break;
            case 12: // D-pad up
                // navigateGameContainers('up');
                simulateKeyPress('ArrowUp'); // Simulate "up" arrow key
                break;
            case 13: // D-pad down
                // navigateGameContainers('down');
                simulateKeyPress('ArrowDown'); // Simulate "down" arrow key
                break;
            case 14: // D-pad left
                // navigateGameContainers('left');
                simulateKeyPress('ArrowLeft'); // Simulate "left" arrow ke
                break;
            case 15: // D-pad right
                // navigateGameContainers('right');
                simulateKeyPress('ArrowRight'); // Simulate "right" arrow key
                break;
            }
        }

        // document.addEventListener('keydown', event => {
        //     // Check if we're in the gallery or slideshow context
        //     const gallery = document.querySelector('.gallery');
        //     const slideshow = document.querySelector('#slideshow');

        //     event.stopPropagation();

        //     let elements;
        //     let isGallery = false;

        //     if (gallery && gallery.contains(document.activeElement)) {
        //         // If the gallery is in focus, use .game-container elements
        //         elements = Array.from(gallery.querySelectorAll('.game-container'));
        //         isGallery = true;
        //     } else if (slideshow) {
        //         // Otherwise, use .slide elements in the slideshow
        //         elements = Array.from(slideshow.querySelectorAll('.slide'));
        //     } else {
        //         return; // Exit if neither context is found
        //     }



        //     if (elements.length === 0) return;

        //     console.log("event: ", event);

        //     // Find the index of the selected or active element
        //     let selectedIndex = elements.findIndex(el => el.classList.contains('selected'));
        //     if (selectedIndex === -1) {
        //         selectedIndex = elements.findIndex(el => el.classList.contains('active'));
        //     }
        //     if (selectedIndex === -1) selectedIndex = 0;

        //     // Handle key events
        //     switch (event.key) {
        //     case 'ArrowRight':
        //         selectedIndex = (selectedIndex + 1) % elements.length;
        //         break;
        //     case 'ArrowLeft':
        //         selectedIndex = (selectedIndex - 1 + elements.length) % elements.length;
        //         break;
        //     case 'Enter':
        //         // Dispatch a custom click event with extra data
        //         const customClickEvent = new CustomEvent('click', {
        //             detail: { arg: "plop" }
        //         });
        //         customClickEvent.stopPropagation();
        //         elements[selectedIndex].dispatchEvent(customClickEvent);
        //         break;
        //     case 'p':
        //         console.log("p pressed");
        //         const customClickEventP = new CustomEvent('click', {
        //             detail: { arg: "plop" }
        //         });
        //         elements[selectedIndex].dispatchEvent(customClickEventP);
        //         break;
        //     }

        //     // Update the "selected" class on each element
        //     elements.forEach((el, index) =>
        //         el.classList.toggle('selected', index === selectedIndex)
        //     );

        //     // Scroll the selected element into view
        //     if (isGallery) {
        //         // For gallery, scroll smoothly and center the element
        //         elements[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        //     } else {
        //         // For slideshow, adjust the transform and opacity
        //         elements[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        //     }
        // });


    }

};

