import gamecontroller from "sdl2-gamecontroller";

gamecontroller.on("error", (data) => console.log("error", data));
gamecontroller.on("warning", (data) => console.log("warning", data));
// gamecontroller.on("a:down", (data) => console.log("Hello Cross button world"));
gamecontroller.on("back:down", (data) => console.log("Hello Back button!"));

gamecontroller.on("sdl-init", (data) => {
    console.log("SDL2 Initialized!");
});

gamecontroller.on("controller-device-added", (data) => {
    console.log("controller connected", data);
    gamecontroller.setLeds(0x0f, 0x62, 0xfe, data.player);
});

gamecontroller.on("controller-button-down", (data) => {
    console.log("button pressed", data);
});
