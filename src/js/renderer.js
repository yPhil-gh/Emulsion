const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");

LB.control.initGamepad();

function buildSlide(platformName, preferences) {

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platformName;
    const platformImgPath = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    const emulsionImgPath = path.join(LB.baseDir, 'img', 'emulsion.png');

    slide.style.backgroundImage = platformName === "settings"
        ? `url('${emulsionImgPath}')`
        : `url('${platformImgPath}')`;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";
    slideContent.innerHTML = `${LB.utils.getPlatformName(platformName)}`;

    slide.setAttribute('data-platform', platformName);

    slide.appendChild(slideContent);

    if (platformName === 'recents') {
        slide.setAttribute('data-index', LB.totalNumberOfPlatforms);
        return slide;
    }

    if (platformName !== 'settings') {
        if (LB.disabledPlatformsPolicy === 'hide' && !preferences[platformName].isEnabled) {
            return null;
        }
    }

    if (LB.kidsMode && platformName === 'settings') {
        return null;
    }

    slide.setAttribute('data-index', preferences[platformName].index);
    slide.setAttribute('data-is-enabled', preferences[platformName].isEnabled);

    return slide;
}

LB.prefs.load()
    .then((preferences) => {

        LB.galleryNumOfCols = preferences.settings.numberOfColumns;
        LB.steamGridAPIKey = preferences.settings.steamGridAPIKey;
        LB.giantBombAPIKey = preferences.settings.giantBombAPIKey;
        LB.footerSize = preferences.settings.footerSize;
        LB.homeMenuTheme = preferences.settings.homeMenuTheme;
        LB.theme = preferences.settings.theme;
        LB.disabledPlatformsPolicy = preferences.settings.disabledPlatformsPolicy;

        LB.utils.setFooterSize(LB.footerSize);
        LB.utils.applyTheme(LB.theme);

        return { preferences };

    })
    .then(async ({ preferences }) => {

        return LB.gallery.buildGalleries(preferences, LB.userDataPath)
            .then((platforms) => {
                return { platforms, preferences };
            });
    })
    .then(({ platforms, preferences }) => {

        console.log("platforms.length: ", platforms.length);

        LB.totalNumberOfPlatforms = platforms.length - 1;

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

