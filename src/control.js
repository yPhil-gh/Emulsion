let fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');


function updatePlatormsMenu({ pad = "Browse", cross = "Select", square = "Config", circle = "Exit" } = {}) {
    const squareSpan = document.getElementById("square-span");
    squareSpan.textContent = square;
}

function updateControlsMenu({ message = "plop" }) {
    const msgDiv = document.getElementById("message");
    const msgSpan = document.getElementById("message-span");

    // Reset the message container
    msgDiv.style.opacity = "1";
    msgDiv.style.visibility = "visible";
    msgSpan.innerHTML = message;

    // Restart the animation
    msgSpan.style.animation = "none";
    void msgSpan.offsetWidth; // Trigger reflow
    msgSpan.style.animation = null;

    // Listen for the animation end event
    msgSpan.addEventListener("animationend", () => {
        // Fade out the message container quickly
        msgDiv.style.opacity = "0";

        // Hide the message container after the fade-out
        setTimeout(() => {
            msgDiv.style.visibility = "hidden";
        }, 500); // Match this delay with the fade-out transition duration
    }, { once: true }); // Ensure the event listener is removed after firing
}

function simulateKeyPress(key) {

    function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        const test = style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
        return style.display !== 'none' && style.visibility !== 'hidden' && parseFloat(style.opacity) > 0;
    }

    function getAllEventListeners(target) {
        const events = [];
        for (const key in target) {
            if (key.startsWith("on")) {
                if (typeof target[key] === "function") {
                    events.push({ type: key.slice(2), listener: target[key] });
                }
            }
        }
        return events;
    }

    const event = new KeyboardEvent('keydown', {
        key: key,
        code: key,
        isTrusted: true,
        bubbles: false,
    });

    const slideshow = document.getElementById('slideshow');
    const exitDialog = document.getElementById('exit-dialog');
    // const gallery = document.querySelector('.gallery');
    let gallery = null;

    const galleries = document.querySelectorAll('.gallery');

    galleries.forEach(thisGallery => {
        if (thisGallery.style.display !== "none") {
            gallery = thisGallery;
        }
    });

    if (isElementVisible(exitDialog)) {
        exitDialog.dispatchEvent(event);
        return;
    }

    if (isElementVisible(slideshow)) {
        slideshow.dispatchEvent(event);
        return;
    }
    if (gallery) {

        gallery.dispatchEvent(event);
    }
}

function initDialogNav(dialog, buttons, onImageSelect) {
    let isImageDialog = false;
    let elementToFocus;

    if (dialog.id === "image-dialog") {
        isImageDialog = true;
        elementToFocus = document.querySelector("#image-dialog .image-container");
    } else {
        elementToFocus = buttons.donateButton;
    }

    function closeDialog() {
        if (isImageDialog) {
            const galleries = document.querySelectorAll(".gallery");
            const visibleGallery = Array.from(galleries).find(gallery =>
                window.getComputedStyle(gallery).display !== "none"
            );
            visibleGallery.focus();
        } else {
            const slideshow = document.getElementById('slideshow');
            window.control.initSlideShow(slideshow);
            slideshow.focus();
        }

        dialog.classList.add('hidden');
    }

    function onKeyDown (event) {
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            cycleFocus(1);
        } else if (event.key === 'ArrowLeft') {
            event.preventDefault();
            cycleFocus(-1);
        } else if (event.key === 'Enter') {
            if (isImageDialog) {
                const activeElement = event.target.querySelector("img");
                const imageUrl = activeElement.src;
                onImageSelect(imageUrl); // Pass the selected image URL to the callback
                // closeDialog();
            }

            if (event.target.id === "exit-dialog-cancel-button" || document.activeElement.id === "exit-dialog-cancel-button") {
                closeDialog();
            } else if (event.target.id === "exit-dialog-donate-button" || document.activeElement.id === "exit-dialog-donate-button") {
                ipcRenderer.invoke('go-to-donate-page');
            } else if (event.target.id === "exit-dialog-exit-button" || document.activeElement.id === "exit-dialog-exit-button") {
                ipcRenderer.invoke('exit');
            }
        } else if (event.key === 'Escape') {
            closeDialog();
        }
    }

    dialog.addEventListener('keydown', onKeyDown);

    function cycleFocus(direction) {
        const focusable = Array.from(document.querySelectorAll(isImageDialog ? '#image-dialog .image-container' : '#exit-dialog button'));
        const currentIndex = focusable.indexOf(document.activeElement);
        const nextIndex = (currentIndex + direction + focusable.length) % focusable.length;
        focusable[nextIndex].focus();
    }

    if (!isImageDialog) {
        buttons.cancelButton.addEventListener('click', () => {
            closeDialog();
        });

        buttons.exitButton.addEventListener('click', () => {
            ipcRenderer.invoke('exit');
        });

        buttons.donateButton.addEventListener('click', async () => {
            ipcRenderer.invoke('go-to-donate-page');
        });
    }

    dialog.addEventListener('click', (event) => {
        const dialogContent = document.querySelector('#exit-dialog .dialog-content');
        if (!dialogContent.contains(event.target)) {
            closeDialog();
        }
    });

    dialog.setAttribute('tabindex', '-1');

    console.log("elementToFocus: ", elementToFocus);

    elementToFocus.focus();

    return {
        closeDialog,
        cleanup: () => {
            dialog.removeEventListener('keydown', onKeyDown);
        },
    };
}

