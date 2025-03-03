const { ipcRenderer } = require('electron');

const carousel = document.getElementById("carousel");
window.topMenu = document.getElementById("top-menu");
window.topMenuSlider = document.getElementById("top-menu-slider");


// window.control.initGamepad();

// platformsCarousel.focus();

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

const platforms = [
    {name: "dreamcast", details: "Yeah, dreamcast"},
    {name: "amiga", details: `Amiga is a bit special ; For now it only plays <code>.adf</code> files.<br><h4>Good emulator candidates</h4><ul><li><a data-href="https://fs-uae.net/">fs-uae</a> <code>--fullscreen</code></li></ul>`},
    {name: "pcengine", details: "<h4>Good emulator candidates</h4><ul><li>Mednafen <code>-fs 1 -pce.stretch aspect -pce.shader autoipsharper</code></li></ul>"},
    {name: "gamecube", details: "Yeah, gamecube"},
    {name: "snes", details: "Yeah, snes"},
    {name: "n64", details: "Yeah, n64"},
    {name: "settings", details: "Yeah, settings"}
];

Promise.all([
    // ipcRenderer.invoke('get-platform-names'),
    ipcRenderer.invoke('get-user-data')
])
    .then(async ([userData]) => {
        console.log("userData.userDataPath: ", userData.userDataPath);
        LB.userDataPath = userData.userDataPath;
        return LB.gallery.buildGalleries(platforms, userData)
            .then((res) => {
                return { platforms };
            });
    })
    .then(({ platforms }) => {
        console.log("platforms: ", platforms);
        // document.getElementById("loading").style.display = "none";

        // window.platforms = platforms;

        // let i = 0;
        // platforms.forEach((platform) => {
        //     const homeSlide = buildSlide(platform.name);

        //     if (homeSlide) {
        //         platformsCarousel.appendChild(homeSlide);
        //     }

        // });

        // window.control.initSlideShow(slideshow);

    })
    .catch(error => {
        console.error('Failed to load platforms or form template:', error);
    });

// document.addEventListener('keydown', () => {
//     console.log("keydown: ");
// });
