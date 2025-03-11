function initSlideShow(platformToDisplay) {

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
                LB.utils.simulateKeyDown('Enter');
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

function initGallery(currentIndex) {

    const header = document.getElementById('header');

    document.getElementById('header').style.display = 'flex';

    const galleries = document.getElementById('galleries');
    const pages = Array.from(galleries.querySelectorAll('.page'));
    const totalPages = pages.length;
    const angleIncrement = 360 / totalPages;

    const radius = (window.innerWidth / 2) / Math.tan((angleIncrement / 2) * (Math.PI / 180));
    console.log("radius: ", radius);

    let gameContainers;
    function updateCarousel(direction) {
        pages.forEach((page, index) => {
            if (index === currentIndex) {

                gameContainers = Array.from(page.querySelectorAll('.game-container') || []);

                console.log("gameContainers.length: ", gameContainers.length);

                gameContainers.forEach((container, index) => {
                    container.classList.remove('selected');
                });

                const firstGameContainer = page.querySelector('.game-container');

                firstGameContainer.classList.add('selected');
                firstGameContainer.focus();
                firstGameContainer.scrollIntoView({
                        behavior: "instant",
                        block: "center"
                    });
                console.log("firstGameContainer: ", firstGameContainer);

                document.querySelector('header .platform-name').textContent = LB.utils.capitalizeWord(page.dataset.platform);
                document.querySelector('header .platform-image img').src = `../img/platforms/${page.dataset.platform}.png`;

                document.querySelector('header .prev-link').onclick = function() {
                    prevPage();
                };

                document.querySelector('header .next-link').onclick = function() {
                    nextPage();
                };

                // Active page
                page.classList.add('active');
                page.classList.remove('next', 'prev');
            } else if (index < currentIndex) {
                // Previous page
                page.classList.remove('active', 'next');
                page.classList.add('prev');
            } else if (index > currentIndex) {
                // Next page
                page.classList.remove('active', 'prev');
                page.classList.add('next');
            }
        });
    }

    function nextPage() {
        currentIndex = (currentIndex + 1) % totalPages;
        updateCarousel('next');
    }

    function prevPage() {
        currentIndex = (currentIndex - 1 + totalPages) % totalPages;
        updateCarousel('prev');
    }

    // galleries.addEventListener('wheel', (event) => {
    //     event.preventDefault(); // Prevent default scrolling behavior
    //     if (event.deltaY > 0) {
    //         nextPage();
    //     } else if (event.deltaY < 0) {
    //         prevPage();
    //     }
    // });

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

    let ImageMenuSelectedIndex = 0;

    function _toggleFooterMenu(gameContainers, selectedIndex, listener, isMenuOpen) {

        const menu = document.getElementById('menu');
        const menuContainer = document.getElementById('menu-container');

        const footer = document.getElementById('menu');
        const footerMenuContainer = document.getElementById('menu-container');

        // const footer = document.getElementById('footer');
        // const footerMenuContainer = document.getElementById('footer-menu-container');

        const controls = document.getElementById('controls');

        let menuSelectedIndex = 1;

        function getSelectedGame(gameContainers, selectedIndex) {
            let selectedContainer;
            gameContainers.forEach(async (container, index) => {
                if (index === selectedIndex) {
                    selectedContainer = container;
                }

            });
            return selectedContainer || null;
        }

        const selectedGame = LB.utils.getSelectedGame(gameContainers, selectedIndex);
        const selectedGameImg = selectedGame.querySelector('.game-image');

        function footerMenuOnKeyDown(event) {

            console.log("menuSelectedIndex: ", menuSelectedIndex);

            console.log("isMenuOpen: ", isMenuOpen);

            event.stopPropagation();
            event.stopImmediatePropagation(); // Stops other listeners on the same element
            const menuGameContainers = Array.from(footer.querySelectorAll('.menu-game-container'));
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
            case 'i':
                _closeMenu();
                break;
            case 'Enter':
                const menuSelectedGame = LB.utils.getSelectedGame(menuGameContainers, menuSelectedIndex);
                const menuSelectedGameImg = menuSelectedGame.querySelector('.game-image');
                _closeMenu(menuSelectedGameImg.src);
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
            LB.imageSrc = imgSrc;
            console.log("closeMenu: ");
            document.getElementById('menu-container').innerHTML = '';
            // footer.style.height = '100px'; // original height

            menu.style.height = '0';

            // controls.style.display = 'flex';
            window.removeEventListener('keydown', footerMenuOnKeyDown);
            window.addEventListener('keydown', listener);

            if (imgSrc) {
                const selectedGameImg = selectedGame.querySelector('.game-image');
                if (!selectedGameImg) return;

                // LB.utils.updateControls('circle', 'same', 'Back');

                // Create a burst effect by rapidly scaling and fading out
                selectedGameImg.style.transform = "scale(1.3)";
                selectedGameImg.style.opacity = "0";

                selectedGameImg.src = imgSrc + '?t=' + new Date().getTime();

                const spinner = document.createElement('div');
                spinner.classList.add(`maze-${Math.floor(Math.random() * 10) + 1}`, 'spinner');
                spinner.classList.add('image-spinner');

                selectedGame.appendChild(spinner);

                console.log("selectedGame.dataset.gameName: ", selectedGame.dataset.gameName);

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

        function _openMenu() {

            window.removeEventListener('keydown', listener);
            window.addEventListener('keydown', footerMenuOnKeyDown);

            // footer.style.height = '91vh';

            menu.style.height = '81vh';

            // controls.style.display = 'none';

            gameContainers.forEach(async (container, index) => {
                if (index === selectedIndex) {

                    if (container.classList.contains('settings')) {
                        const platformForm = LB.build.platformForm(container.dataset.platform);
                        // footerMenuImg.src = path.join(LB.baseDir, 'img', 'platforms', `${container.dataset.platform}.png`);
                        // footerMenuImg.classList.remove('hidden');
                        footer.appendChild(platformForm);

                        const platformToggle = document.getElementById('input-platform-toggle-checkbox');

                        if (platformToggle) {
                            platformToggle.addEventListener('change', (event) => {
                                document.getElementById('form-status-label').textContent = event.target.checked ? "Enabled" : "Disabled";
                            });
                        }

                    } else {
                        const gameImage = container.querySelector('img');
                        await LB.build.gameMenu(container.title, gameImage)
                            .then((gameMenu) => {
                                footerMenuContainer.innerHTML = '';
                                footerMenuContainer.appendChild(gameMenu);

                                const spinner = document.body.querySelector('.spinner');
                                setTimeout(() => spinner.remove(), 500);

                                const menuGameContainers = Array.from(gameMenu.querySelectorAll('.menu-game-container'));
                                console.log("menuGameContainers len: ", menuGameContainers.length);

                            });

                    }

                }
            });

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
        case 'PageUp':
            selectedIndex = Math.max(selectedIndex - LB.galleryNumOfCols * 10, 0);
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
            _toggleFooterMenu(gameContainers, selectedIndex, _handleKeyDown, isMenuOpen);
            // window.removeEventListener('keydown', _handleKeyDown);
            break;
        case 'F5':
            window.location.reload();
            break;
        case 'Enter':
            const selectedGame = LB.utils.getSelectedGame(gameContainers, selectedIndex);

            // const encodedFilePath = filePath
            //       .replace(/([\s()])/g, '\\$1'); // Escape spaces and special characters
            // console.log(encodedFilePath);

            ipcRenderer.send('run-command', selectedGame.dataset.command);
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

    galleries.addEventListener('wheel', (event) => {
        event.preventDefault(); // Prevent default scrolling
        if (event.shiftKey) {
            // With Shift pressed, directly trigger page navigation
            if (event.deltaY > 0) {
                nextPage();
            } else if (event.deltaY < 0) {
                prevPage();
            }
        } else {
            // Without Shift, simulate arrow key events
            if (event.deltaY > 0) {
                LB.utils.simulateKeyDown('ArrowDown');
            } else if (event.deltaY < 0) {
                LB.utils.simulateKeyDown('ArrowUp');
            }
        }
    });

    window.addEventListener('keydown', _handleKeyDown);
    // Initialize the carousel
    updateCarousel(gameContainers);

}

LB.control = {
    initGallery: initGallery,
    initSlideShow: initSlideShow
};
