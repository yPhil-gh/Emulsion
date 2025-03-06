const carousel = document.getElementById('galleries');
console.log("carousel: ", carousel);
let currentIndex = 1; // Start at the first real page (index 1)
const totalPages = 4; // Number of real pages
const pageWidth = window.innerWidth;

// Set up the grid and rectangle sizes based on the initial window size
function setupGrid() {
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, pageIndex) => {
        console.log("init: ");
        console.log("page: ", page);
        const pageContent = page.querySelector('.page-content');
        const rows = Math.ceil((window.innerHeight - 100) / 350); // Adjust row height for portrait style
        for (let i = 0; i < 6 * rows; i++) { // 6 columns * number of rows
            const rect = document.createElement('div');
            if (i === 0) {
                rect.textContent = `Page ${((pageIndex - 1 + totalPages) % totalPages) + 1}`; // Add content to the first rectangle
            }
            pageContent.appendChild(rect);
        }
    });
}

// Move the carousel to the specified index
function moveToIndex(index) {
    console.log("plop: ", `translateX(${-index * pageWidth}px)`);
    carousel.style.transform = `translateX(${-index * pageWidth}px)`;
}

// Scroll to the next page
function handleScrollRight() {
    currentIndex++;
    if (currentIndex > totalPages + 1) {
        // Instantly reset to the real first page without animation
        carousel.style.transition = 'none';
        moveToIndex(1);
        setTimeout(() => {
            carousel.style.transition = 'transform 0.5s ease';
            currentIndex = 2; // Reset to the second page (real first page)
            moveToIndex(currentIndex);
        }, 0);
    } else {
        moveToIndex(currentIndex);
    }
}

// Scroll to the previous page
function handleScrollLeft() {
    currentIndex--;
    if (currentIndex < 0) {
        // Instantly reset to the real last page without animation
        carousel.style.transition = 'none';
        moveToIndex(totalPages + 1);
        setTimeout(() => {
            carousel.style.transition = 'transform 0.5s ease';
            currentIndex = totalPages; // Reset to the second-to-last page (real last page)
            moveToIndex(currentIndex);
        }, 0);
    } else {
        moveToIndex(currentIndex);
    }
}

// Handle arrow key navigation
function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
        handleScrollRight();
    } else if (event.key === 'ArrowLeft') {
        handleScrollLeft();
    }
}

// Initialize the carousel
function init() {
    // setupGrid();
    moveToIndex(currentIndex); // Start at the first real page
    carousel.addEventListener('keydown', handleKeyDown);
}

init();
