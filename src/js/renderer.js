const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");

LB.control.initGamepad();

function buildSlide(platformName, preferences) {

    // if (!isPlatformValid(platformName, preferences)) {
    //     console.log("null: ", platformName);
    //     return null;
    // }

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.setAttribute('data-index', preferences[platformName].index);
    slide.id = platformName;
    const platformImgPath = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    const emulsionImgPath = path.join(LB.baseDir, 'img', 'emulsion.png');
    slide.style.backgroundImage = platformName === "settings"
        ? `url('${emulsionImgPath}')`
        : `url('${platformImgPath}')`;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";

    slide.setAttribute('data-platform', platformName);

    slide.appendChild(slideContent);

    return slide;
}

LB.prefs.load()
    .then((preferences) => {

        console.log("preferences: ", preferences);

        if (!preferences) {
            console.log("No preferences found, using default preferences");
        }

        LB.galleryNumOfCols = preferences.settings.numberOfColumns;
        LB.steamGridAPIKey = preferences.settings.steamGridAPIKey;
        LB.footerSize = preferences.settings.footerSize;
        LB.homeMenuTheme = preferences.settings.homeMenuTheme;

        LB.control.setFooterSize(LB.footerSize);

        return { preferences };

    })
    .then(async ({ preferences }) => {

        return LB.gallery.buildGalleries(preferences, LB.userDataPath)
            .then((platforms) => {
                return { platforms, preferences };
            });
    })
    .then(({ platforms, preferences }) => {

        platforms.forEach((platform) => {
            const homeSlide = buildSlide(platform, preferences);
            if (homeSlide) {
                slideshow.appendChild(homeSlide);
            }
        });

        const galleriesContainer = document.getElementById('galleries');
        galleriesContainer.style.display = 'none';

        document.getElementById("main").style.display = 'flex';
        LB.control.initSlideShow();
        document.getElementById("splash").style.display = 'none';
        document.getElementById("footer").style.display = 'flex';
    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });

window.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (event.target.nodeName === 'INPUT' || event.target.nodeName === 'TEXTAREA') {
        ipcRenderer.send('show-context-menu', { x: event.x, y: event.y });
    }
});

