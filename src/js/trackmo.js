// Vars -----------------------------
const globalSpeed = 0.8; // Pixels per frame

let sunStarted = false;

const liquidColorRgb = '102, 0, 153';

const wave = document.querySelector('.wave');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;
let horizon = height * 2 / 3;
let isNight = false;
let mouseX = 0, mouseY = 0;

const letters = {
    e: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    m: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    u: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    l: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    s: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    i: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    o: { color: 'rgb(0, 255, 255)', rgbValues: '0, 255, 255', bounds: null, particles: [] },
    n: { color: 'rgb(255, 165, 0)', rgbValues: '255, 165, 0', bounds: null, particles: [] }
};

const popSounds = Array.from(document.querySelectorAll('.sound-pop'));

const electricColors = [
    "#00FFFF", // Cyan
    "#FF00FF", // Magenta
    "#00FF00", // Lime
    "#FF007F", // Bright Pink
    "#7F00FF", // Electric Purple
    "#FFAA00", // Electric Orange
    "#00FF7F", // Spring Green
    "#FF007F"  // Hot Pink
];

let randomColor = electricColors[Math.floor(Math.random() * electricColors.length)];

const sunSpeed = globalSpeed;
const sunBaseRadius = 120;
const sunGlowScale = 6;
let sunYOffset = - 400;
const maxSunTravel = height - horizon + 250;
const nightOffset = 400;

const moonSpeed = 0.008;
const moonAmplitude = 0.2; // Vertical movement
let moonX = width - 160;
let moonFloatPhase = 0;
let moonAlpha = 0;

let starsMoveLeft = false;

// Logo conf
let logoChars = [];
const logoInitialY = horizon - 18; // Just below horizon
const logoFinalY = 200;
let logoSpeed = 0; // Current rise speed
let logoY = logoInitialY; // below screen
let logoX = width/2 - 248;
let letterHoverStartTime = 0;
let prevHoverState = null;
let hoveredLetter = null;
let logoColor = '#00FFFF';

let particles = [];
const particlesBaseY = logoFinalY;
const particlesLength = 50;
const particlesFadeOutDelay = 5;
const particlesSpinSpeed = 0.05;

const ufoFrequency = 120000; // 2 minutes

// Cube logo
const cubeSpeed = sunSpeed / 1500;
let cubeLettersGlueAnimationState = 'INCREASING';

// Scene -------------------------------

// Test tube

function boil() {
    const container = document.querySelector('.liquid');

    function bubblePos() {
        return {
            left: Math.floor(Math.random() * -26) + 55,
            // bottom: Math.floor(Math.random() * 71.01) + 70.006
            bottom: 130
        };
    }

    function bubbleSize() {
        return Math.floor(Math.random() * 10 + 15);
    }

    function bubbles() {
        let size = bubbleSize();
        let animDuration = 2; // Between 3s and 5s

        const bubble = document.createElement('div');
        bubble.classList.add('boil-bubble');
        bubble.style.left = `${bubblePos().left}px`;
        bubble.style.bottom = `${bubblePos().bottom}px`;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.animationDuration = `${animDuration}s`;

        container.appendChild(bubble);

        // Remove the bubble after its animation ends
        setTimeout(() => {
            bubble.remove();
        }, animDuration * 1000);
    }

    for (let i = 0; i < 6; i++) {
        bubbles();
    }
}

// boil();
// setInterval(boil, 200);

