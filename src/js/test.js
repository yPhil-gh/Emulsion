import gamecontroller from "sdl2-gamecontroller";

gamecontroller.on("error", (data) => console.log("error", data));
gamecontroller.on("warning", (data) => console.log("warning", data));
// // gamecontroller.on("a:down", (data) => console.log("Hello Cross button world"));

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

gamecontroller.on("leftstick:down", (data) => {
  console.log(`player ${data.player} pressed leftstick`);
  switch (count % 3) {
    case 0:
      gamecontroller.setLeds(0x0f, 0x62, 0xfe, data.player);
      break;
    case 1:
      gamecontroller.setLeds(0x19, 0x80, 0x38, data.player);
      break;
    case 2:
      gamecontroller.setLeds(0x8a, 0x3f, 0xfc, data.player);
      break;
  }
  count += 1;
});
