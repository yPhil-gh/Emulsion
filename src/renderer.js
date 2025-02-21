const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuItems = document.getElementById("top-menu-items");

window.control.initGamepad();

slideshow.focus();

function buildSlide(platform) {

    // Create the slide container
    const homeSlide = document.createElement("div");
    homeSlide.className = "slide";
    homeSlide.id = platform;
    homeSlide.style.backgroundImage = `url('img/platforms/${platform}.png')`;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";

    homeSlide.setAttribute('data-platform', platform);

    // Append the content to the slide
    homeSlide.appendChild(slideContent);

    return homeSlide;
}

function buildTopMenuItem(platform) {

    const prefString = localStorage.getItem(platform);

    let prefs;

    if (platform !== "settings") {

        if (prefString) {
            prefs = JSON.parse(prefString);
            if (!prefs.gamesDir && !prefs.emulator) {
                return null;
            }
        } else {
            return null;
        }

    }

    console.log("Building platform top menu item: ", platform);

    // Create the slide container
    const menuSlide = document.createElement("div");
    menuSlide.className = "top-menu-slide";
    menuSlide.classList.add(platform);

    // menuSlide.id = platform;
    // menuSlide.style.backgroundImage = `url('img/platforms/${platform}.png')`;

    const menuSlideIcon = document.createElement("img");
    menuSlideIcon.src = `img/platforms/${platform}.png`;
    menuSlideIcon.className = "menu-icon";

    const menuSlideContent = document.createElement("div");
    menuSlideContent.className = "top-menu-slide-content";

    const menuSlideLabel = document.createElement("div");
    menuSlideLabel.className = "top-menu-slide-label";

    menuSlideLabel.textContent = platform;

    menuSlideContent.appendChild(menuSlideLabel);
    menuSlideContent.appendChild(menuSlideIcon);
    menuSlide.appendChild(menuSlideContent);

    return menuSlide;
}

// const platforms = [
//     "amiga",
//     "pcengine",
//     "dreamcast",
//     "gamecube",
//     "n64",
//     "settings"
// ];

Promise.all([
    ipcRenderer.invoke('get-platform-names'), // Fetch platforms
    fetch('src/html/platform_form.html').then(response => response.text()), // Fetch form template
    ipcRenderer.invoke('get-user-data') // Fetch user data
])
    .then(([platforms, formTemplate, userData]) => {
        window.userDataPath = userData.userDataPath;
        // Step 1: Build galleries and wait for it to complete
        return window.gallery.buildGalleries(platforms, userData)
            .then((res) => {
                window.gallery.buildSettingsForms(platforms, formTemplate);
            })
            .then((res) => {
                // Return the result to pass it to the next .then
                return { platforms, formTemplate };
            });
    })
    .then(({ platforms, formTemplate }) => {
        document.getElementById("loading").style.display = "none";

        window.platforms = platforms;
        platforms.forEach((platform) => {

            const homeSlide = buildSlide(platform);
            const menuItem = buildTopMenuItem(platform);

            if (menuItem) {
                window.topMenuItems.appendChild(menuItem);
            }

            slideshow.appendChild(homeSlide);
            window.control.initPlatformForm(homeSlide);
        });

        window.control.initSlideShow(slideshow);

    })
    .catch(error => {
        console.error('Failed to load platforms or form template:', error);
    });