function shootBubbles() {
    const container = document.querySelector('.liquid');

    function hslColors() {
        let hue = Math.floor(Math.random() * (320 - 153) + 153);
        let saturation = Math.floor(Math.random() * (100 - 90) + 90);
        let lightness = Math.floor(Math.random() * (80 - 70) + 70);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    function bubblePos() {
        return {
            left: Math.floor(Math.random() * -31) + 37,
            bottom: Math.floor(Math.random() * -12) + 40
        };
    }

    function bubbleSize() {
        return Math.floor(Math.random() * (30 - 10) + 10);
    }

    function bubbles() {
        let size = bubbleSize();
        let animDuration = Math.random() * 2 + 3; // Between 3s and 5s

        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.style.background = hslColors();
        bubble.style.left = `${bubblePos().left}px`;
        bubble.style.bottom = `${bubblePos().bottom}px`;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.animationDuration = `${animDuration}s`;

        container.appendChild(bubble);

        // Remove the bubble after its animation ends
        setTimeout(() => {
            bubble.remove();
        }, animDuration * 1000);
    }

    for (let i = 0; i < 6; i++) {
        bubbles();
    }
}

class UFO {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.size = { width: 28, height: 20 };
        this.reset(); // Start inactive
        this.dotPhase = 0;
        this.ufoFrequency = ufoFrequency; // Spawn every 5 seconds
        this.lastSpawnTime = performance.now();
    }

    reset() {
        this.active = false; // UFO starts inactive
        this.position = { x: -50, y: Math.random() * (this.canvasHeight / 2) };
        this.baseSpeed = Math.random() * (6 - 3) + 1.1;
        this.speed = this.baseSpeed;
        this.state = "normal";
        this.trail = [];
        this.fillcolor = electricColors[Math.floor(Math.random() * electricColors.length)];
    }

    update(mouseX, mouseY) {
        const now = performance.now();

        // Check if it's time to spawn
        if (!this.active && now - this.lastSpawnTime > this.ufoFrequency) {
            this.active = true;
            this.lastSpawnTime = now;
        }

        if (!this.active) return; // Skip update if inactive

        this.dotPhase = (this.dotPhase + 0.2) % 4;

        // Mouse detection
        const ufoBounds = {
            left: this.position.x - 10,
            right: this.position.x + this.size.width + 10,
            top: this.position.y - 10,
            bottom: this.position.y + this.size.height + 10
        };

        this.mouseOver = mouseX > ufoBounds.left &&
            mouseX < ufoBounds.right &&
            mouseY > ufoBounds.top &&
            mouseY < ufoBounds.bottom;

        // State machine logic
        switch (this.state) {
            case "normal":
                if (this.mouseOver) {
                    this.state = "evading";
                    this.targetY = this.position.y + (Math.random() > 0.5 ? -15 : 15);
                }
                this.position.x += this.speed;
                break;

            case "evading":
                const dy = this.targetY - this.position.y;
                this.position.y += dy * 0.5;
                if (Math.abs(dy) < 1) {
                    this.state = "exiting";
                    this.speed = this.baseSpeed * 2;
                }
                break;

            case "exiting":
                this.position.x += this.speed;
                break;
        }

        // Update trail
        this.trail.push({ x: this.position.x, y: this.position.y });
        if (this.trail.length > 18) this.trail.shift();

        // Deactivate when offscreen
        if (this.position.x > this.canvasWidth + 100) {
            this.reset();
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();

        // Draw trail
        if (this.trail.length > 1) {
            const startPos = this.trail[0];
            const endPos = this.trail[this.trail.length - 1];

            const gradient = ctx.createLinearGradient(
                startPos.x + 8, startPos.y,
                endPos.x + 8, endPos.y
            );
            gradient.addColorStop(0, "#000000");
            gradient.addColorStop(1, "#FF0000");

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(startPos.x + 8, startPos.y);
            this.trail.forEach(pos => ctx.lineTo(pos.x + 8, pos.y));
            ctx.stroke();
        }

        // Draw UFO
        ctx.fillStyle = this.fillcolor;
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.position.x + 8, this.position.y - 4);
        ctx.lineTo(this.position.x + 16, this.position.y);
        ctx.lineTo(this.position.x + 8, this.position.y + 4);
        ctx.closePath();
        ctx.fill();

        // Draw dots
        [4, 8, 12, 16].forEach((x, index) => {
            ctx.fillStyle = Math.floor(this.dotPhase) === index ? 'red' : '#000000';
            ctx.fillRect(this.position.x + x - 2, this.position.y - 1, 2, 2);
        });

        ctx.restore();
    }
}

let ufo = new UFO(canvas.width, canvas.height);

// Birds
class Goose {
    constructor(xOffset, yOffset, isLeader = false) {
        this.x = xOffset;
        this.y = yOffset;
        this.speed = 0.0002 + Math.random() * 0.2;
        this.flapPhase = Math.random() * Math.PI * 2;
        this.flapSpeed = 6 + Math.random() * 2;
        this.scale = 0.2 + Math.random() * 0.1;
        this.hasPassed = false;
        this.isLeader = isLeader;
    }

    update() {

        if (!this.isLeader) {
            // Followers naturally stay behind due to slower speed
            this.x -= this.speed;
        } else {
            // Leader moves at fixed speed
            this.x -= this.speed;
        }

        this.x -= this.speed;
        this.flapPhase += this.flapSpeed * 0.04; // Now using flapSpeed
        if (this.x < -50 && !this.hasPassed) {
            this.hasPassed = true;
        }
    }

