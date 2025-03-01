const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuItems = document.getElementById("top-menu-items");

window.control.initGamepad();

slideshow.focus();

function buildSlide(platform) {

    if (!window.control.isEnabled(platform)) {
        return null;
    }

    // Create the slide container
    const homeSlide = document.createElement("div");
    homeSlide.className = "slide";
    homeSlide.id = platform;
    homeSlide.style.backgroundImage = `url('img/platforms/${platform}.png')`;

    homeSlide.style.backgroundImage = platform === "settings" ? `url('img/emume.png')` : `url('img/platforms/${platform}.png')`;


    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";

    homeSlide.setAttribute('data-platform', platform);

    // Append the content to the slide
    homeSlide.appendChild(slideContent);

    return homeSlide;
}

function buildTopMenuItem(platform) {

    if (!window.control.isEnabled(platform)) {
        return null;
    }

    // Create the slide container
    const menuSlide = document.createElement("div");
    menuSlide.className = "top-menu-slide";
    menuSlide.classList.add(platform);

    // menuSlide.id = platform;
    // menuSlide.style.backgroundImage = `url('img/platforms/${platform}.png')`;

    const menuSlideIcon = document.createElement("img");
    menuSlideIcon.src = platform === "settings" ? "img/emume.png" : `img/platforms/${platform}.png`;
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

const platforms = [
    {name: "amiga", details: `Amiga is a bit special ; For now it only plays <code>.adf</code> files.<br><h4>Good emulator candidates</h4><ul><li><a data-href="https://fs-uae.net/">fs-uae</a> <code>--fullscreen</code></li></ul>`},
    {name: "pcengine", details: "<h4>Good emulator candidates</h4><ul><li>Mednafen <code>-fs 1 -pce.stretch aspect -pce.shader autoipsharper</code></li></ul>"},
    {name: "dreamcast", details: "Yeah, dreamcast"},
    {name: "gamecube", details: "Yeah, gamecube"},
    {name: "snes", details: "Yeah, snes"},
    {name: "n64", details: "Yeah, n64"},
    {name: "settings", details: "Yeah, settings"}
];

Promise.all([
    // ipcRenderer.invoke('get-platform-names'),
    fetch('src/html/platform_form.html').then(response => response.text()),
    ipcRenderer.invoke('get-user-data')
])
    .then(([formTemplate, userData]) => {
        window.userDataPath = userData.userDataPath;
        return window.gallery.buildGalleries(platforms, userData)
            .then((res) => {
                window.gallery.buildSettingsForms(platforms, formTemplate);
            })
            .then((res) => {
                return { platforms, formTemplate };
            });
    })
    .then(({ platforms, formTemplate }) => {
        document.getElementById("loading").style.display = "none";

        window.platforms = platforms;
        platforms.forEach((platform) => {

            const homeSlide = buildSlide(platform.name);
            const menuItem = buildTopMenuItem(platform.name);

            if (menuItem) {
                window.topMenuItems.appendChild(menuItem);
            }

            if (homeSlide) {
                slideshow.appendChild(homeSlide);
            }

        });

        window.control.initSlideShow(slideshow);

    })
    .catch(error => {
        console.error('Failed to load platforms or form template:', error);
    });



