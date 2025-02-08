const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// Path to package.json
const packageJsonPath = path.join(__dirname, 'package.json');


// Read platforms from package.json
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const platforms = pkg.platforms || [];

platforms.forEach(platform => {
    console.log(`Platform: ${platform}`);
});


// Build the slideshow content dynamically
const slideshow = document.getElementById("slideshow");

platforms.forEach((platform) => {
  // Create the slide container
  const slide = document.createElement("div");
  slide.className = "slide";
  slide.style.backgroundImage = `url('img/${platform}.png')`;

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
    <button type="button" class="browse-button" data-platform="${platform}" data-input="${platform}-games-dir">Browse</button>
  `;

  // Add input and buttons for emulator
  form.innerHTML += `
    <label for="${platform}-emulator">Emulator:</label>
    <input type="text" id="${platform}-emulator" readonly>
    <button type="button" class="browse-button" data-platform="${platform}" data-input="${platform}-emulator">Browse</button>
  `;

  // Add save button
  form.innerHTML += `
    <button type="button" class="save-button" data-platform="${platform}">Save</button>
  `;

  // Append the form to the content
  content.appendChild(form);

  // Append the content to the slide
  slide.appendChild(content);

  // Append the slide to the slideshow container
  slideshow.appendChild(slide);
});

// // Activate the first slide
// if (slideshow.firstChild) {
//   slideshow.firstChild.classList.add("active");
// }

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
  }
});

// Click navigation
slides.forEach((slide, index) => {
  slide.addEventListener('click', () => {
    currentSlide = index;
    showSlide(currentSlide);
  });
});

// Initialize slideshow
showSlide(currentSlide);

// Platform form logic
document.querySelectorAll('.browse-button').forEach(button => {
  button.addEventListener('click', async () => {
    const platform = button.getAttribute('data-platform');
    const inputId = button.getAttribute('data-input');
    const inputElement = document.getElementById(inputId);

    if (button.textContent === 'Browse') {
      const path = await ipcRenderer.invoke('select-directory'); // Use ipcRenderer.invoke
      if (path) inputElement.value = path;
    }
  });
});

document.querySelectorAll('.save-button').forEach(button => {
  button.addEventListener('click', async () => {
    const platform = button.getAttribute('data-platform');
    const gamesDir = document.getElementById(`${platform}-games-dir`).value;
    const emulator = document.getElementById(`${platform}-emulator`).value;

    if (!gamesDir || !emulator) {
      alert('Please specify both the Games Directory and Emulator.');
      return;
    }

    await ipcRenderer.invoke('save-preferences', platform, { gamesDir, emulator }); // Use ipcRenderer.invoke
    alert('Preferences saved!');
  });
});

// Load saved preferences
window.addEventListener('load', async () => {
  platforms.forEach(async platform => {
    try {
      const preferences = await ipcRenderer.invoke('load-preferences', platform); // Use ipcRenderer.invoke
      document.getElementById(`${platform}-games-dir`).value = preferences.gamesDir;
      document.getElementById(`${platform}-emulator`).value = preferences.emulator;
    } catch (error) {
      console.error(`Error loading preferences for ${platform}:`, error);
    }
  });
});