    draw(ctx) {
        if (this.hasPassed) return;

        const flapAngle = Math.sin(this.flapPhase);
        ctx.save();

        // Vertical wobble + rotation
        ctx.translate(this.x, this.y + flapAngle * 0.5); // More pronounced wobble
        ctx.scale(this.scale, this.scale);
        ctx.scale(-1, 1); // Face left

        // Subtle body rotation (around center point)
        ctx.translate(-20, 0); // Move to body center
        ctx.rotate(flapAngle * 0.03); // Tiny rotation
        ctx.translate(20, 0); // Move back

        // Slim body (preserved from before)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-30, -3);
        ctx.lineTo(-40, 0);
        ctx.lineTo(-30, 3);
        ctx.lineTo(0, 0);
        ctx.fillStyle = 'white';
        ctx.fill();

        // Improved wing with wider base
        const wingBaseX = -20;
        const wingLength = 25;
        const wingTipX = wingBaseX - wingLength * Math.cos(flapAngle);
        const wingTipY = wingLength * Math.sin(flapAngle);

        ctx.beginPath();
        ctx.moveTo(wingBaseX, 0);
        ctx.lineTo(wingTipX, wingTipY);
        ctx.lineTo(wingBaseX - 15, 0); // Wider base
        ctx.closePath();
        ctx.fill();

        // Tail (unchanged)
        ctx.beginPath();
        ctx.moveTo(-40, 0);
        ctx.lineTo(-45, -2);
        ctx.lineTo(-45, 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

let flock;

function initFlock(canvasWidth, canvasHeight) {
    const flock = [];
    const baseY = canvasHeight / 4 + 300;
    const leaderSpacing = 20; // How far followers stay behind leader

    // Create leader (fixed speed, bigger scale)
    const leader = new Goose(canvasWidth, baseY, true);
    leader.speed = 0.09; // Fixed faster speed
    leader.scale = 0.3; // Slightly larger
    flock.push(leader);

    // Create followers in V shape
    const angle = 30; // Degrees for V shape
    for (let i = 1; i <= 5; i++) {
        const xOffset = i * leaderSpacing;
        const yOffset = i * 15 * Math.tan(angle * Math.PI / 180);

        // Left side
        const left = new Goose(canvasWidth + xOffset, baseY + yOffset);
        left.speed = leader.speed - (Math.random() * 0.05); // Slightly slower than leader
        flock.push(left);

        // Right side
        const right = new Goose(canvasWidth + xOffset, baseY - yOffset);
        right.speed = leader.speed - (Math.random() * 0.05);
        flock.push(right);
    }

    return flock;
}

function updateFlock(flock) {
    flock.forEach(seagull => seagull.update());

    if (flock.every(seagull => seagull.hasPassed)) {
        return false; // The flock is done
    }
    return true; // The flock is still active
}

function drawFlock(flock, ctx) {
    flock.forEach(seagull => seagull.draw(ctx));
}

function resetParticleDirections() {
    particles.forEach(particle => {
        // Generate new random direction with varied force
        const forceMultiplier = 0.8 + Math.random() * 0.4; // 80-120% force variation
        particle.dx = (Math.random() - 0.5) * 525 * forceMultiplier;
        particle.dy = (Math.random() - 0.5) * 525 * forceMultiplier;

        // Also reset spin parameters for variety
        particle.spinSpeed = (Math.random() - 0.5) * 0.15;
        particle.currentAngle = Math.random() * Math.PI * 2;
    });
}

function initParticles(particlesPerLetter = 4) { // Add parameter to control count
    const baseX = width/2 - 148;
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
            const origY = particlesBaseY + point.y;

            bounds.minX = Math.min(bounds.minX, origX);
            bounds.maxX = Math.max(bounds.maxX, origX);
            bounds.minY = Math.min(bounds.minY, origY);
            bounds.maxY = Math.max(bounds.maxY, origY);

            letter.particles.push({
                currentAngle: Math.random() * Math.PI * 2, // Start at a random angle
                spinSpeed: (Math.random() - 0.5) * 0.1, // Random spin direction
                // spinSpeed: (Math.random() * 2 - 1) * PARTICLES_SPIN_SPEED,
                // currentAngle: angle,
                color: letter.color,
                rgbValues: letter.rgbValues,
                origX, origY,
                x: origX,
                y: origY,
                dx: (Math.random() - 0.5) * 525 * Math.random(), // Add extra randomization
                dy: (Math.random() - 0.5) * 525 * Math.random(),
                letterId: id,
                alpha: 0,
                angle: angle,
                lineLength: particlesLength
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
const starCount = 50;
let stars = [];
let shootingStars = [];
for (let i = 0; i < starCount; i++) {
    stars.push({
        x: Math.random() * width,
        y: Math.random() * horizon,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.0002 + 0.02,
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

function updateShootingStars() {
    if (!sunStarted) return;
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

function updateStars() {
    for (let star of stars) {
        if (starsMoveLeft) {
            // Original left movement
            star.x -= star.speed;
            if (star.x < 0) star.x = width;
        } else {
            // Inverted right movement
            star.x += star.speed;
            if (star.x > width) star.x = 0;
        }
    }
}

function toggleStarDirection() {
    starsMoveLeft = !starsMoveLeft;

    stars.forEach(star => {
        star.speed *= -1;
    });
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



document.addEventListener('click', () => {
    sunStarted = true;
});

function updateSunPosition() {
    if (!sunStarted) return;

    if (sunYOffset > maxSunTravel - nightOffset) {
        isNight = true;
    }

    if (sunYOffset < maxSunTravel) {
        sunYOffset += sunSpeed;
    }
}


function drawSun() {
    const sunX = width / 2;
    const sunY = horizon + sunYOffset;

    // Glow control variables
    const sunGlowOpacity = 0.5; // Adjust for stronger or weaker glow
    const sunGlowSize = sunBaseRadius * 2; // Controls the glow spread
    const showSunsetLines = true; // Toggle sunset lines on/off

    // Sun glow gradient
    const gradient = ctx.createRadialGradient(
        sunX, sunY, sunBaseRadius * 0.3,
        sunX, sunY, sunGlowSize
    );
    gradient.addColorStop(0, `rgba(255, 69, 0, ${sunGlowOpacity})`);
    gradient.addColorStop(0.5, `rgba(255, 215, 0, ${sunGlowOpacity * 0.5})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    // Draw glow first
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // Sun body
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunBaseRadius, 0, Math.PI * 2);
    let sunGradient = ctx.createLinearGradient(0, sunY - sunBaseRadius, 0, sunY + sunBaseRadius);
    sunGradient.addColorStop(0, "#FF4500");
    sunGradient.addColorStop(1, "#FFD700");
    ctx.fillStyle = sunGradient;
    ctx.fill();

    // Optional sunset lines
    if (showSunsetLines) {
        const numLines = 8;
        for (let i = 0; i < numLines; i++) {
            let lineY = sunY - sunBaseRadius + (i + 1) * (sunBaseRadius / (numLines + 1));
            ctx.beginPath();
            let dx = Math.sqrt(sunBaseRadius ** 2 - (sunY - lineY) ** 2);
            ctx.moveTo(sunX - dx, lineY);
            ctx.lineTo(sunX + dx, lineY);
            ctx.lineWidth = 1 + (i / numLines) * 5;
            ctx.strokeStyle = "rgba(0,0,0,0.3)";
            ctx.stroke();
        }
    }
}



// GRID
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
    // Define the color for special horizontal lines
    const specialLineColor = "#FF0000"; // Red color
    const specialLineFrequency = 5; // Every 5th line will be special

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
        const vanishX = width / 2 - roadHalfWidth + xNorm * 2 * roadHalfWidth;

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
                    // ctx.strokeStyle = randomColor;
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

    // Draw horizontal lines with potential special coloring
    horizontalPositions.forEach((pos, row) => {
        // Determine the color for this horizontal line
        if (row % specialLineFrequency === 0) {
            ctx.strokeStyle = randomColor; // Special color for specific lines
        } else {
            ctx.strokeStyle = "#00FFFF"; // Default cyan color
        }

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
            const vanishX = width / 2 - roadHalfWidth + xNorm * 2 * roadHalfWidth;
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
        { type: 'e', x: 200, flip: false },
        { type: 'm', x: 290, flip: false },
        { type: 'u', x: 300, flip: false },
        { type: 's', x: 280, flip: false },
        { type: 'i', x: 280, flip: false },
        { type: 'o', x: 280, flip: false },
        { type: 'n', x: 360, flip: false }
    ];
}

function drawParticles() {
    particles.forEach(particle => {
        ctx.beginPath();

        // Calculate line endpoints with rotation
        const halfLen = particle.lineLength / 2;
        const dx = Math.cos(particle.currentAngle) * halfLen;
        const dy = Math.sin(particle.currentAngle) * halfLen;

        ctx.moveTo(particle.x - dx, particle.y - dy);
        ctx.lineTo(particle.x + dx, particle.y + dy);

        // Randomize direction by making the spinSpeed vary per frame slightly
        particle.currentAngle += particle.spinSpeed * (Math.random() * 0.4 + 0.8);

        ctx.strokeStyle = logoColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = particle.alpha;
        ctx.stroke();
    });
    ctx.globalAlpha = 1;
}

const cubeAnimation = {
    progress: 0,    // 0-1 (0 = left, 1 = final position)
    speed: cubeSpeed,     // Animation speed (adjust as needed)
    isAnimating: true
};

function startCubeAnimation() {
    cubeAnimation.progress = 0;
    cubeAnimation.isAnimating = true;
}

let cubeLettersGlueAlpha = 0.0;
let isCubeAnimEnded = false;

function drawCube() {
    const scale = 1.0;
    ctx.globalAlpha = moonAlpha;

    // Define animation progress thresholds
    const startAnimation = 0.0;
    const endAnimation = 1.0;

    // Check animation progress to trigger actions
    if (cubeAnimation.progress <= startAnimation) {
        // Actions before animation starts
        console.log("Animation is about to start.");
    } else if (cubeAnimation.progress > startAnimation && cubeAnimation.progress < endAnimation) {
        // Actions during animation
    } else if (cubeAnimation.progress >= endAnimation) {
        // Actions after animation ends
        isCubeAnimEnded = true;
    }

    // E element animation (left to right)
    const startXE = -150;
    const finalXE = width / 2 - 101;
    const currentXE = lerp(startXE, finalXE, easeOutQuad(cubeAnimation.progress));
    const yE = 16;

    // M element animation (top to bottom)
    const startYM = -350;
    const finalYM = -32;
    const currentYM = lerp(startYM, finalYM, easeOutQuad(cubeAnimation.progress));
    const xM = width / 2 - 109;

    // U element animation (left to right)
    const startXU = width;
    const finalXU = width / 2 - 109;
    const currentXU = lerp(startXU, finalXU, easeOutQuad(cubeAnimation.progress));
    const yU = -32;

    let glueColor = 'rgba('+ liquidColorRgb + ',' + cubeLettersGlueAlpha + ')';

    // Draw 'E'
    ctx.save();
    ctx.translate(currentXE, yE);
    ctx.scale(scale, scale);
    ['E1', 'E2', 'E3', 'E4', 'E5', 'E6'].forEach(id => {
        const pathElement = document.getElementById(id);
        const path = new Path2D(pathElement.getAttribute('d'));

        // Get original fill color from SVG element
        const style = pathElement.getAttribute('style');
        const fillColor = style.match(/fill:#([a-f0-9]{6}|[a-f0-9]{3})/i)[0];

        ctx.fillStyle = fillColor.split(':')[1];
        ctx.fill(path);
        if (isCubeAnimEnded) {
            ctx.strokeStyle = glueColor;
            ctx.stroke(path);
        }
    });
    ctx.restore();

    // Draw 'M'
    ctx.save();
    ctx.translate(xM, currentYM);
    ctx.scale(scale, scale);
    ['M1', 'M2', 'M3'].forEach(id => { // Add M4, M5, M6 if needed
        const pathElement = document.getElementById(id);
        const path = new Path2D(pathElement.getAttribute('d'));

        // Get original fill color from SVG element
        const style = pathElement.getAttribute('style');
        const fillColor = style.match(/fill:#([a-f0-9]{6}|[a-f0-9]{3})/i)[0];

        ctx.fillStyle = fillColor.split(':')[1];
        if (isCubeAnimEnded) {
            ctx.strokeStyle = glueColor;
            ctx.stroke(path);
        }

        ctx.fill(path);
    });
    ctx.restore();

    // Draw 'U'
    ctx.save();
    ctx.translate(currentXU, yU);
    ctx.scale(scale, scale);
    ['U1', 'U2', 'U3', 'U4', 'U5'].forEach(id => {
        const pathElement = document.getElementById(id);
        const path = new Path2D(pathElement.getAttribute('d'));

        // Get original fill color from SVG element
        const style = pathElement.getAttribute('style');
        const fillColor = style.match(/fill:#([a-f0-9]{6}|[a-f0-9]{3})/i)[0];

        ctx.fillStyle = fillColor.split(':')[1];
        if (isCubeAnimEnded) {
            ctx.strokeStyle = glueColor;
            ctx.stroke(path);
        }
        ctx.fill(path);
        ctx.fill(path);
    });
    ctx.restore();

    ctx.globalAlpha = 1;
}


function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

function easeOutQuad(t) {
    return t * (2 - t);
}


function drawLogo() {

    const scale = 1.0;
    const baseX = width/2 - 135; // Center 500px wide logo

    ctx.save();
    ctx.translate(baseX, logoY);
    ctx.scale(scale, scale);

    // Draw cyan elements
    ctx.lineWidth = 1;

    ['e', 'm', 'u', 'l', 's', 'i', 'o', 'n'].forEach(id => {
        if (letters[id].visible !== false) { // Only draw if visible
            ctx.strokeStyle = logoColor;
            const path = new Path2D(document.getElementById(id).getAttribute('d'));
            ctx.stroke(path);
        }
    });

    // if (letters['u'].visible !== false) { // Only draw if visible
    //     ctx.strokeStyle = '#FFA500';
    //     const uPath = new Path2D(document.getElementById('u').getAttribute('d'));
    //     ctx.stroke(uPath);
    // }

    ctx.restore();

}

function updateMoon() {

    if (!sunStarted) return;

    // Horizontal movement
    moonX -= moonSpeed;
    moonFloatPhase += 0.02;

    // Reset position when fully offscreen left
    if (moonX < - 120) {
        moonX = width + 60;
    }

    // Update alpha based on position (fade at edges)
    // const screenRatio = moonX / width;
    // moonAlpha = Math.sin(Math.PI * screenRatio);
}

function drawMoon() {
    ctx.save();
    const moonSize = 60;

    // Calculate vertical position with floating effect
    const floatY = 120 + Math.sin(moonFloatPhase) * moonAmplitude;

    ctx.translate(moonX, floatY);

    // // Fade when near edges
    // ctx.globalAlpha = Math.max(0, Math.min(1, moonAlpha));
    ctx.globalAlpha = moonAlpha;

    ctx.lineWidth = 2;

    const circus = new Path2D(document.getElementById('circus').getAttribute('d'));
    ctx.fillStyle = '#FFEEEE';
    ctx.fill(circus);
    ctx.stroke(circus);

    const crescent = new Path2D(document.getElementById('crescent').getAttribute('d'));
    ctx.fillStyle = '#111122';
    ctx.fill(crescent);
    ctx.stroke(crescent);

    ctx.restore();
}


// Initialize line positions
let dropStartY = height - 10; // Initial top position
let dropEndY = horizon - 250; // Initial bottom position

// Function to draw the vertical line
function drawVerticalLine() {
  // Clear the canvas
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set line properties
  ctx.strokeStyle = 'white'; // Line color
  ctx.lineWidth = 2; // Line width

  // Calculate the x-coordinate for the center of the canvas
  const centerX = canvas.width / 2;

  // Draw the line
  ctx.beginPath();
  ctx.moveTo(centerX, dropStartY); // Start point (top of the line)
  ctx.lineTo(centerX, dropEndY); // End point (bottom of the line)
  ctx.stroke();
}

const testTube = document.querySelector('.test-tube-container');
const drop = document.querySelector('.test-tube-drop');
drop.style.backgroundColor = 'rgba('+ liquidColorRgb + ')';

function updateTestTube() {
    if (!sunStarted) return;
    // Update opacity of the test tube
    testTube.style.opacity = moonAlpha;

}

let dropHeight = 300;
let dropY = 210;
let isDropped = false;

function updateDrop() {
    if (!sunStarted) return;

    if (dropHeight > 0) {
        dropHeight -= 7.0;
        dropY += 7.0;
    }

    drop.style.height = `${dropHeight}px`;
    drop.style.top = `${dropY}px`;

    if (dropHeight <= 0) {
        drop.style.display = "none";
    }

    if (dropHeight <= 0) {
        isDropped = true;
        drop.style.display = "none";
    }

    if (drop.style.display === "none") {
        wave.style.setProperty('--wave-animation-name', 'animate');
    }

}

const bubbles = document.querySelector('.bubble');
const tube = document.querySelector('.tube');

function updateBoil() {

    if (!sunStarted) return;

    wave.style.setProperty('--wave-after-radius', '56%');
    wave.style.setProperty('--wave-before-radius', '200%');
    tube.style.setProperty('--glow', 'drop-shadow(0 0 0.75rem #00CC66)');

    shootBubbles();

}

function updateLogoPosition() {
    if (isNight && logoY > logoFinalY) {
        // Ease-out animation
        const remaining = logoY - logoFinalY;
        logoSpeed = Math.max(0.5, remaining * 0.001);
        logoY -= logoSpeed;

        // Snap to final position when close
        if (remaining < 2) {
            logoY = logoFinalY;
            logoSpeed = 0;
        }
    }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function playRandomPop() {
    const randomIndex = getRandomInt(popSounds.length);
    const audio = popSounds[randomIndex].cloneNode(true); // Clone the audio element

    // Remove the element after playback ends
    audio.addEventListener('ended', () => {
        audio.remove();
    });

    audio.play(); // Play the clone
}

// function playCubeImpact() {
//     const audio = document.getElementById('bass-drop');

//     // Remove the element after playback ends
//     audio.addEventListener('ended', () => {
//         audio.remove();
//     });
// }

function updateLogo() {

    if (!sunStarted) return;

    const now = Date.now();

    Object.keys(letters).forEach(id => {
        letters[id].visible = hoveredLetter !== id;
    });

    // Sound triggers
    if (cubeLettersGlueAnimationState === 'COMPLETED' && hoveredLetter !== prevHoverState) {
        if (hoveredLetter) {
            playRandomPop();
            letterHoverStartTime = now;
        }
        prevHoverState = hoveredLetter;
    }

    particles.forEach(p => {
        const isActive = p.letterId === hoveredLetter;

        // Fade logic
        if (isActive) {
            // Start fading after delay
            const timeActive = now - letterHoverStartTime;
            p.alpha = timeActive > particlesFadeOutDelay ? Math.max(0, 1 - (timeActive - particlesFadeOutDelay)/1000) : 1;
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

function drawUrl() {
    ctx.globalAlpha = moonAlpha;
    ctx.font = "9pt Monospace";
    ctx.fillStyle = '#FFEEEE';
    ctx.fillText("Version " + window.versionNumber + " - yphil.gitlab.io",width / 2 - 120 , height / 2 - 100);
    ctx.globalAlpha = 1.0; // Reset opacity for other elements
}

let cubeLogoImage = null;

function preloadCubeLogo() {
    cubeLogoImage = new Image();
    cubeLogoImage.src = '../../img/emume.png';
    cubeLogoImage.onerror = () => console.error('Failed to load cube logo');
}

function drawCubeLogo() {
    if (!cubeLogoImage || !cubeLogoImage.complete) return;

    ctx.globalAlpha = moonAlpha;

    // New dimensions
    const targetWidth = 200; // px
    const targetHeight = 200; // px

    // Centered with new size
    const x = (ctx.canvas.width - targetWidth) / 2 - 10;
    const y = 16;

    ctx.drawImage(
        cubeLogoImage,
        x, y,
        targetWidth,
        targetHeight
    );
    ctx.globalAlpha = 1.0; // Reset opacity for other elements
}


function drawCredits() {
    ctx.globalAlpha = 1; // Fades in with moon/night mode
    ctx.font = "9pt Monospace";
    ctx.fillStyle = '#FFEEEE';
    ctx.textAlign = 'center';

    // Main text
    ctx.fillText("HTML5 Canvas / Web audio API interactive trackmo by yPhil 2025", width / 2, height - 30);

    // Secondary text (smaller/lighter)
    ctx.font = "8pt Monospace";
    ctx.fillStyle = 'rgba(255, 238, 238, 0.7)';
    ctx.fillText("You really should be watching this fullscreen ; Press M to toggle audio", width / 2, height - 15);

    // Reset context
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1.0;
}

function drawMutedIcon(ctx, x, y, size) {
    // Draw speaker (triangle)
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size);
    ctx.closePath();
    ctx.stroke();

    // Parameters for arcs
    const arcRadii = [size / 2.5, size / 2, size / 1.5]; // Increased radii for larger arcs
    const arcOffsets = [-16, -14, -12]; // Offsets to position arcs closer to the triangle

    // Draw sound waves (arcs)
    arcRadii.forEach((radius, index) => {
        ctx.beginPath();
        ctx.arc(
            x + size + arcOffsets[index], // X position adjusted by offset
            y + size / 2,                 // Y position
            radius,                       // Radius
            -Math.PI / 4,                 // Start angle
            Math.PI / 4                   // End angle
        );
        ctx.stroke();
    });

    // Cross
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.stroke();
}

function drawUnmutedIcon(ctx, x, y, size) {
    // Draw speaker (triangle)
    ctx.beginPath();
    ctx.moveTo(x, y + size / 2);
    ctx.lineTo(x + size / 2, y);
    ctx.lineTo(x + size / 2, y + size);
    ctx.closePath();
    ctx.stroke();

    // Parameters for arcs
    const arcRadii = [size / 2.5, size / 2, size / 1.5]; // Increased radii for larger arcs
    const arcOffsets = [-16, -14, -12]; // Offsets to position arcs closer to the triangle

    // Draw sound waves (arcs)
    arcRadii.forEach((radius, index) => {
        ctx.beginPath();
        ctx.arc(
            x + size + arcOffsets[index], // X position adjusted by offset
            y + size / 2,                 // Y position
            radius,                       // Radius
            -Math.PI / 4,                 // Start angle
            Math.PI / 4                   // End angle
        );
        ctx.stroke();
    });
}

let isMuted = true;

// startGroove();

function toggleMute() {
    const audioControlIcon = document.getElementById('audio-control-icon');

    if (!isPlaying) {
        audioContext.resume().then(() => {
            // startGroove();
            isPlaying = true;
            audioControlIcon.classList.remove('fa-volume-mute');
            audioControlIcon.classList.add('fa-volume-up');
        });
    } else {
        audioContext.suspend();
        isPlaying = false;
        audioControlIcon.classList.add('fa-volume-mute');
        audioControlIcon.classList.remove('fa-volume-up');
    }

    isMuted = !isMuted;
    // drawVolumeControl();
}

// function drawVolumeControl() {
//     const iconX = width - 50;
//     const iconY = height - 50;
//     const iconSize = 30;

//     // Clear the area where the icon will be drawn
//     // ctx.clearRect(iconX - 10, iconY - 10, iconSize + 20, iconSize + 20);

//     // Set the stroke style for the icon
//     ctx.strokeStyle = '#FFEEEE';
//     ctx.lineWidth = 2;

//     if (isMuted) {
//         drawMutedIcon(ctx, iconX, iconY, iconSize);
//     } else {
//         drawUnmutedIcon(ctx, iconX, iconY, iconSize);
//     }
// }

function init() {
    // Initialize the flock once
    flock = initFlock(width, height);
    preloadCubeLogo();
}

let isGlued = false;

function updateCubeLettersGlueAlpha() {
    if (isCubeAnimEnded) {
        if (cubeLettersGlueAnimationState === 'INCREASING') {
            document.getElementById('bass-drop').play();
            cubeLettersGlueAlpha += 0.005;
            if (cubeLettersGlueAlpha >= 1) {
                cubeLettersGlueAlpha = 1; // Ensure it doesn't exceed 1
                cubeLettersGlueAnimationState = 'DECREASING'; // Switch to decreasing
            }
        } else if (cubeLettersGlueAnimationState === 'DECREASING') {
            cubeLettersGlueAlpha -= 0.03;
            if (cubeLettersGlueAlpha <= 0) {
                cubeLettersGlueAlpha = 0; // Ensure it doesn't go below 0
                cubeLettersGlueAnimationState = 'COMPLETED'; // Mark the animation as completed
                isGlued = true;
            }
        }
    }
    // Ensure cubeLettersGlueAlpha remains within [0, 1]
    cubeLettersGlueAlpha = Math.max(0, Math.min(cubeLettersGlueAlpha, 1));
}

let lastBoilTime = 0;
const boilInterval = 1000; // 1 second

let skyTopStart = [180, 205, 255];
let skyTopEnd = [0, 0, 0];

let skyMidStart = [255, 170, 110];
let skyMidEnd = [17, 17, 51];

let skyHorizonStart = [255, 180, 120];
let skyHorizonEnd = [34, 0, 34];

function getRGBString(colorArray) {
    return `rgb(${colorArray[0]}, ${colorArray[1]}, ${colorArray[2]})`;
}

let skyTopColor = getRGBString(skyTopStart);
let skyMidColor = getRGBString(skyMidStart);
let skyHorizonColor = getRGBString(skyHorizonStart);

let transitionProgress = 0; // 0 (start) → 1 (fully dark)

function updateSky() {

    if (!sunStarted) return;

    transitionProgress = Math.min(1, transitionProgress + sunSpeed * 0.001);

    // Function to interpolate between start and end colors
    function interpolate(start, end) {
        return Math.round(start * (1 - transitionProgress) + end * transitionProgress);
    }

    // Update skyTopColor
    skyTopColor = `rgb(${interpolate(skyTopStart[0], skyTopEnd[0])},
                        ${interpolate(skyTopStart[1], skyTopEnd[1])},
                        ${interpolate(skyTopStart[2], skyTopEnd[2])})`;

    // Update skyMidColor
    skyMidColor = `rgb(${interpolate(skyMidStart[0], skyMidEnd[0])},
                        ${interpolate(skyMidStart[1], skyMidEnd[1])},
                        ${interpolate(skyMidStart[2], skyMidEnd[2])})`;

    // Update skyHorizonColor
    skyHorizonColor = `rgb(${interpolate(skyHorizonStart[0], skyHorizonEnd[0])},
                            ${interpolate(skyHorizonStart[1], skyHorizonEnd[1])},
                            ${interpolate(skyHorizonStart[2], skyHorizonEnd[2])})`;
}


function update() {

    const now = performance.now();

    updateSky();

    gridOffset += gridSpeed;
    if(gridOffset > numGridLines) gridOffset = 0;
    updateStars();
    updateShootingStars();
    spawnShootingStar();
    updateLogo();
    updateMoon();
    updateSunPosition();
    updateLogoPosition();
    updateTestTube();
    // ufo.update(width, height, isNight);
    ufo.update(mouseX, mouseY);

    if (cubeAnimation.isAnimating && cubeAnimation.progress < 1) {
        cubeAnimation.progress = Math.min(cubeAnimation.progress + cubeAnimation.speed, 1);
    }

    if (isGlued) {
        drop.style.display = 'block';
        updateDrop();

        if (now - lastBoilTime >= boilInterval) {
            updateBoil();
            lastBoilTime = now;
        }

    }

    if (isNight && moonAlpha < 1) {
        moonAlpha += 0.001; // Increase opacity gradually
    }

    updateCubeLettersGlueAlpha();
}

function drawSky() {

    // Background elements
    const skyGradient = ctx.createLinearGradient(0, width, 0, 0);

    // Day
    // skyGradient.addColorStop(0, "#007ced"); // Light blue at the top (sky)
    // skyGradient.addColorStop(1, "#cce7ff"); // Warm orange at the horizon

    // Night
    skyGradient.addColorStop(1, skyTopColor); // top
    skyGradient.addColorStop(0.5, skyMidColor); // Dark blue midway
    skyGradient.addColorStop(0, skyHorizonColor); // horizon

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizon);

}

function draw() {
    ctx.clearRect(0, 0, width, height);

    drawSky();

    drawStars();
    drawShootingStars();

    ufo.draw(ctx);

    if (flock) {
        const isFlockActive = updateFlock(flock);
        drawFlock(flock, ctx);

        // Reinitialize the flock if it has passed
        // if (!isFlockActive) {
        //     console.log("Reinitializing flock...");
        //     flock = initFlock(width, height);
        // }
    }

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
    drawCredits();
    // drawVolumeControl();
    drawCube();
}

init();

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
        resetParticleDirections();
    }

});

canvas.addEventListener('click', function(event) {
    const iconX = width - 50;
    const iconY = height - 50;
    const iconSize = 10;

    // Get the bounding rectangle of the canvas
    const rect = canvas.getBoundingClientRect();

    // Calculate mouse position within the canvas
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Check if the click is within the volume icon area
    if (mouseX >= iconX && mouseX <= iconX + iconSize &&
        mouseY >= iconY && mouseY <= iconY + iconSize) {
        toggleMute();
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


// Music -----------------------------

const playButton = document.getElementById('audio-control');

let isPlaying = false;

const sound = new Howl({
  src: ['../../tmp/loop.ogg'],
  html5: true,
  loop: true // Add this if you want the sound to loop
});

playButton.addEventListener('click', function(event) {
  if (isPlaying) {
    sound.pause();
    isPlaying = false;
      playButton.textContent = 'Play'; // Optional: Update button text
  } else {
    sound.play();
    isPlaying = true;
    playButton.textContent = 'Pause'; // Optional: Update button text
  }
});

// Optional: Update button state when sound ends naturally
sound.on('end', function() {
  isPlaying = false;
  playButton.textContent = 'Play';
});
