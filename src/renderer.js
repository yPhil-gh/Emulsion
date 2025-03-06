const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");

// window.control.initGamepad();

function isPlatformValid(platform, preferences) {
    if (!preferences[platform]) return false; // Platform doesn't exist in config
    const { gamesDir, emulator } = preferences[platform];
    return Boolean(gamesDir && emulator); // Both must be non-empty
}

function buildSlide(platform, preferences) {

    if (!isPlatformValid(platform, preferences)) {
        return null;
    }

    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platform;
    // slide.style.backgroundImage = `url('../img/platforms/${platform}.png')`;
    const imagePath = path.join(__dirname, 'img', 'platforms', `${platform}.png`);
    slide.style.backgroundImage = `url('${imagePath}')`;
    slide.style.backgroundImage = platform === "settings" ? `url('../img/emume.png')` : `url('../img/platforms/${platform}.png')`;

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";

    slide.setAttribute('data-platform', platform);

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
            console.log("preferences: ", preferences);
            const homeSlide = buildSlide(platform, preferences, LB.userDataPath);
            if (homeSlide) {
                slideshow.appendChild(homeSlide);
            }
        });

        const galleriesContainer = document.getElementById('galleries');
        galleriesContainer.style.display = 'none';
        LB.control.initSlideShow();
        document.getElementById("loading-screen").style.display = 'none';

        document.getElementById("header").style.display = 'flex';
        document.getElementById("main").style.display = 'flex';
        document.getElementById("footer").style.display = 'flex';
    })
    .catch(error => {
        console.error('Failed to load platforms:', error);
    });
