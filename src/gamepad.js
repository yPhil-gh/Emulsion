window.gamepad = {
    logStatus: function() {
        const gamepads = navigator.getGamepads();
        const connected = Array.from(gamepads).some(gamepad => gamepad !== null);

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
                navigateGameContainers('up');
                break;
            case 13: // D-pad down
                navigateGameContainers('down');
                break;
            case 14: // D-pad left
                navigateGameContainers('left');
                break;
            case 15: // D-pad right
                navigateGameContainers('right');
                break;
            }
        }

        function navigateGameContainers(direction) {
            // Select the gallery container that holds the game containers
            const gallery = document.querySelector('#gamecube-gallery');
            if (!gallery) return;

            // Get all game containers within the gallery
            const gameContainers = Array.from(gallery.querySelectorAll('.game-container'));
            if (gameContainers.length === 0) return;

            // Find the currently selected game container
            let selectedIndex = gameContainers.findIndex(container => container.classList.contains('selected'));
            if (selectedIndex === -1) selectedIndex = 0; // Default to the first container if none is selected

            // Get the grid style to determine the number of columns
            const gridStyle = window.getComputedStyle(gallery);
            const columns = gridStyle.gridTemplateColumns.split(' ').length;

            // Update the selected index based on the direction
            switch (direction) {
            case 'right':
                selectedIndex = (selectedIndex + 1) % gameContainers.length;
                break;
            case 'left':
                selectedIndex = (selectedIndex - 1 + gameContainers.length) % gameContainers.length;
                break;
            case 'down':
                if (selectedIndex + columns < gameContainers.length) {
                    selectedIndex += columns;
                } else {
                    selectedIndex = selectedIndex % columns;
                }
                break;
            case 'up':
                if (selectedIndex - columns >= 0) {
                    selectedIndex -= columns;
                } else {
                    selectedIndex = gameContainers.length - (columns - (selectedIndex % columns));
                }
                break;
            }

            // Update the selected state of the game containers
            gameContainers.forEach((container, index) =>
                container.classList.toggle('selected', index === selectedIndex)
            );

            // Scroll the selected game container into view
            gameContainers[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }


        document.addEventListener('keydown', event => {
            // Check if we're in the gallery or slideshow context
            const gallery = document.querySelector('#gamecube-gallery');
            const slideshow = document.querySelector('#slideshow');


            let elements;
            let isGallery = false;

            if (gallery && gallery.contains(document.activeElement)) {
                // If the gallery is in focus, use .game-container elements
                elements = Array.from(gallery.querySelectorAll('.game-container'));
                isGallery = true;
            } else if (slideshow) {
                // Otherwise, use .slide elements in the slideshow
                elements = Array.from(slideshow.querySelectorAll('.slide'));
            } else {
                return; // Exit if neither context is found
            }



            if (elements.length === 0) return;

            console.log("event: ", event);

            // Find the index of the selected or active element
            let selectedIndex = elements.findIndex(el => el.classList.contains('selected'));
            if (selectedIndex === -1) {
                selectedIndex = elements.findIndex(el => el.classList.contains('active'));
            }
            if (selectedIndex === -1) selectedIndex = 0;

            // Handle key events
            switch (event.key) {
            case 'ArrowRight':
                selectedIndex = (selectedIndex + 1) % elements.length;
                break;
            case 'ArrowLeft':
                selectedIndex = (selectedIndex - 1 + elements.length) % elements.length;
                break;
            case 'Enter':
                // Dispatch a custom click event with extra data
                const customClickEvent = new CustomEvent('click', {
                    detail: { arg: "plop" }
                });
                elements[selectedIndex].dispatchEvent(customClickEvent);
                break;
            case 'p':
                console.log("p pressed");
                const customClickEventP = new CustomEvent('click', {
                    detail: { arg: "plop" }
                });
                elements[selectedIndex].dispatchEvent(customClickEventP);
                break;
            }

            // Update the "selected" class on each element
            elements.forEach((el, index) =>
                el.classList.toggle('selected', index === selectedIndex)
            );

            // Scroll the selected element into view
            if (isGallery) {
                // For gallery, scroll smoothly and center the element
                elements[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            } else {
                // For slideshow, adjust the transform and opacity
                elements[selectedIndex].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        });


    }

};

