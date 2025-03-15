const popSounds = Array.from(document.querySelectorAll('.sound-pop'));

let whooshSound = document.getElementById('whooshSound');
let prevHoverState = null;

let particles = [];
let hoveredLetter = null;
let mouseX = 0, mouseY = 0;
const letters = {
    e1: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    m1: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    m2: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    e2: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    u: { color: 'rgb(255, 165, 0)', rgbValues: '255, 165, 0', bounds: null, particles: [] }
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let horizon = height * 2 / 3;
let isNight = false;

// 🔥 SUN CONFIGURATION
const SUN_BASE_RADIUS = 120; // Doubled from original 60
const GLOW_SCALE = 6; // Increased from 4
let sunYOffset = 0; // Added for vertical movement

const SUN_SPEED = 0.9; // Pixels per frame

const MAX_SUN_TRAVEL = height - horizon + 150; // Stop when logo reaches 100px from top

// Logo configuration
let logoY = height; // Start below screen
let logoChars = [];

// Logo configuration
const LOGO_FINAL_Y = 300;

const PARTICLES_BASE_Y = LOGO_FINAL_Y;
const PARTICLES_LENGTH = 50;

const FADE_OUT_DELAY = 5;
let hoverStartTime = 0;

// Pixel font data (7-segment style)
const pixelFont = {
    'E': [[0,0],[4,0],[0,3],[4,3],[0,6],[4,6]],
    'm': [[0,0],[0,6],[2,3],[4,0],[4,6]],
    'u': [[0,6],[4,6],[4,0]],
    'È': [[4,0],[0,0],[0,3],[4,3],[0,6],[4,6]] // Inverted E
};

function initParticles(particlesPerLetter = 4) { // Add parameter to control count
    const baseX = width/2 - 248;
    particles = [];

    Object.keys(letters).forEach(id => {
        const letter = letters[id];
        letter.particles = [];
        const svgPath = document.getElementById(id);
        const pathLength = svgPath.getTotalLength();

        const bounds = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        };

        // Generate particles as lines along the path
        for (let i = 0; i < particlesPerLetter; i++) {
            const len = (i / particlesPerLetter) * pathLength;
            const pointNext = svgPath.getPointAtLength(len + 1); // For angle calculation
            const point = svgPath.getPointAtLength(len);

            // Calculate tangent direction
            const len2 = Math.min(len + 1, pathLength); // Ensure within bounds
            const point2 = svgPath.getPointAtLength(len2);
            const angle = Math.atan2(pointNext.y - point.y, pointNext.x - point.x);

            const origX = baseX + point.x;
            const origY = PARTICLES_BASE_Y + point.y;

            bounds.minX = Math.min(bounds.minX, origX);
            bounds.maxX = Math.max(bounds.maxX, origX);
            bounds.minY = Math.min(bounds.minY, origY);
            bounds.maxY = Math.max(bounds.maxY, origY);

            letter.particles.push({
                spinSpeed: (Math.random() * 2 - 1) * PARTICLES_SPIN_SPEED,
                currentAngle: angle,
                color: letter.color,
                rgbValues: letter.rgbValues,
                origX, origY,
                x: origX,
                y: origY,
                dx: (Math.random() - 0.5) * 525,
                dy: (Math.random() - 0.5) * 525,
                letterId: id,
                alpha: 0,
                angle: angle,
                lineLength: PARTICLES_LENGTH
            });
        }

        // Store bounds with padding
        letters[id].bounds = {
            minX: bounds.minX - 15,
            maxX: bounds.maxX + 15,
            minY: bounds.minY - 15,
            maxY: bounds.maxY + 15
        };

        particles = particles.concat(letter.particles);
    });
}

// ============================
// STARFIELD (top half)
// ============================
const starCount = 150;
let stars = [];
let shootingStars = [];
for (let i = 0; i < starCount; i++) {
    stars.push({
        x: Math.random() * width,
        y: Math.random() * horizon,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.0002 + 0.05,
        opacity: Math.random() * 0.5 + 0.5
    });
}

function spawnShootingStar() {
    if (shootingStars.length < 1 && Math.random() < 0.0001 && isNight) {
        shootingStars.push({
            x: Math.random() * width,
            y: Math.random() * horizon * 0.5,
            len: Math.random() * 80 + 80,
            speed: Math.random() * 10 + 10,
            angle: Math.PI / 4,
            life: 0,
            maxLife: 30 + Math.random() * 10
        });
    }
}

function updateStars() {
    for (let star of stars) {
        star.x -= star.speed;
        if (star.x < 0) star.x = width;
    }
}

function updateShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        let s = shootingStars[i];
        s.x += s.speed * Math.cos(s.angle);
        s.y += s.speed * Math.sin(s.angle);
        s.life++;
        if (s.life > s.maxLife) {
            shootingStars.splice(i, 1);
        }
    }
}

function drawStars() {
    ctx.fillStyle = "white";
    for (let star of stars) {
        ctx.globalAlpha = star.opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawShootingStars() {
    ctx.strokeStyle = "white";
    ctx.lineWidth = 1;
    for (let s of shootingStars) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.len * Math.cos(s.angle), s.y - s.len * Math.sin(s.angle));
        ctx.stroke();
    }
}


// =======================[UPDATED SUN SYSTEM]=======================
function updateSunPosition() {
    sunYOffset += SUN_SPEED; // Gradually lower the sun
}

function drawSun() {
    const sunX = width / 2;
    const sunY = horizon + sunYOffset;

    const gradient = ctx.createRadialGradient(
        sunX, sunY, SUN_BASE_RADIUS * 0.3,
        sunX, sunY, SUN_BASE_RADIUS * GLOW_SCALE
    );
    gradient.addColorStop(0, 'rgba(255, 69, 0, 0.5)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    // Draw glow first
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    ctx.fill();

    // Main sun body (now larger)
    ctx.beginPath();
    ctx.arc(sunX, sunY, SUN_BASE_RADIUS, Math.PI, 2 * Math.PI);
    let sunGradient = ctx.createLinearGradient(0, sunY - SUN_BASE_RADIUS, 0, sunY);
    sunGradient.addColorStop(0, "#FF4500");
    sunGradient.addColorStop(1, "#FFD700");
    ctx.fillStyle = sunGradient;
    ctx.fill();

    // Sun details (scaled appropriately)
    const numLines = 8; // 🔥 Increased lines for bigger sun
    for (let i = 0; i < numLines; i++) {
        let lineY = sunY - SUN_BASE_RADIUS + (i + 1) * (SUN_BASE_RADIUS / (numLines + 1));
        ctx.beginPath();
        let dx = Math.sqrt(SUN_BASE_RADIUS ** 2 - (sunY - lineY) ** 2);
        ctx.moveTo(sunX - dx, lineY);
        ctx.lineTo(sunX + dx, lineY);
        ctx.lineWidth = 1 + (i / numLines) * 5; // 🔥 Thicker lines
        ctx.strokeStyle = "rgba(0,0,0,0.3)";
        ctx.stroke();
    }
}

// ============================
// GRID SYSTEM WITH STABLE RELIEF
// ============================
const numGridLines = 40;
const numGridCols = 30;
const gridSpeed = 0.08;
let gridOffset = 0;

// Relief pattern storage
const reliefMap = Array(numGridCols + 1).fill().map(() =>
    Array(numGridLines).fill().map(() =>
        Math.random() < 0.12 ? Math.random() * 35 + 15 : 0
    )
);

function drawGrid() {
    ctx.strokeStyle = "#00FFFF";
    ctx.lineWidth = 1;

    // Calculate horizontal positions with seamless wrap
    const horizontalPositions = Array(numGridLines).fill().map((_, i) => {
        const t = (i + gridOffset) % numGridLines;
        const perspective = t / numGridLines;
        return {
            yBase: horizon + (height - horizon) * Math.pow(perspective, 2),
            t: perspective
        };
    });

    // Draw vertical lines with coordinated relief and fading
    const roadHalfWidth = 200;
    for (let col = 0; col <= numGridCols; col++) {
        const xNorm = col / numGridCols;
        const vanishX = width/2 - roadHalfWidth + xNorm * 2 * roadHalfWidth;

        let lastPoint = null;

        horizontalPositions.forEach((pos, row) => {
            const lift = reliefMap[col][row];
            const y = pos.yBase - lift;
            const x = xNorm * width + (vanishX - xNorm * width) * (1 - pos.t);

            if (row === 0) {
                lastPoint = { x, y };
            } else {
                // Calculate alpha based on current row's t
                let baseAlpha;
                if (pos.t < 0.1) {
                    baseAlpha = 0;
                } else if (pos.t < 0.3) {
                    baseAlpha = (pos.t - 0.1) / 0.2;
                } else if (pos.t <= 0.7) {
                    baseAlpha = 1;
                } else if (pos.t < 0.9) {
                    baseAlpha = 1 - (pos.t - 0.7) / 0.2;
                } else {
                    baseAlpha = 0;
                }
                ctx.globalAlpha = baseAlpha * 0.6;

                const cpX = (lastPoint.x + x) / 2;
                const cpY = (lastPoint.y + y) / 2 - lift * 0.4;

                ctx.beginPath();
                ctx.moveTo(lastPoint.x, lastPoint.y);
                ctx.quadraticCurveTo(cpX, cpY, x, y);
                ctx.stroke();

                lastPoint = { x, y };
            }
        });
    }

    // Draw horizontal lines with connected relief and fading
    horizontalPositions.forEach((pos, row) => {
        // Calculate alpha based on row's t
        let baseAlpha;
        if (pos.t < 0.1) {
            baseAlpha = 0;
        } else if (pos.t < 0.3) {
            baseAlpha = (pos.t - 0.1) / 0.2;
        } else if (pos.t <= 0.7) {
            baseAlpha = 1;
        } else if (pos.t < 0.9) {
            baseAlpha = 1 - (pos.t - 0.7) / 0.2;
        } else {
            baseAlpha = 0;
        }
        ctx.globalAlpha = baseAlpha * 0.6;

        ctx.beginPath();
        let lastX = null, lastY = null;

        for (let col = 0; col <= numGridCols; col++) {
            const xNorm = col / numGridCols;
            const vanishX = width/2 - roadHalfWidth + xNorm * 2 * roadHalfWidth;
            const lift = reliefMap[col][row];
            const y = pos.yBase - lift;
            const x = xNorm * width + (vanishX - xNorm * width) * (1 - pos.t);

            if (col === 0) {
                ctx.moveTo(x, y);
                lastX = x;
                lastY = y;
            } else {
                const cpX = (lastX + x) / 2;
                const cpY = (lastY + y) / 2 - lift * 0.3;
                ctx.quadraticCurveTo(cpX, cpY, x, y);
                lastX = x;
                lastY = y;
            }
        }
        ctx.stroke();
    });

    ctx.globalAlpha = 1;
}



// Initialize character transformations
function initLogo() {
    logoChars = [
        { type: 'E', x: 40, flip: false },
        { type: 'm', x: 120, flip: false },
        { type: 'u', x: 200, flip: false },
        { type: 'm', x: 280, flip: true },  // Horizontally flipped
        { type: 'E', x: 360, flip: true }     // Vertically flipped
    ];
}

const PARTICLES_SPIN_SPEED = 0.05;

// function drawParticles() {
//     // ctx.clearRect(0, 0, width, height);
//     particles.forEach(particle => {
//         ctx.beginPath();
//         const halfLen = particle.lineLength * 2;
//         const dx = Math.cos(particle.angle) * halfLen;
//         const dy = Math.sin(particle.angle) * halfLen;
//         ctx.moveTo(particle.x - dx, particle.y - dy);
//         ctx.lineTo(particle.x + dx, particle.y + dy);
//         ctx.strokeStyle = particle.color;
//         ctx.lineWidth = 2; // Adjust line thickness
//         ctx.globalAlpha = particle.alpha;
//         ctx.stroke();
//     });
//     ctx.globalAlpha = 1; // Reset alpha
// }

function drawParticles() {
    // ctx.clearRect(0, 0, width, height);
    particles.forEach(particle => {
        ctx.beginPath();

        // Calculate line endpoints with rotation
        const halfLen = particle.lineLength / 2;
        const dx = Math.cos(particle.currentAngle) * halfLen;
        const dy = Math.sin(particle.currentAngle) * halfLen;

        ctx.moveTo(particle.x - dx, particle.y - dy);
        ctx.lineTo(particle.x + dx, particle.y + dy);

        particle.currentAngle += particle.spinSpeed;

        ctx.strokeStyle = particle.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = particle.alpha;
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

function drawLogo() {


    const scale = 1.0;
    const baseX = width/2 - 248; // Center 500px wide logo

    ctx.save();
    ctx.translate(baseX, logoY);
    ctx.scale(scale, scale);

    // Draw cyan elements
    ctx.lineWidth = 3;

    ['e1', 'm1', 'm2', 'e2'].forEach(id => {
        if (letters[id].visible !== false) { // Only draw if visible
            ctx.strokeStyle = '#00FFFF';
            const path = new Path2D(document.getElementById(id).getAttribute('d'));
            ctx.stroke(path);
        }
    });

    if (letters['u'].visible !== false) { // Only draw if visible
        ctx.strokeStyle = '#FFA500';
        const uPath = new Path2D(document.getElementById('u').getAttribute('d'));
        ctx.stroke(uPath);
    }

    ctx.restore();

}

let moonAlpha = 0;
let linkAlpha = 0;

function drawMoon() {
    ctx.save();
    const moonSize = 60;
    ctx.translate(width - moonSize - 220, 120);

    ctx.globalAlpha = moonAlpha;

    ctx.lineWidth = 2;

    const circus = new Path2D(document.getElementById('circus').getAttribute('d'));
    ctx.fillStyle = '#FFEEEE';
    ctx.fill(circus);
    ctx.stroke(circus);

    const crescent = new Path2D(document.getElementById('crescent').getAttribute('d'));
    ctx.fillStyle = '#000000';
    ctx.fill(crescent);
    ctx.stroke(crescent);

    ctx.restore();
    ctx.globalAlpha = 1.0; // Reset opacity for other elements
}

function updateLogoPosition() {
    const travelRatio = sunYOffset / MAX_SUN_TRAVEL;
    logoY = height + 200 - (height - LOGO_FINAL_Y + 200) * travelRatio;

    sunYOffset += SUN_SPEED; // Ensure sunYOffset updates consistently
    if (sunYOffset >= MAX_SUN_TRAVEL) {
        sunYOffset = MAX_SUN_TRAVEL;
        logoY = LOGO_FINAL_Y;
        isNight = true;
    }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function updateLogo() {
    const now = Date.now();

    Object.keys(letters).forEach(id => {
        letters[id].visible = hoveredLetter !== id;
    });

    // Sound triggers
    if (hoveredLetter !== prevHoverState) {
        if (hoveredLetter) {
            popSounds[getRandomInt(4)].play();
            hoverStartTime = now;
        } else {
            // popSound.play();
        }
        prevHoverState = hoveredLetter;
    }

    particles.forEach(p => {
        const isActive = p.letterId === hoveredLetter;

        // Fade logic
        if (isActive) {
            // Start fading after delay
            const timeActive = now - hoverStartTime;
            p.alpha = timeActive > FADE_OUT_DELAY ? Math.max(0, 1 - (timeActive - FADE_OUT_DELAY)/1000) : 1;
        } else {
            p.alpha = Math.max(0, p.alpha - 0.05);
        }

        // Position animation
        const targetX = isActive ? p.origX + p.dx : p.origX;
        const targetY = isActive ? p.origY + p.dy : p.origY;
        p.x += (targetX - p.x) * 0.05;
        p.y += (targetY - p.y) * 0.05;
    });
}

function update() {
    gridOffset += gridSpeed;
    if(gridOffset > numGridLines) gridOffset = 0;
    updateStars();
    updateShootingStars();
    spawnShootingStar();
    updateLogo();

    if(sunYOffset < MAX_SUN_TRAVEL) sunYOffset += SUN_SPEED;
    updateLogoPosition();

    if (isNight && moonAlpha < 1) {
        moonAlpha += 0.001; // Increase opacity gradually
    }
}

function drawUrl() {
    ctx.globalAlpha = moonAlpha;
    ctx.font = "9pt Monospace";
    ctx.fillStyle = '#FFEEEE';
    ctx.fillText("yphil.gitlab.io",width / 2 - 60 , height / 2 - 50);
    ctx.globalAlpha = 1.0; // Reset opacity for other elements
}

function draw() {
    ctx.clearRect(0, 0, width, height);

    // Background elements
    const skyGradient = ctx.createLinearGradient(0, width, 0, 0);
    skyGradient.addColorStop(1, "#000000"); // top
    skyGradient.addColorStop(0.5, "#111133"); // Dark blue midway
    skyGradient.addColorStop(0, "#220022"); // horizon

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizon);

    drawStars();
    drawShootingStars();
    drawSun();
    drawMoon();
    drawLogo();
    drawParticles();
    drawUrl();

    // Foreground elements
    const floorGradient = ctx.createLinearGradient(0, horizon, 0, height);
    floorGradient.addColorStop(0, "#220022"); // Black at the horizon
    floorGradient.addColorStop(0.5, "#111133"); // Dark blue midway
    floorGradient.addColorStop(1, "#000000"); // Deep purple at the bottom

    ctx.fillStyle = floorGradient;
    ctx.fillRect(0, horizon, width, height - horizon);
    drawGrid();
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;

    let newHoveredLetter = null;


    // Check hover for each letter
    /* hoveredLetter = null; */
    Object.entries(letters).forEach(([id, letter]) => {
        if (mouseX >= letter.bounds.minX &&
            mouseX <= letter.bounds.maxX &&
            mouseY >= letter.bounds.minY &&
            isNight &&
            mouseY <= letter.bounds.maxY) {
            hoveredLetter = id;
            newHoveredLetter = id;
        }
    });

    if (newHoveredLetter !== hoveredLetter) {
        hoveredLetter = newHoveredLetter;
        updateLogo();  // Call update to instantly hide/show letters
    }

});

/* canvas.addEventListener('mouseleave', () => hoveredLetter = null);
 */
initParticles();
initLogo();
loop();
window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    horizon = height * 2/3;
    sunYOffset = 0;
    logoY = height + 200;
    initLogo();
});

