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

                document.querySelector('header .platform-name').textContent = LB.utils.capitalizeWord(page.dataset.platform);
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
            // document.getElementById('input-platform-toggle-checkbox')
        }

        function _openMenu() {
            footer.style.height = '50vh';
            controls.style.display = 'none';
            footerTitle.style.display = 'block';
            footerMenu.style.display = 'block';

            gameContainers.forEach((container, index) => {
                if (index === selectedIndex) {
                    footerTitle.textContent = LB.utils.capitalizeWord(container.title);

                    if (container.classList.contains('settings')) {
                        const platformForm = LB.build.platformForm(container.dataset.platform);
                        footerMenuImg.src = path.join(LB.baseDir, 'img', 'platforms', `${container.dataset.platform}.png`);
                        footerMenuImg.classList.remove('hidden');
                        footerMenu.appendChild(platformForm);
                    } else {
                        const gameImage = container.querySelector('img');
                        const gameMenu = LB.build.gameMenu(container.title);
                        footerMenu.appendChild(gameMenu);
                    }

                }
            });

            const platformToggle = document.getElementById('input-platform-toggle-checkbox');

            if (platformToggle) {
                platformToggle.addEventListener('change', (event) => {
                    document.getElementById('form-status-label').textContent = event.target.checked ? "Enabled" : "Disabled";
                });
            }

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
