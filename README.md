# Emulsion

A unified, lightweight frontend for game emulators.

![Emulsion](https://yphil.gitlab.io/images/emulsion-screenshot00.png?x)

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
  - [Controls](#controls)
    - [Home](#home)
    - [Galleries](#galleries)
    - [Game/Platform Menu](#gameplatform-menu)
    - [Global controls](#global-controls)
    - [Mouse](#mouse)
    - [Contextual help](#contextual-help)
  - [Cover art download backends API Keys](#cover-art-download-backends-api-keys)
    - [SteamGridDB](#steamgriddb)
    - [GiantBomb](#giantbomb)
    - [Complete list of backends](#complete-list-of-backends)
  - [Emulator tips](#emulator-tips)
- [Can I help?](#can-i-help)


## Features
### Controllable
- Your games can be anywhere ;
- Latest versions of the emulators ;
- Fine-tuning of the emulators ;
- Fully controllable using **game controller, keyboard & mouse**.

### Standard
- One single config file ;
- Install a full gaming PC in one command.

### Robust
- One update of an emulator won't break everything ;
- Emulsion will never forget your game controller config / calibration. It-just-works.

### Cover art management
Direct dowloading of the game cover art via several backends:

- [SteamGridDB](https://www.steamgriddb.com/)
- [MobyGames](mobygames.com)
- [Exotica](https://www.exotica.org.uk/)
- [Wikipedia](https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers)
- [GiantBomb](https://www.giantbomb.com/api/)
- [UVList](https://www.uvlist.net/)

## Installation

- See [Releases](https://github.com/yphil-gh/emulsion/releases/latest)
- `npm install ; npm start`

## Usage
### Platform configuration

![Emulsion](https://yphil.gitlab.io/images/emulsion-01-platform_config.png)

#### Games directory
The directory where the games are stored for that platform ; Enter a path or better, use the Browse button.
#### Emulator
The emulator for that platform. The name of a program installed on your machine, or use the Browse button to select the full path to the emulator executable.
#### Emulator arguments
The *optional* arguments for that emulator. Most don't need any, [read on](#emulator-tips).

### Controls
#### Home
Platforms / machines home carousel

| Action                      | Keyboard                       | Game controller                                |
|-----------------------------|--------------------------------|------------------------------------------------|
| Navigate between machines   | <kbd>←</kbd> / <kbd>→</kbd>    | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select highlighted platform | <kbd>Enter</kbd>               | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion               | <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Circle / B / East <kbd>○</kbd>                 |

#### Galleries
Games (and plaforms config) pages

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
The game config / download cover art menu

| Action                      | Keyboard                                                  | Game controller                |
|-----------------------------|-----------------------------------------------------------|--------------------------------|
| Navigate image thumbnails   | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Select / save image         | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |

#### Global controls
Works everywhere

| Action                           | Keyboard                                          | Game controller                                |
|----------------------------------|---------------------------------------------------|------------------------------------------------|
| Back                             | <kbd>Escape</kbd>                                 | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select                           | <kbd>Enter</kbd>                                  | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion                    | <kbd>Ctrl</kbd> + <kbd>Q</kbd>                    | Circle / B / East <kbd>○</kbd>                 |
| Quit game and return to Emulsion | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> |                                                |
| Restart Emulsion                 | <kbd>F5</kbd>                                     |                                                |

#### Mouse
- Left Click: Home: Select platform, Menu: Select and save cover art image, Gallery: **launch game** 🚀
- Right-Click: Open contextual game menu
- Mouse Wheel: Scroll / browse machines / games

#### Contextual help
Control hints appear in the footer based on current screen.

### Cover art download

#### backends API Keys

Some cover art download backends (SteamGridDB and GiantBomb) require authentication ; The key is free and easy to obtain:
##### SteamGridDB
- Create or log into your [Steam](https://store.steampowered.com/) account ;
- Get your [API](https://www.steamgriddb.com/api/v2) key by login in to https://www.steamgriddb.com and open the preferences menu.

##### GiantBomb
- get your key at https://www.giantbomb.com/api/

Paste the key into the corresponding field in the **Emulsion settings** form ; click <kbd>Save</kbd>.
The other backends require no authentication, but you'll find **way more** images using all the backends, including SteamGridDB and GiantBomb.

If you can - after you donated to Emulsion -  support those backends. They do a great job of keeping our common culture ali... Well, existing.

#### Complete list of backends
- [SteamGridDB](https://www.steamgriddb.com/) (API)
- [GiantBomb](https://www.giantbomb.com/api/) (API)
- [MobyGames](mobygames.com) (Web)
- [Exotica](https://www.exotica.org.uk/) (Web)
- [Wikipedia](https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers) (Amiga) (Web)
- [UVList](https://www.uvlist.net/) (Web)

...More to come.

### Emulator tips

| Platform   | Emulator                                                                                 | Emulator Arguments       | Extensions      |
|------------|------------------------------------------------------------------------------------------|--------------------------|-----------------|
| NES        | [mednafen](https://mednafen.github.io/)                                                  |                          | `.zip`          |
| SMS        | mednafen                                                                                 |                          | `.zip`          |
| PC Engine  | mednafen                                                                                 |                          | `.pce`          |
| Amiga      | [amiberry](https://github.com/BlitterStudio/amiberry)                                    |                          | `.lha`, `.adf`  |
| Mega Drive | [~/bin/EMU/blastem64-0.6.2/blastem](https://www.retrodev.com/blastem/)                   | `-m gen -f`              | `.md `          |
| SNES       | [Mesen](https://www.mesen.ca/)                                                           |                          | `.smc`          |
| Jaguar     | [~/bin/EMU/BigPEmu_Linux64_v118/bigpemu/bigpemu](https://www.richwhitehouse.com/jaguar/) |                          | `.jag`          |
| Saturn     | mednafen                                                                                 |                          | `.cue`          |
| PSX        | [~/bin/EMU/DuckStation-x64.AppImage](https://github.com/stenzek/duckstation)             | `-fullscreen -nogui`     | `.srm`          |
| N64        | [mupen64plus](https://mupen64plus.org/)                                                  |                          | `.z64`          |
| Dreamcast  | [flycast-x86_64.AppImage](https://github.com/flyinghead/flycast)                         |                          | `.gdi`, `.cdi`  |
| PS2        | [pcsx2](https://pcsx2.net/)                                                              | `-nogui -fullscreen`     | `.bin`, `.iso`  |
| GameCube   | [~/bin/EMU/Dolphin-Emulator-5.0-16793-x86-64.AppImage](https://dolphin-emu.org/)         | `-b -e`                  | `.iso`, `.ciso` |
| Xbox       | [~/bin/EMU/xemu-v0.8.48-x86_64.AppImage](https://xemu.app/)                              | `-full-screen -dvd_path` | `.xiso.iso`          |
| PSP        |                                                                                          |                          | `.iso`          |
| PS3        | [~/bin/rpcs3-v0.0.35-17701-6921684c_linux64.AppImage](https://rpcs3.net/)                | `--no-gui`               | `.SFO`          |


**NB** This works on an Ubuntu 24.04.2 LTS box ; All the packages referenced by their name only are directly installed from the normal system repo / app store.

## Can I help?

Why of course, thank you for asking.

- [Donate](https://yphil.gitlab.io/ext/support.html)
- [Report usage problems / suggestions](https://github.com/yPhil-gh/emulsion/issues)
- [Contribute code](https://github.com/yPhil-gh/emulsion/commits/master/)
