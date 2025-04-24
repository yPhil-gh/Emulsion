![Emulsion](https://gitlab.com/yphil/emulsion/-/raw/master/img/icon.png){: width="72px"}

# Emulsion

A unified, lightweight frontend for game emulators.

- [Features](#features)
  - [Full control](#full-control)
  - [Centralized, standard configuration](#centralized-standard-configuration)
  - [Solidity](#solidity)
  - [Input Versatility](#input-versatility)
  - [Cover art management](#cover-art-management)
- [Installation](#installation)
- [Usage](#usage)
  - [Platform configuration](#platform-configuration)
    - [Games directory](#games-directory)
    - [Emulator](#emulator)
    - [Emulator arguments](#emulator-arguments)
    - [What emulator can I use for <platform> ?](#what-emulator-can-i-use-for-platform-)
  - [Controls](#controls)
    - [Home Screen (Platform Slideshow)](#home-screen-platform-slideshow)
      - [Keyboard](#keyboard)
      - [Gamepad](#gamepad)
    - [Gallery Screen (Games / Machines)](#gallery-screen-games--machines)
      - [Keyboard](#keyboard)
      - [Gamepad](#gamepad)
    - [Game/Platform Menu](#gameplatform-menu)
    - [Universal Controls](#universal-controls)
    - [Mouse](#mouse)
    - [Contextual Help](#contextual-help)
- [Can I help?](#can-i-help)

![Emulsion](https://yphil.gitlab.io/images/emulsion-screenshot00.png)

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

## Installation

See [Releases](https://gitlab.com/yphil/emulsion/-/releases)

## Usage
### Platform configuration

![Emulsion](https://yphil.gitlab.io/images/emulsion-01-platform_config.png)

For each machine, enter

- Games directory
- Emulator
- Optional Emulator arguments

#### Games directory
The directory where the games are stored for that platform
#### Emulator
The emulator for that platform. The name of a program installed on your machine, or the full path to an executable
#### Emulator arguments
The *optional* arguments for that emulator. Most don't need any.

#### What emulator can I use for (insert machine / platform)?
Consult the wiki to get tips on emulators and settings

### Controls
#### Home Screen (Platform Slideshow)
##### Keyboard
- <kbd>←</kbd> / <kbd>→</kbd>: Navigate between machines
- <kbd>Enter</kbd>: Select highlighted platform
- <kbd>Esc</kbd> / <kbd>Ctrl</kbd>+<kbd>Q</kbd>: Exit Emulsion

##### Gamepad
- D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd>: Platform navigation
- Cross / A / South <kbd>X</kbd>: Confirm selection
- Circle / B / East <kbd>O</kbd>: Exit Emulsion

#### Gallery Screen (Games / Machines)
##### Keyboard
- <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd>: Browse games
- <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd>: Browse machines / platforms
- <kbd>Page Up</kbd> / <kbd>Page Down</kbd>: Jump 10 rows
- <kbd>Home</kbd> / <kbd>End</kbd>: Jump to first / last game
- <kbd>Enter</kbd>: **Launch** selected **game** 🚀
- <kbd>Escape</kbd>: Return to home screen / machines menu
- <kbd>I</kbd>: Open game / cover image menu

##### Gamepad
- D-Pad Left / Right / Up / down <kbd>◄</kbd> / <kbd>►</kbd> / <kbd>▲</kbd> / <kbd>▼</kbd>: Game navigation
- <kbd>L1</kbd> / <kbd>R1</kbd>: Platform switching
- Cross / A / South <kbd>X</kbd>: **Launch** selected **game** 🚀
- Square / X / West <kbd>□</kbd>: Open game menu
- Circle / B / East <kbd>O</kbd>: Back to home

#### Game/Platform Menu
- <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd>: Navigate image thumbnails
- <kbd>Enter</kbd>: Select / save image
- <kbd>Escape</kbd>: Close menu

#### Universal Controls
- <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd>: Quit game and return to Emulsion
- <kbd>Ctrl</kbd> + <kbd>Q</kbd>: Quit Emulsion
- <kbd>F5</kbd>: Restart Emulsion

#### Mouse
- Left Click: Select platform / launch game
- Right-Click: Open context menu for selected game
- Mouse Wheel: Scroll machines / games

#### Contextual Help
Control hints appear in the footer based on current screen

## Can I help?

Why of course, thank you for asking.

- [Donate](https://yphil.gitlab.io/ext/support.html)
- [Report usage problems / suggestions](https://gitlab.com/yphil/emulsion/-/issues)
- [Contribute code](https://gitlab.com/yphil/emulsion/-/commits/master?ref_type=heads)
