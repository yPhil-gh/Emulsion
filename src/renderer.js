const slideshow = document.getElementById("slideshow");
window.topMenu = document.getElementById("top-menu");
window.topMenuItems = document.getElementById("top-menu-items");

window.control.initGamepad();

slideshow.focus();

function buildSlide(platform, formTemplate) {

    // Create the slide container
    const homeSlide = document.createElement("div");
    homeSlide.className = "slide";
    homeSlide.id = platform;
    homeSlide.style.backgroundImage = `url('img/platforms/${platform}.png')`;

    const prefString = localStorage.getItem(platform);

    let prefs;

    if (prefString) {
        prefs = JSON.parse(prefString);

        homeSlide.setAttribute('data-platform', platform);
        homeSlide.setAttribute('data-games-dir', prefs.gamesDir);
        homeSlide.setAttribute('data-emulator', prefs.emulator);
        homeSlide.setAttribute('data-emulator-args', prefs.emulatorArgs);
        homeSlide.classList.add('ready');
    }

    const slideContent = document.createElement("div");
    slideContent.className = "slide-content";

    const form = document.createElement("div");
    form.innerHTML = formTemplate;
    form.className = "slide-form-container";

    const platformForm = form.querySelector('#platform-form');
    platformForm.id = `${platform}-form`;

    function capitalizeWord(word) {
        if (!word) return word;
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    const gamesDirInput = form.querySelector('#games-dir');
    gamesDirInput.id = `${platform}-games-dir`;
    gamesDirInput.value = (prefs && prefs.gamesDir) ? prefs.gamesDir : "";

    gamesDirInput.placeholder = `${capitalizeWord(platform)} Games Directory`;

    const browseDirButton = form.querySelector('.browse-button-dir');
    browseDirButton.setAttribute('data-platform', platform);
    browseDirButton.setAttribute('data-input', `${platform}-games-dir`);

    const emulatorInput = form.querySelector('#emulator');
    emulatorInput.id = `${platform}-emulator`;
    emulatorInput.value = (prefs && prefs.emulator) ?  prefs.emulator : "";

    emulatorInput.placeholder = `${platform} Emulator`;

    const emulatorArgsInput = form.querySelector('#emulator-args');
    emulatorArgsInput.id = `${platform}-emulator-args`;
    emulatorArgsInput.classList.add('emulator-args');
    emulatorArgsInput.value = (prefs && prefs.emulatorArgs) ? prefs.emulatorArgs : "";
    emulatorArgsInput.placeholder = `args`;

    const browseEmulatorButton = form.querySelector('.browse-button-file');
    browseEmulatorButton.setAttribute('data-platform', platform);
    browseEmulatorButton.setAttribute('data-input', `${platform}-emulator`);

    const saveButton = form.querySelector('.save-button');
    saveButton.setAttribute('data-platform', platform);

    // Append the form to the content
    slideContent.appendChild(form);

    // Append the content to the slide
    homeSlide.appendChild(slideContent);

    return homeSlide;
}

function buildMenuItem(platform) {

    const prefString = localStorage.getItem(platform);

    let prefs;

    if (prefString) {
        prefs = JSON.parse(prefString);
        if (!prefs.gamesDir && !prefs.emulator) {
            return null;
        }
    } else {
        return null;
    }


    // Create the slide container
    const menuSlide = document.createElement("div");
    menuSlide.className = "menu-slide";
    // menuSlide.id = platform;
    // menuSlide.style.backgroundImage = `url('img/platforms/${platform}.png')`;

    const menuIcon = document.createElement("img");
    menuIcon.src = `img/platforms/${platform}.png`;
    menuIcon.className = "menu-icon";

    const menuSlideContent = document.createElement("div");
    menuSlideContent.className = "menu-slide-content";

    menuSlideContent.appendChild(menuIcon);
    menuSlide.appendChild(menuSlideContent);

    return menuSlide;
}

Promise.all([
    ipcRenderer.invoke('get-platform-names'), // Fetch platforms
    fetch('src/html/platform_form.html').then(response => response.text()), // Fetch form template
    ipcRenderer.invoke('get-user-data') // Fetch user data
])
    .then(([platforms, formTemplate, userData]) => {
        // Step 1: Build galleries and wait for it to complete
        return window.gallery.buildGalleries(platforms, userData)
            .then((res) => {
                console.log("res: ", res);
                // Return the result to pass it to the next .then
                return { platforms, formTemplate };
            });
    })
    .then(({ platforms, formTemplate }) => {
        window.platforms = platforms;
        platforms.forEach((platform) => {

            const homeSlide = buildSlide(platform, formTemplate);
            const menuItem = buildMenuItem(platform);

            if (menuItem) {
                window.topMenuItems.appendChild(menuItem);
            }

            slideshow.appendChild(homeSlide);
        });

        window.control.initSlideShow(slideshow);

        initPlatformPrefs();
    })
    .catch(error => {
        console.error('Failed to load platforms or form template:', error);
    });


// Function to initialize form logic
function initPlatformPrefs() {
    // Platform form logic
    document.querySelectorAll('.browse-button-dir').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            const platform = button.getAttribute('data-platform');
            const inputId = button.getAttribute('data-input');
            const inputElement = document.getElementById(inputId);

            if (button.textContent === 'Browse') {
                const selectedPath = await ipcRenderer.invoke('select-directory');
                if (selectedPath) inputElement.value = selectedPath;
            }
        });
    });

    document.querySelectorAll('.browse-button-file').forEach(button => {
        button.addEventListener('click', async (event) => {
            event.stopPropagation();
            const platform = button.getAttribute('data-platform');
            const inputId = button.getAttribute('data-input');
            const inputElement = document.getElementById(inputId);

            if (button.textContent === 'Browse') {
                const selectedPath = await ipcRenderer.invoke('select-file');
                if (selectedPath) inputElement.value = selectedPath;
            }
        });
    });

    document.querySelectorAll('.save-button').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const platform = button.getAttribute('data-platform');
            const gamesDir = document.getElementById(`${platform}-games-dir`).value;
            const emulator = document.getElementById(`${platform}-emulator`).value;
            const emulatorArgs = document.getElementById(`${platform}-emulator-args`).value;

            if (!gamesDir || !emulator) {
                alert('Please specify both the Games Directory and Emulator.');
                return;
            }

            const preferences = { gamesDir, emulator, emulatorArgs };
            localStorage.setItem(platform, JSON.stringify(preferences));

            // alert('Preferences saved!');
            window.control.showStatus("Preferences saved!");

            const parentForm = button.closest('.platform-form');
            if (parentForm) {
                parentForm.style.display = 'none';
                // parentForm.style.pointerEvents = 'none';
            }
        });
    });

    ipcRenderer.invoke('get-user-data')
        .then(({ userDataPath }) => {
            window.userDataPath = userDataPath;
            ipcRenderer.invoke('get-platform-names')

        });

    Promise.all([
        ipcRenderer.invoke('get-platform-names'),
        fetch('src/html/platform_form.html')
            .then(response => response.text())
    ])
        .then(([platforms, formTemplate]) => {
            platforms.forEach((platform) => {
                console.log("platform: ", platform);
            });


        })
        .catch(error => {
            console.error('Failed to load form template:', error);
        });

}
