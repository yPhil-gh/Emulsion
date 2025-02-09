const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, 'package.json');

// Read platforms from package.json
const pjson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const platforms = pjson.platforms || [];

window.gamepad.logStatus();

// Build the slideshow content dynamically
const slideshow = document.getElementById("slideshow");

platforms.forEach((platform) => {
    // Create the slide container
    const slide = document.createElement("div");
    slide.className = "slide";
    slide.id = platform;
    slide.style.backgroundImage = `url('img/${platform}.png')`;

    const prefString = localStorage.getItem(platform);

    if (prefString) {
        const prefs = JSON.parse(prefString);

        slide.setAttribute('data-platform', platform);
        slide.setAttribute('data-games-dir', prefs.gamesDir);
        slide.setAttribute('data-emulator', prefs.emulator);
        slide.setAttribute('data-emulator-args', prefs.emulatorArgs);

        slide.classList.add('runnable');

        // console.log(`Preferences for ${platform}:`, prefs);
    } else {
        // console.log(`No preferences found for ${platform}`);
    }


    // Create the content container
    const content = document.createElement("div");
    content.className = "slide-content";

    // Create the form
    const form = document.createElement("form");
    form.id = `${platform}-form`;
    form.className = "platform-form";

    // Add input and buttons for games directory
    form.innerHTML += `
    <label for="${platform}-games-dir">Games Directory:</label>
    <input type="text" id="${platform}-games-dir" readonly>
    <button type="button" class="browse-button-dir" data-platform="${platform}" data-input="${platform}-games-dir">Browse</button>
  `;

    // Add input and buttons for emulator
    form.innerHTML += `
    <label for="${platform}-emulator">Emulator:</label>
    <input type="text" id="${platform}-emulator" readonly>
    <button type="button" class="browse-button-file" data-platform="${platform}" data-input="${platform}-emulator">Browse</button>
  `;

    // Add save button
    form.innerHTML += `
    <button type="button" class="save-button" data-platform="${platform}">Save</button>
  `;

    // Append the form to the content
    content.appendChild(form);
    if (prefString) {
        // Hide the form if preferences exist.
        form.style.display = 'none';
        form.style.pointerEvents = 'none';
    }
    // Append the content to the slide
    slide.appendChild(content);

    // Append the slide to the slideshow container
    slideshow.appendChild(slide);
});

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
    if (event.key === 'ArrowRight') {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    } else if (event.key === 'ArrowLeft') {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
    } else if (event.key === 'Enter') {
        console.log(`Slide selected via RETURN: ${slides[currentSlide].textContent.trim()}`);
        // Log the class list of the current slide
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
                    gallery.buildGalleryForPlatform(platform, gamesDir, emulator, emulatorArgs, userDataPath);
                });

        }
    }
});


// Click navigation: when a slide is clicked, select it,
// show it, and if it's active, build the gallery.
slides.forEach((slide, index) => {
  slide.addEventListener('click', () => {
    currentSlide = index;
    showSlide(currentSlide);

    // After updating the classes, check if the clicked slide is active.
    if (slide.classList.contains('runnable')) {
      // Get the platform from the slide's id attribute.
      const platform = slide.id;
      // Build the gallery for that platform.
      gallery.buildGalleryForPlatform(platform);
    }
  });
});

// Initialize slideshow
showSlide(currentSlide);

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

        if (!gamesDir || !emulator) {
            alert('Please specify both the Games Directory and Emulator.');
            return;
        }

        const preferences = { gamesDir, emulator };
        localStorage.setItem(platform, JSON.stringify(preferences));
        console.log('Saved Preferences:', preferences);

        alert('Preferences saved!');

        const parentForm = button.closest('.platform-form');
        if (parentForm) {
            parentForm.style.display = 'none';
            parentForm.style.pointerEvents = 'none';
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
            // console.log(`Loaded preferences for ${platform}`);
        } catch (error) {
            console.error(`Error loading preferences for ${platform}:`, error);
        }
    });
});