function showExitDialog () {
    const exitDialog = document.getElementById('exit-dialog');
    const exitButton = document.getElementById('exit-dialog-exit-button');
    const cancelButton = document.getElementById('exit-dialog-cancel-button');
    const donateButton = document.getElementById('exit-dialog-donate-button');

    exitDialog.classList.remove('hidden');

    const buttons = {
        exitButton: exitButton,
        cancelButton: cancelButton,
        donateButton: donateButton
    };

    initDialogNav(exitDialog, buttons);

}

function showCoversDialog(imageUrls, gameName, platform, imgElement) {
    console.warn("showCoversDialog: ", showCoversDialog);
    const coversDialog = document.getElementById('image-dialog');
    const dialogTitle = document.getElementById('image-dialog-title');
    const imageGrid = document.getElementById('image-grid');
    const selectButton = document.getElementById('image-dialog-select-button');
    const cancelButton = document.getElementById('image-dialog-cancel-button');

    let selectedImageUrl = null;

    // Set the dialog title
    dialogTitle.textContent = `Select a Cover for ${gameName}`;

    // Clear any existing images in the grid
    imageGrid.innerHTML = '';

    // Add each image to the grid
    imageUrls.forEach((url) => {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');
        imgContainer.tabIndex = -1; // Make the container focusable

        const img = document.createElement('img');
        img.src = url;

        imgContainer.appendChild(img);
        imageGrid.appendChild(imgContainer);
    });

    // Remove the hidden class to show the dialog
    coversDialog.classList.remove('hidden');

    // Initialize dialog navigation and get closeDialog and cleanup functions
    const { closeDialog, cleanup } = initDialogNav(coversDialog, { selectButton, cancelButton }, (imageUrl) => {
        console.warn("imageUrl: ", imageUrl, imgElement);

        window.coverDownloader.downloadAndReload(imageUrl, gameName, platform, imgElement)
            .then(() => {
                const grandParent = imgElement.parentElement.parentElement;
                grandParent.focus();
            })
            .catch((error) => {
                console.error('Error:', error.message);
            });

        cleanup();
        // Close the dialog after selecting an image
        closeDialog();
    });

    // Add a cleanup mechanism when the dialog is closed
    const handleClose = () => {
        closeDialog();
        cleanup(); // Clean up event listeners
    };

    // Example: Close the dialog when the cancel button is clicked
    cancelButton.addEventListener('click', handleClose);
}

function isEnabled(platform) {

    if (platform === "settings") {
        return true;
    }

    const prefString = localStorage.getItem(platform);

    let prefs;

    if (prefString) {
        prefs = JSON.parse(prefString);
        if (!prefs.gamesDir && !prefs.emulator) {
            return false;
        }
    } else {
        return false;
    }

    return true;
}

