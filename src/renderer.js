const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");

LB.control.initGamepad();

function isPlatformValid(platformName, preferences) {
    if (typeof preferences !== 'object' || preferences === null) {
        console.error("Preferences is not an object");
        return false;
    }

    const platformPrefs = preferences[platformName];
    if (
        typeof platformPrefs !== 'object' ||
            platformPrefs === null ||
            typeof platformPrefs.isEnabled !== 'boolean' ||
            typeof platformPrefs.gamesDir !== 'string' ||
            typeof platformPrefs.emulator !== 'string' ||
            typeof platformPrefs.emulatorArgs !== 'string'
    ) {
        console.error(`Invalid preferences for platform: ${platformName}`);
        return false;
    }

    return true;
}

function isPlatformEnablable(platform, preferences) {
    if (!preferences[platform]) return false; // Platform doesn't exist in config
    const { gamesDir, emulator } = preferences[platform];
    return Boolean(gamesDir && emulator); // Both must be non-empty
}

function buildSlide(platformName, preferences) {

    if (!isPlatformValid(platformName, preferences)) {
        return null;
    }

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platformName;
    const platformImgPath = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
    const emumeImgPath = path.join(LB.baseDir, 'img', 'emume.png');
    slide.style.backgroundImage = platformName === "settings"
        ? `url('${emumeImgPath}')`
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
        return { preferences };

    })
    .then(async ({ preferences }) => {

        return LB.gallery.buildGalleries(preferences, LB.userDataPath)
            .then((platforms) => {
                return { platforms, preferences };
            });
    })
    .then(({ platforms, preferences }) => {
        window.platforms = platforms;

        let i = 0;
        platforms.forEach((platform) => {
            const homeSlide = buildSlide(platform, preferences, LB.userDataPath);
            if (homeSlide) {
                slideshow.appendChild(homeSlide);
            }
        });

        const galleriesContainer = document.getElementById('galleries');
        galleriesContainer.style.display = 'none';
        LB.control.initSlideShow();

        // document.getElementById("header").style.display = 'flex';
        document.getElementById("main").style.display = 'flex';
        document.getElementById("footer").style.display = 'flex';
    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });
