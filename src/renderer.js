// src/renderer.js

let selectedIndex = 1; // Start with the middle platform selected

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is fully loaded!');

  const platformsMenu = document.getElementById('platforms-menu');
  const platforms = ['amiga', 'dreamcast', 'gamecube'];

  // Add platforms dynamically
  platforms.forEach((platform, index) => {
    const platformDiv = document.createElement('div');
    platformDiv.className = 'platform';
    platformDiv.style.backgroundImage = `./img/${platform}.png`;
    platformDiv.textContent = platform.toUpperCase();
    platformsMenu.appendChild(platformDiv);
  });

  // Center the selected platform
  updatePlatformPosition();

  // Handle left/right arrow keys with circular wrap-around
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      // Decrement and wrap around if necessary
      selectedIndex = (selectedIndex - 1 + platforms.length) % platforms.length;
      updatePlatformPosition();
    } else if (event.key === 'ArrowRight') {
      // Increment and wrap around if necessary
      selectedIndex = (selectedIndex + 1) % platforms.length;
      updatePlatformPosition();
    }
  });
});

function updatePlatformPosition() {
  const platformsMenu = document.getElementById('platforms-menu');
  const platforms = document.querySelectorAll('.platform');
  const platformWidth = platforms[0].offsetWidth + 20; // width plus gap

  // Calculate the offset to center the selected platform
  const offset = -selectedIndex * platformWidth;
  platformsMenu.style.transform = `translateX(${offset}px)`;

  // Highlight the selected platform
  platforms.forEach((platform, index) => {
    if (index === selectedIndex) {
      platform.style.border = '2px solid #007bff';
    } else {
      platform.style.border = 'none';
    }
  });
}