window.control = {
    isEnabled: isEnabled,
    updateControlsMenu: updateControlsMenu,
    showCoversDialog: showCoversDialog,
    showExitDialog: showExitDialog,
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

        // function showForm(slide) {
        //     const isReady = slide.classList.contains('ready');
        //     const form = slides[currentIndex].querySelector('.slide-form-container');
        //     if (!isReady) {
        //         form.style.display = 'block';
        //     }
        // }

        function nextSlide() {
            currentIndex = (currentIndex + 1) % totalSlides;
            updateCarousel();
            // showForm(slides[currentIndex]);
        }

        function prevSlide() {
            currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
            updateCarousel();
            // showForm(slides[currentIndex]);
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

        // Keyboard navigation
        slideshow.addEventListener('keydown', (event) => {
            event.stopPropagation();
            event.stopImmediatePropagation(); // Stops other listeners on the same element
            if (event.key === 'ArrowRight') {
                nextSlide();
            } else if (event.key === 'ArrowLeft') {
                prevSlide();
            } else if (event.key === 'Escape') {

                window.control.showExitDialog();
                // updateControlsMenu({message: "Really Exit?"});
                // showExitDialog();
            } else if (event.key === 'i') {
                const form = slides[currentIndex].querySelector('.slide-form-container');

                if (form.style.display === 'block' && slides[currentIndex].classList.contains("ready")) {
                    form.style.display = 'none';
                } else {
                    form.style.display = 'block';
                }

            } else if (event.key === 'Enter') {

                document.getElementById('slideshow').style.display = 'none';
                document.getElementById('galleries').style.display = "block";
                document.getElementById('top-menu').style.display = "flex";

                const platform = slides[currentIndex].getAttribute('data-platform');

                const galleries = document.querySelectorAll('.gallery');

                galleries.forEach(gallery => {
                    gallery.style.display = "none";
                });

                const galleryToShow = document.querySelector(`#gallery-${platform}`);

                console.log("platform!!: ", platform);

                console.log("galleryToShow: ", galleryToShow);

                console.log("galleryToShow.id: ", galleryToShow.id);

                if (galleryToShow.id === "gallery-settings") {
                    galleryToShow.style.display = "flex";
                    window.control.initSettingsNav(galleryToShow);
                } else {
                    galleryToShow.style.display = "grid";
                    window.control.initGalleryNav(galleryToShow);
                }


                window.topMenu.style.visibility = "visible";

                // window.control.initTopMenuNav();
                window.control.setTopMenuPlatform(platform);

                    // setDisplayedPlatform(platform);
            }
        });

        updateCarousel();
    },
    initTopMenuNav: function() {

        document.getElementById('dpad-icon').src = "./img/controls/dpad-horiz.png";

        const arrows = document.querySelectorAll('.arrows');
        document.getElementById('top-menu').style.display = "flex";

        const slides = document.querySelectorAll('.top-menu-slide');

        if (slides.length > 1) {
            arrows.forEach(arrow => {
                arrow.style.display = "block";
            });
        }

        let currentIndex = 0; // Initialize globally

        function displayGallery(index) {
            const galleries = document.querySelectorAll('.gallery');
            const totalGalleries = galleries.length;

            console.log("Total Galleries:", totalGalleries);
            console.log("Total Slides:", slides.length);

            if (totalGalleries !== slides.length) {
                console.warn("Mismatch between .gallery and .top-menu-slide elements!");
            }

            // Ensure index wraps around properly
            index = (index + totalGalleries) % totalGalleries;

            // Hide all galleries
            galleries.forEach(gallery => {
                gallery.style.display = "none";
            });

            // Show the correct gallery
            const galleryToDisplay = galleries[index];
            if (galleryToDisplay) {
                console.log("Displaying gallery:", galleryToDisplay.id);
                galleryToDisplay.style.display = galleryToDisplay.id === "gallery-settings" ? "flex" : "grid";
                if (galleryToDisplay.id === "gallery-settings") {
                    window.control.initSettingsNav(document.querySelector(`#gallery-settings`));

                }
                galleryToDisplay.classList.add('fadeIn');
            }
        }

        function updatePlatformName(index) {
            const allPlatformSlides = document.querySelectorAll('.top-menu-slide');

            // Normalize index
            const safeIndex = (index - 1 + allPlatformSlides.length) % allPlatformSlides.length;

            console.log("Updating Platform Name - Index:", index, "Safe Index:", safeIndex);

            allPlatformSlides.forEach((platformSlide, i) => {
                platformSlide.style.opacity = "0";
                platformSlide.style.display = "none";
                platformSlide.classList.remove("fadeIn");

                if (i === safeIndex) {
                    console.log("Displaying platform slide:", i);
                    platformSlide.style.display = "flex";
                    platformSlide.classList.add('fadeIn');
                }
            });
        }


        const goToPreviousSlide = () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            console.log("Prev Slide - New Index:", currentIndex);
            updatePlatformName(currentIndex);
            displayGallery(currentIndex);
        };

        const goToNextSlide = () => {
            currentIndex = (currentIndex + 1) % slides.length;
            console.log("Next Slide - New Index:", currentIndex);
            updatePlatformName(currentIndex);
            displayGallery(currentIndex);
        };

        const unregisterListeners = () => {
            document.removeEventListener('keydown', handleKeyDown);

            console.log('Menu listeners unregistered.');

            const galleries = document.querySelectorAll('.gallery');
            const visibleGallery = Array.from(galleries).find(el => window.getComputedStyle(el).display !== 'none');

            if (visibleGallery) {
                console.log("Initializing gallery navigation for:", visibleGallery);
                window.control.initGalleryNav(visibleGallery);
                visibleGallery.focus();
            }

            arrows.forEach(arrow => {
                arrow.style.display = "none";
            });
        };

        const handleClick = (event) => {
            if (event.target.closest('.left-arrow')) {
                goToPreviousSlide();
            } else if (event.target.closest('.right-arrow')) {
                goToNextSlide();
            }
        };

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
                break;
            default:
                break;
            }
        };

        const topMenu = document.getElementById('top-menu');
        topMenu.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleKeyDown);
    },
    setTopMenuPlatform: function(platform) {

        const slides = document.querySelectorAll('.top-menu-slide');

        // Find the index of the slide with the matching platform name
        const index = Array.from(slides).findIndex(slide => {
            const label = slide.querySelector('.top-menu-slide-label').textContent.toLowerCase();
            return label === platform.toLowerCase();
        });

        slides.forEach(slide => {
            slide.style.display = "none";
        });

        slides[index].style.display = "flex";
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
    initSettingsNav: function (galleryContainer) {
        const formContainers = galleryContainer.querySelectorAll('.settings-form-container');

        galleryContainer.tabIndex = -1;
        galleryContainer.focus();

        let currentIndex = 0;

        const highlightCurrent = () => {
            formContainers.forEach((container, index) => {
                if (index === currentIndex) {
                    container.classList.add('highlighted');

                    container.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });

                } else {
                    container.classList.remove('highlighted');
                }
            });
        };

        const toggleCurrent = () => {
            const currentContainer = formContainers[currentIndex];
            if (currentContainer) {
                const toggleCheckbox = currentContainer.querySelector('#platform-toggle');
                const platform = currentContainer.id.split('-')[0];

                if (window.control.isEnabled(platform)) {
                    toggleCheckbox.checked = !toggleCheckbox.checked;
                } else {
                    window.control.updateControlsMenu({
                        message: "Please provide both the <strong>Games Directory</strong> and the <strong>Emulator</strong>."
                    });
                }
            }
        };

        // Handle keyboard navigation
        galleryContainer.addEventListener('keydown', (event) => {
            switch (event.key) {
            case 'ArrowRight':
                window.control.initTopMenuNav();
                break;
            case 'ArrowLeft':
                window.control.initTopMenuNav();
                break;
            case 'ArrowDown':
                currentIndex = (currentIndex + 1) % formContainers.length;
                highlightCurrent();
                break;
            case 'ArrowUp':
                currentIndex = (currentIndex - 1 + formContainers.length) % formContainers.length;
                highlightCurrent();
                break;
            case 'Enter':
                toggleCurrent();
                break;
            case 'Escape':
                window.control.removeGalleryAndShowSlideshow();
                break;
            default:
                return;
            }
        });

        // Handle mouse wheel navigation
        let isScrolling = false;

        galleryContainer.addEventListener('wheel', (event) => {
            event.preventDefault();

            if (isScrolling) return; // Exit if already scrolling

            isScrolling = true;

            if (event.deltaY > 0) {
                currentIndex = (currentIndex + 1) % formContainers.length;
            } else if (event.deltaY < 0) {
                currentIndex = (currentIndex - 1 + formContainers.length) % formContainers.length;
            }

            highlightCurrent();

            // Reset the scrolling flag after a short delay
            setTimeout(() => {
                isScrolling = false;
            }, 200); // Adjust the delay as needed
        });

        // Handle click-to-select
        formContainers.forEach((container, index) => {
            container.addEventListener('click', () => {
                currentIndex = index; // Update the current index to the clicked container
                highlightCurrent(); // Highlight the clicked container
            });
        });

        // Initial highlight
        highlightCurrent();
    },
    initGalleryNav: function(galleryContainer) {

        document.getElementById('dpad-icon').src = "./img/controls/dpad-active.png";

        const gameContainers = Array.from(galleryContainer.querySelectorAll('.game-container'));

        if (gameContainers.length === 0) return;

        let selectedIndex = 0;
        const columns = 6; // Fixed number of columns

        galleryContainer.tabIndex = -1; // Make the container focusable

        galleryContainer.focus();

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
            case 'F5':
                window.location.reload();
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

                const fetchCoverButton = gameContainers[selectedIndex].querySelector('.fetch-cover-button');

                const imageStatus = fetchCoverButton.getAttribute('data-image-status');

                const fetchCoverButtons = document.querySelectorAll('.fetch-cover-button');

                // fetchCoverButtons.forEach(fetchCoverButton => {
                //     fetchCoverButton.style.opacity = 0;
                // });

                if (imageStatus === "missing") {
                    fetchCoverButton.dispatchEvent(new Event('mouseover'));
                    // fetchCoverButton.style.opacity = 1;
                }

                gameContainers[selectedIndex].scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    // inline: 'center'
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
                // ipcRenderer.send('un-focus');
                // const selectedContainer = document.querySelector('.game-container.selected');
                // if (selectedContainer) {
                //     selectedContainer.click();
                // }
                break;
            case 1:
                simulateKeyPress('Escape');
                break;
            case 2:
                // simulateKeyPress('Escape');
                simulateKeyPress('i');
                break;
            case 3:
                // simulateKeyPress('Escape');
                console.log("3 (triangle)");
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

