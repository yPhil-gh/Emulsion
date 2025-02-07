let selectedIndex = 0; // Start with the first div selected

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is fully loaded!');

  const carousel = document.getElementById('carousel');
  const divCount = 6; // Change this to 4, 5, or 6 as needed

  // Add divs dynamically
  for (let i = 0; i < divCount; i++) {
    const div = document.createElement('div');
    div.textContent = `Div ${i + 1}`;
    carousel.appendChild(div);
  }

  // Center the selected div
  updateCarouselPosition();

  // Handle left/right arrow keys
  document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      selectedIndex = (selectedIndex - 1 + divCount) % divCount; // Circular left
      updateCarouselPosition();
    } else if (event.key === 'ArrowRight') {
      selectedIndex = (selectedIndex + 1) % divCount; // Circular right
      updateCarouselPosition();
    }
  });
});

function updateCarouselPosition() {
  const carousel = document.getElementById('carousel');
  const divs = document.querySelectorAll('.carousel div');
  const divWidth = divs[0].offsetWidth + 20; // Width + gap

  // Calculate the offset to center the selected div
  const offset = -selectedIndex * divWidth;
  carousel.style.transform = `translateX(${offset}px)`;

  // Highlight the selected div
  divs.forEach((div, index) => {
    if (index === selectedIndex) {
      div.classList.add('selected'); // Highlight selected div
    } else {
      div.classList.remove('selected'); // Remove highlight from others
    }
  });
}
