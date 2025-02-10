// Path to package.json
const packageJsonPath = path.join(__dirname, 'package.json');

// Read platforms from package.json
const pjson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const platforms = pjson.platforms || [];

window.control.logStatus();

// Build the slideshow content dynamically
const slideshow = document.getElementById("slideshow");

// Load the form template asynchronously
fetch('src/html/platform_form.html')
    .then(response => response.text())
    .then(formTemplate => {
        platforms.forEach((platform) => {
            // Create the slide container
            const slide = document.createElement("div");
            slide.className = "slide";
            slide.id = platform;
            slide.style.backgroundImage = `url('img/${platform}.png')`;

            const prefString = localStorage.getItem(platform);

            let prefs;

            if (prefString) {
                prefs = JSON.parse(prefString);

                slide.setAttribute('data-platform', platform);
                slide.setAttribute('data-games-dir', prefs.gamesDir);
                slide.setAttribute('data-emulator', prefs.emulator);
                slide.setAttribute('data-emulator-args', prefs.emulatorArgs);

                slide.classList.add('runnable');
            }

            // Create the content container
            const content = document.createElement("div");
            content.className = "slide-content";

            // Create the form using the template
            const form = document.createElement("div");
            form.innerHTML = formTemplate;

            // Update form IDs and attributes for the current platform
            const platformForm = form.querySelector('#platform-form');
            platformForm.id = `${platform}-form`;

            const gamesDirInput = form.querySelector('#games-dir');
            gamesDirInput.id = `${platform}-games-dir`;
            gamesDirInput.value = (prefs && prefs.gamesDir) ? prefs.gamesDir : "";

            console.log("prefs: ", prefs);

            const browseDirButton = form.querySelector('.browse-button-dir');
            browseDirButton.setAttribute('data-platform', platform);
            browseDirButton.setAttribute('data-input', `${platform}-games-dir`);

            const emulatorInput = form.querySelector('#emulator');
            emulatorInput.id = `${platform}-emulator`;
            emulatorInput.value = (prefs && prefs.emulator) ?  prefs.emulator : "";

            const emulatorArgsInput = form.querySelector('#emulator-args');
            emulatorArgsInput.id = `${platform}-emulator-args`;
            emulatorArgsInput.classList.add('emulator-args');
            emulatorArgsInput.value = (prefs && prefs.emulatorArgs) ? prefs.emulatorArgs : "";

            const browseEmulatorButton = form.querySelector('.browse-button-file');
            browseEmulatorButton.setAttribute('data-platform', platform);
            browseEmulatorButton.setAttribute('data-input', `${platform}-emulator`);

            const saveButton = form.querySelector('.save-button');
            saveButton.setAttribute('data-platform', platform);

            // Append the form to the content
            content.appendChild(form);

            if (prefString) {
                // Hide the form if preferences exist.
                platformForm.style.display = 'none';
                // platformForm.style.pointerEvents = 'none';
            }

            // Append the content to the slide
            slide.appendChild(content);

            // Append the slide to the slideshow container
            slideshow.appendChild(slide);
        });

        // Initialize slideshow navigation and form logic
        initializeSlideshow();
        initializeFormLogic();
    })
    .catch(error => {
        console.error('Failed to load form template:', error);
    });

// Function to initialize slideshow navigation
function initializeSlideshow() {
    const slides = document.querySelectorAll('.slide');
    let currentSlide = 0;

    // Function to update slide classes
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active', 'adjacent', 'active-left', 'active-right');
            if (i === index) {
                slide.classList.add('active');
            } else if (i === (index - 1 + slides.length) % slides.length) {
                slide.classList.add('adjacent', 'active-left');
            } else if (i === (index + 1) % slides.length) {
                slide.classList.add('adjacent', 'active-right');
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (event) => {

        // event.stopPropagation();

        if (event.key === 'ArrowRight') {
            currentSlide = (currentSlide + 1) % slides.length;
            showSlide(currentSlide);
        } else if (event.key === 'ArrowLeft') {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        } else if (event.key === 'i') {
            console.log("i & I: ", currentSlide);
            const platform = slides[currentSlide].getAttribute('data-platform');
            console.log("platform: ", platform);
            slides[currentSlide].querySelector('.platform-form').style.display = "block";

        } else if (event.key === 'Enter') {
            console.log(`Slide selected via RETURN: ${slides[currentSlide].textContent.trim()}`);
            console.log('Current slide classList:', slides[currentSlide].classList);

            if (slides[currentSlide].classList.contains('runnable')) {
                // Hide the slideshow div
                document.getElementById('slideshow').style.display = 'none';
                console.log("platform: ", slides[currentSlide].getAttribute('data-platform'));
                console.log("games-dir: ", slides[currentSlide].getAttribute('data-games-dir'));

                const platform = slides[currentSlide].getAttribute('data-platform');
                const gamesDir = slides[currentSlide].getAttribute('data-games-dir');
                const emulator = slides[currentSlide].getAttribute('data-emulator');
                const emulatorArgs = slides[currentSlide].getAttribute('data-emulator-args');

                ipcRenderer.invoke('get-main-data')
                    .then(({ userDataPath }) => {
                        window.userDataPath = userDataPath;
                        if (!document.querySelector('.gallery')) {
                            gallery.buildGallery(platform, gamesDir, emulator, emulatorArgs, userDataPath);
                        }
                    });
            }
        }
    });

    // Initialize slideshow
    showSlide(currentSlide);
}

// Function to initialize form logic
function initializeFormLogic() {
    // Platform form logic
    document.querySelectorAll('.browse-button-dir').forEach(button => {
        button.addEventListener('click', async () => {
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
        button.addEventListener('click', async () => {
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
        button.addEventListener('click', () => {
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

            alert('Preferences saved!');

            const parentForm = button.closest('.platform-form');
            if (parentForm) {
                parentForm.style.display = 'none';
                // parentForm.style.pointerEvents = 'none';
            }
        });
    });

    window.addEventListener('load', async () => {
        platforms.forEach(async platform => {
            try {
                const prefString = localStorage.getItem(platform);
                if (prefString) {
                    const preferences = JSON.parse(prefString);
                    document.getElementById(`${platform}-games-dir`).value = preferences.gamesDir;
                    document.getElementById(`${platform}-emulator`).value = preferences.emulator;
                }
            } catch (error) {
                console.error(`Error loading preferences for ${platform}:`, error);
            }
        });
    });
}
