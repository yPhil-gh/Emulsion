import HID from 'node-hid';

// 🔹 1️⃣ List Available Gamepads
const gamepads = HID.devices().filter(d => d.usagePage === 1 && d.usage === 5);

if (gamepads.length === 0) {
    console.log("No gamepads found!");
    process.exit(1);
}

// Pick the first gamepad found
const { vendorId, productId } = gamepads[0];
console.log(`Found gamepad: VID=${vendorId}, PID=${productId}`);

// 🔹 2️⃣ Create Gamepad Class
class Gamepad {
    constructor(vid, pid) {
        this.device = new HID.HID(vid, pid);
        this.prevState = new Array(16).fill(0); // Store previous button states
    }

    onInput(callback) {
        this.device.on('data', data => {
            const buttons = Array.from(data.subarray(0, 16)); // First 16 bytes (buttons)
            const axes = new DataView(data.buffer).getFloat32(16, true);

            let buttonEvents = [];

            // 🔹 Detect Press & Release Events
            buttons.forEach((state, i) => {
                if (state === 1 && this.prevState[i] === 0) {
                    buttonEvents.push({ type: "pressed", button: `B${i}` });
                } else if (state === 0 && this.prevState[i] === 1) {
                    buttonEvents.push({ type: "released", button: `B${i}` });
                }
            });

            // 🔹 Update State
            this.prevState = buttons;

            if (buttonEvents.length > 0) {
                callback({ buttonEvents, axes });
            }
        });

        this.device.on('error', err => {
            console.error("Gamepad disconnected:", err);
        });
    }
}

// 🔹 3️⃣ Create Gamepad Instance & Log Button Presses
const gamepad = new Gamepad(vendorId, productId);

gamepad.onInput(({ buttonEvents, axes }) => {
    buttonEvents.forEach(event => {
        console.log(`Button ${event.button} was ${event.type}`);
    });
});
