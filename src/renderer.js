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
      const path = await window.api.selectDirectory(); // Use window.api.selectDirectory
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

    await window.api.savePreferences(platform, { gamesDir, emulator }); // Use window.api.savePreferences
    alert('Preferences saved!');
  });
});

// Load saved preferences
window.addEventListener('load', async () => {
  const platforms = ['amiga', 'dreamcast', 'gamecube'];
  platforms.forEach(async platform => {
    try {
      const preferences = await window.api.loadPreferences(platform); // Use window.api.loadPreferences
      document.getElementById(`${platform}-games-dir`).value = preferences.gamesDir;
      document.getElementById(`${platform}-emulator`).value = preferences.emulator;
    } catch (error) {
      console.error(`Error loading preferences for ${platform}:`, error);
    }
  });
});
