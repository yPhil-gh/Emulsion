const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const TEMPO = 180; // Classic dance tempo
let isPlaying = false;
let currentKey = 0;
const KEYS = [
    [55, 65.41, 73.42], // A minor
    [58.27, 69.30, 77.78] // Bb minor
];

const reverb = audioContext.createConvolver();
const impulse = audioContext.createBuffer(2, audioContext.sampleRate * 2, audioContext.sampleRate);
for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }
}
reverb.buffer = impulse;
reverb.connect(audioContext.destination);

function createKick() {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.frequency.setValueAtTime(150, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.01);

    gain.gain.setValueAtTime(1, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    osc.connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.3);
}

function createHiHat() {
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, 4096, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for(let i = 0; i < 4096; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    const filter = audioContext.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    noise.buffer = buffer;
    noise.connect(filter).connect(gain).connect(audioContext.destination);
    noise.start();
    noise.stop(audioContext.currentTime + 0.1);
}

function createBass(note, filterCutoff, resonance) {
    const osc = audioContext.createOscillator();
    const filter = audioContext.createBiquadFilter();
    const gain = audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(note, audioContext.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff, audioContext.currentTime);
    filter.Q.value = resonance;

    gain.gain.setValueAtTime(0.4, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    osc.connect(filter).connect(gain).connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.2);
}

function startGroove() {
    let barCount = 0;
    let filterCutoff = 200;
    let resonance = 5;
    let filterLFO = audioContext.createOscillator();

    // Initialize filter modulation
    filterLFO.type = 'sine';
    filterLFO.frequency.value = 0.1; // Slow modulation
    filterLFO.start();

    function playBar() {
        const isKeyChangeBar = barCount % 5 === 4; // Change key every 5th bar
        const isCrazyBar = barCount % 12 === 11; // Crazy bar every 12 bars
        const key = isKeyChangeBar ? KEYS[(currentKey + 1) % KEYS.length] : KEYS[currentKey];

        // Evolving filter cutoff
        if (Math.random() > 0.8) {
            // Drastic change
            const targetCutoff = 200 + Math.random() * 1800;
            filterLFO.frequency.setValueAtTime(0.5 + Math.random() * 2, audioContext.currentTime);
            filterCutoff = targetCutoff;
        } else {
            // Subtle change
            filterCutoff += (Math.random() - 0.5) * 50;
            filterCutoff = Math.min(Math.max(filterCutoff, 100), 2000);
        }

        // Modulate resonance
        resonance = 5 + Math.random() * 2;

        // Kick on 1 and 3
        [0, 2].forEach(beat => {
            setTimeout(createKick, (60/TEMPO) * beat * 1000);
        });

        // Hi-hat on every 8th note
        [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].forEach(beat => {
            setTimeout(createHiHat, (60/TEMPO) * beat * 1000);
        });

        // Dynamic bass rhythm
        const bassPattern = isCrazyBar ?
            [0, 1.25, 2.75] : // Crazy pattern
            Math.random() > 0.5 ?
                [0, 2.5] : // tu-tutu
                [0, 1.5, 3]; // tutu-tu

        bassPattern.forEach(beat => {
            setTimeout(() => createBass(key[0], filterCutoff, resonance), (60/TEMPO) * beat * 1000);
        });

        // Crazy bar effects
        if (isCrazyBar) {
            // Wild filter sweep
            const sweep = audioContext.createOscillator();
            sweep.type = 'sawtooth';
            sweep.frequency.setValueAtTime(200, audioContext.currentTime);
            sweep.frequency.exponentialRampToValueAtTime(Math.random() * 2000, audioContext.currentTime + 1);

            const sweepGain = audioContext.createGain();
            sweepGain.gain.setValueAtTime(0.2, audioContext.currentTime);
            sweepGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

            sweep.connect(sweepGain).connect(audioContext.destination);
            sweep.start();
            sweep.stop(audioContext.currentTime + 1.5);
        }

        barCount++;

        // Update key after change bar
        if (isKeyChangeBar) {
            currentKey = (currentKey + 1) % KEYS.length;
        }

        setTimeout(playBar, (60/TEMPO) * 4 * 1000); // 4-bar loop
    }

    playBar();
}

// document.addEventListener('click', () => {
//     if (!isPlaying) {
//         audioContext.resume().then(() => {
//             startGroove();
//             isPlaying = true;
//         });
//     } else {
//         audioContext.suspend();
//         isPlaying = false;
//     }
// });

// Scene
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

const SUN_SPEED = 0.04; // Pixels per frame

const MAX_SUN_TRAVEL = height - horizon + 150;

// Logo configuration
let logoChars = [];

const LOGO_INITIAL_Y = horizon - 18; // Start just below horizon
const LOGO_RISE_SPEED = 0.00000000003; // Base movement speed
let logoSpeed = 0; // Current rise speed

let logoY = LOGO_INITIAL_Y; // Start below screen
// Logo configuration
const LOGO_FINAL_Y = 250;

const PARTICLES_BASE_Y = LOGO_FINAL_Y;
const PARTICLES_LENGTH = 50;

const FADE_OUT_DELAY = 5;
let hoverStartTime = 0;

// Seagull
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

function initFlock(canvasWidth, canvasHeight) {
    const flock = [];
    const baseY = canvasHeight / 4 + 300;
    const leaderSpacing = 40; // How far followers stay behind leader

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


// Update the flock's positions
function updateFlock(flock) {
    flock.forEach(seagull => seagull.update());

    // Check if all seagulls have passed
    if (flock.every(seagull => seagull.hasPassed)) {
        console.log("All seagulls have passed!");
        return false; // Return false if the flock is done
    }
    return true; // Return true if the flock is still active
}

// Draw the flock
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
const starCount = 50;
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
    if (sunYOffset > MAX_SUN_TRAVEL - 340) {
        isNight = true;
    }

    if (sunYOffset < MAX_SUN_TRAVEL) {
        sunYOffset += SUN_SPEED;
    } else {
        // isNight = true;
        // Start logo movement when sun sets
        // if (logoY > LOGO_FINAL_Y) {
        //     logoSpeed = LOGO_RISE_SPEED;
        // }
    }
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
            // let randomColor = electricColors[Math.floor(Math.random() * electricColors.length)];
            ctx.strokeStyle = "#FFFFFF"; // Special color for specific lines
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
    if (isNight && logoY > LOGO_FINAL_Y) {
        // Ease-out animation
        const remaining = logoY - LOGO_FINAL_Y;
        logoSpeed = Math.max(0.5, remaining * 0.001);
        logoY -= logoSpeed;

        // Snap to final position when close
        if (remaining < 2) {
            logoY = LOGO_FINAL_Y;
            logoSpeed = 0;
        }
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

    updateSunPosition();
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

function drawCredits() {
    ctx.globalAlpha = 1; // Fades in with moon/night mode
    ctx.font = "9pt Monospace";
    ctx.fillStyle = '#FFEEEE';
    ctx.textAlign = 'center';

    // Main text
    ctx.fillText("Made with ♥ by yphil", width / 2, height - 30);

    // Secondary text (smaller/lighter)
    ctx.font = "8pt Monospace";
    ctx.fillStyle = 'rgba(255, 238, 238, 0.7)';
    ctx.fillText("Press M to toggle audio", width / 2, height - 15);

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

startGroove();

function toggleMute() {

    if (!isPlaying) {
        audioContext.resume().then(() => {
            // startGroove();
            isPlaying = true;
        });
    } else {
        audioContext.suspend();
        isPlaying = false;
    }

    isMuted = !isMuted;
    drawVolumeControl();
}

function drawVolumeControl() {
    const iconX = width - 50;
    const iconY = height - 50;
    const iconSize = 30;

    // Clear the area where the icon will be drawn
    // ctx.clearRect(iconX - 10, iconY - 10, iconSize + 20, iconSize + 20);

    // Set the stroke style for the icon
    ctx.strokeStyle = '#FFEEEE';
    ctx.lineWidth = 2;

    if (isMuted) {
        drawMutedIcon(ctx, iconX, iconY, iconSize);
    } else {
        drawUnmutedIcon(ctx, iconX, iconY, iconSize);
    }
}

let flock;

function init() {
    // Initialize the flock once
    flock = initFlock(width, height);
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
    drawVolumeControl();
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
    const iconSize = 30;

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

