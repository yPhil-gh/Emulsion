const slides = document.querySelectorAll('.slide');
let currentSlide = 0;

// Function to update slide classes: active slide is fully opaque,
// immediate neighbors get shifted far apart and scaled.
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

// Listen to keyboard events for navigation.
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  } else if (event.key === 'ArrowLeft') {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
  } else if (event.key === 'Enter') {
    console.log(`Slide selected via RETURN: ${slides[currentSlide].textContent.trim()}`);
  }
});

// Log selection when a slide is clicked.
slides.forEach((slide, index) => {
  slide.addEventListener('click', () => {
    currentSlide = index;
    showSlide(currentSlide);
    console.log(`Slide selected via click: ${slide.textContent.trim()}`);
  });
});

// Initialize the slideshow.
showSlide(currentSlide);
