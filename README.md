![Emulsion](https://gitlab.com/yphil/emulsion/-/raw/master/img/icon.png){: width="72px"}

# Emulsion

A unified, lightweight frontend for game emulators.

## Features
### Full control
- Your games can be anywhere
- Latest versions of the emulators
- Fine-tuning of the emulators

All those settings are saved in a central, standard json file.

### Centralized, standard configuration
- One single config file
- Install a full gaming PC in one command

### Solidity
- One update of an emulator won't break everything
- Emulsion will never forget you game controller config / calibration

### Input Versatility
Fully controllable using **gamepad, keyboard, or mouse**.

### Cover art management
Direct dowloading of the game cover art via several backends:

- [SteamGridDB](https://www.steamgriddb.com/)
- [MobyGames](mobygames.com)
- [Exotica](https://www.exotica.org.uk/)
- [Wikipedia](https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers)
- [GiantBomb](https://www.giantbomb.com/api/)
- [UVList](https://www.uvlist.net/)

![Emulsion](https://yphil.gitlab.io/images/emulsion-screenshot00.png)

## Installation

See [Releases](https://gitlab.com/yphil/emulsion/-/releases)

## Configuration
for each machine, enter

- Games directory
- Emulator
- Optional Emulator arguments


### Supported Machines

Emulsion supports the following platforms:

- Nintendo NES
- Sega Master System
- PCEngine
- Amiga
- Sega MegaDrive
- Nintendo SNES
- Atari Jaguar
- Sega Saturn
- Sony Playstation
- Nintendo 64
- Sega Dreamcast
- Sony Playstation 2
- Nintendo GameCube
- XBox
- Sony Playstation PSP
- Sony Playstation 3

## Usage

### Keyboard Commands
#### Home Screen (Platform Slideshow)
- ← / → Arrow Keys: Navigate between machines
- Enter: Select highlighted platform
- Escape / Ctrl + Q: Exit application

- <kbd>Esc</kbd> / <kbd>Ctrl</kbd>+<kbd>Q</kbd>: Exit Emulsion

- Mouse Wheel: Scroll up/down to navigate machines
- Click: Select platform (click active platform to confirm)

##### Gamepad

- D-Pad Left/Right → Platform navigation
- Cross Button (A/X) → Confirm selection
- Circle Button (B/O) → Exit app

#### Gallery Screen (Games/Machines)
##### Navigation:
- ← / → Arrows: Move between games (hold <kbd>Shift</kbd> to move between platforms)
- ↑ / ↓ Arrows: Move vertically between game rows
- Page Up/Down: Jump 10 rows
- Home/End: Jump to first/last game
- Mouse Wheel: Vertical scroll (hold Shift for platform switching)

##### Actions:
- Enter: Launch selected game
- Escape: Return to home screen
- I Key: Open game/image menu
- Right-Click (Mouse): Open context menu for selected game
- F5: Reload UI

##### Gamepad Equivalent:
- D-Pad → Game navigation
- L1/R1 → Platform switching
- Cross Button → Launch game/open menu
- Circle Button → Return to home
- Square Button → Open game menu

#### Game/Platform Menu
- ← / → Arrows: Navigate image thumbnails
- ↑ / ↓ Arrows: Scroll through image grid
- Enter: Select image to download
- Escape: Close menu

Mouse Wheel works everywhere.

#### Universal Controls
- Ctrl + Q: Quit Emulsion
- Shift + Arrows: Alternative navigation mode (platform switching in galleries)
- Ctrl + Shift + K: Quit game and return to Emulsion

#### Contextual Help
Control hints appear in the footer based on current screen:
- D-Pad Icon: Indicates primary navigation method
- Shoulder Button Icons: Show secondary actions (platform switching)
- Button Labels: Change dynamically for context-specific actions (e.g., "Fetch cover", "Browse Platforms")

## Can I help?

Why of course, thank you for asking.

- Donate
- Submit an issue
- Contribute code
