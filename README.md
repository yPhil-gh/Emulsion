# Emulsion

A unified, lightweight frontend for game emulators.

![Emulsion](https://yphil.gitlab.io/images/emulsion-screenshot00.png)

- [Features](#features)
  - [Controllable](#controllable)
  - [Standard](#standard)
  - [Robust](#robust)
  - [Cover art management](#cover-art-management)
- [Installation](#installation)
- [Usage](#usage)
  - [Platform configuration](#platform-configuration)
    - [Games directory](#games-directory)
    - [Emulator](#emulator)
    - [Emulator arguments](#emulator-arguments)
      - [What emulator / launch arguments can I use for (insert machine / platform)?](#what-emulator--launch-arguments-can-i-use-for-insert-machine--platform)
  - [Controls](#controls)
    - [Home](#home)
    - [Gallery](#gallery)
    - [Game/Platform Menu](#gameplatform-menu)
    - [Universal Controls](#universal-controls)
    - [Mouse](#mouse)
    - [Contextual Help](#contextual-help)
- [Can I help?](#can-i-help)


## Features
### Controllable
- Your games can be anywhere
- Latest versions of the emulators
- Fine-tuning of the emulators
- Fully controllable using **game controller, keyboard & mouse**.

### Standard
- One single config file
- Install a full gaming PC in one command

### Robust
- One update of an emulator won't break everything
- Emulsion will never forget you game controller config / calibration. It-just-works.

### Cover art management
Direct dowloading of the game cover art via several backends:

- [SteamGridDB](https://www.steamgriddb.com/)
- [MobyGames](mobygames.com)
- [Exotica](https://www.exotica.org.uk/)
- [Wikipedia](https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers)
- [GiantBomb](https://www.giantbomb.com/api/)
- [UVList](https://www.uvlist.net/)

See the [Emulsion Wiki](https://gitlab.com/yphil/emulsion/-/wikis/home) for [details about the cover art search & download backends](https://gitlab.com/yphil/emulsion/-/wikis/home#cover-art-download-backends-api-keys).

## Installation

- See [Releases](https://gitlab.com/yphil/emulsion/-/releases)
- `npm install ; npm start`

## Usage
### Platform configuration

![Emulsion](https://yphil.gitlab.io/images/emulsion-01-platform_config.png)

For each machine, enter

#### Games directory
The directory where the games are stored for that platform ; Enter a path or better, use the Browse button
#### Emulator
The emulator for that platform. The name of a program installed on your machine, or the full path to an executable
#### Emulator arguments
The *optional* arguments for that emulator. Most don't need any, read on

##### What emulator / launch arguments can I use for (insert machine / platform)?
Consult [the Emulsion Wiki](https://gitlab.com/yphil/emulsion/-/wikis/home) to get tips on emulators and settings

### Controls
#### Home
The  platforms / machines carousel

| Action                      | Keyboard                       | Game controller                                |
|-----------------------------|--------------------------------|------------------------------------------------|
| Navigate between machines   | <kbd>←</kbd> / <kbd>→</kbd>    | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select highlighted platform | <kbd>Enter</kbd>               | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion               | <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Circle / B / East <kbd>○</kbd>                 |

#### Gallery
The games and plaforms config page

| Action                                | Keyboard                                                  | Game controller                |
|---------------------------------------|-----------------------------------------------------------|--------------------------------|
| Browse games                          | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Browse machines / platforms           | <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd>            | <kbd>L1</kbd> / <kbd>R1</kbd>  |
| Jump 10 rows                          | <kbd>Page Up</kbd> / <kbd>Page Down</kbd>                 |                                |
| Jump to first / last game             | <kbd>Home</kbd> / <kbd>End</kbd>                          |                                |
| **Launch** selected **game** 🚀       | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |
| Open game / cover image menu          | <kbd>I</kbd>                                              | Square / X / West <kbd>□</kbd> |
| Return to home screen / machines menu | <kbd>Escape</kbd>                                         | Circle / B / East <kbd>○</kbd> |


#### Game/Platform Menu
The game configuration / Download cover art menu

| Action                      | Keyboard                                                  | Game controller                |
|-----------------------------|-----------------------------------------------------------|--------------------------------|
| Navigate image thumbnails   | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Select / save image         | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |

#### Universal Controls
Works everywhere

| Action                           | Keyboard                                          | Game controller                               |
|----------------------------------|---------------------------------------------------|-----------------------------------------------|
| Close gallery / menu             | <kbd>Escape</kbd>                                 | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd |
| Select highlighted platform      | <kbd>Enter</kbd>                                  | Cross / A / South <kbd>⤫</kbd>                |
| Exit Emulsion                    | <kbd>Ctrl</kbd> + <kbd>Q</kbd>                    | Circle / B / East <kbd>○</kbd>                |
| Quit game and return to Emulsion | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> |                                               |
| Restart Emulsion                 | <kbd>F5</kbd>                                     |                                               |

#### Mouse
- Left Click: Home: Select platform, Menu: Select and save cover art image, Gallery: **launch game** 🚀
- Right-Click: Open contextual game menu
- Mouse Wheel: Scroll / browse machines / games

#### Contextual Help
Control hints appear in the footer based on current screen

## Can I help?

Why of course, thank you for asking.

- [Donate](https://yphil.gitlab.io/ext/support.html)
- [Report usage problems / suggestions](https://gitlab.com/yphil/emulsion/-/issues)
- [Contribute code](https://gitlab.com/yphil/emulsion/-/commits/master?ref_type=heads)
