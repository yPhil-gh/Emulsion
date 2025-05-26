[![Latest Release](https://img.shields.io/github/v/release/yPhil-gh/emulsion/?style=for-the-badge)](https://github.com/yPhil-gh/emulsion/releases/latest)

# Emulsion

A unified, lightweight frontend for your game emulators.

![Emulsion](https://yphil.gitlab.io/images/emulsion-screenshot00.png?x)

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Platform](#platform)
  - [Cover art](#cover-art)
- [Usage](#usage)
  - [Controls](#controls)
  - [CLI](#cli)
- [Can I help?](#can-i-help)

## Features

Emulsion:
- Unifies all *your* emulators in a single interface
- Lets you *precisely* select game cover art from multiple backends

These features set it apart from solutions that:
- Manage emulators (which Emulsion doesn't do)
- Handle controller configuration (often unreliably)
- Handle cover art downloads automatically / unattended / or even externally, without selection options

Emulsion is *reproductible*: Thanks to its single **standard** config file, you can install a full gaming PC in one command, and-it-won't-move ; At least that's the idea.

## Installation

### Package (recommended)
- [Latest Linux Deb release](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_amd64.deb)
- [Latest Linux AppImage release](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x86_64.AppImage)
- [Latest Windows release](https://github.com/yPhil-gh/emulsion/releases/latest/download/emulsion_x64.exe)

- Other [Releases](https://github.com/yphil-gh/emulsion/releases/latest)

### Source

- `npm install ; npm start`

## Configuration

### Platform

![Emulsion](https://yphil.gitlab.io/images/emulsion-01-platform_config.png?xx)

- Games directory

The directory where the games are stored for that platform ; Enter a path or better, use the Browse button.

- Emulator

The emulator for that platform. The name of a program installed on your machine, or use the Browse button to select an emulator executable.

- Emulator arguments

The *optional* arguments for that emulator ; Most don't need any, [read on](#emulator-tips).

#### Emulator tips

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
| Xbox       | [~/bin/EMU/xemu-v0.8.48-x86_64.AppImage](https://xemu.app/)                              | `-full-screen -dvd_path` | `.xiso.iso`     |
| PSP        |                                                                                          |                          | `.iso`          |
| PS3        | [~/bin/rpcs3-v0.0.35-17701-6921684c_linux64.AppImage](https://rpcs3.net/)                | `--no-gui`               | `.SFO`          |


##### Nota bene
- The arguments are the default in Emulsion
- This emulator list works on an Ubuntu 24.04.2 LTS box ; All the packages referenced by their name only are directly installed from the normal system repo / app store:

`sudo apt install mupen64plus mednafen pcsx2 amiberry`

The others a either un-packaged for Ubuntu, or their package is so outdated that it's better to get the latest appImage.

### Cover art

Emulsion handles the download of the cover art images of you games.

#### backends API Keys

Some cover art download backends (SteamGridDB and GiantBomb) require authentication ; The key is free and easy to obtain:

- GiantBomb
  - get your key at https://www.giantbomb.com/api/

- SteamGridDB
  - Create or log into your [Steam](https://store.steampowered.com/) account ;
  - Get your [API](https://www.steamgriddb.com/api/v2) key by login in to https://www.steamgriddb.com and open the preferences menu.

Paste the key into the corresponding field in the **Emulsion settings** form ; click <kbd>Save</kbd>.
The other backends require no authentication, but you'll find **way more** images using all the backends, including SteamGridDB and GiantBomb.

If you can - after you [donated to this project](https://yphil.gitlab.io/ext/support.html), thank you very much 🙂 please consider supporting those backends. They do a great job of keeping our common culture aliv... Well, existing.

#### All backends
  - [SteamGridDB](https://www.steamgriddb.com/) (API)
  - [GiantBomb](https://www.giantbomb.com/api/) (API)
  - [MobyGames](mobygames.com) (Web)
  - [Exotica](https://www.exotica.org.uk/) (Web)
  - [Wikipedia](https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers) (Amiga) (Web)
  - [UVList](https://www.uvlist.net/) (Web)

...More to come.

## Usage

### Controls

- Home

Platforms / machines home carousel

| Action                      | Keyboard                       | Game controller                                |
|-----------------------------|--------------------------------|------------------------------------------------|
| Navigate between machines   | <kbd>←</kbd> / <kbd>→</kbd>    | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select highlighted platform | <kbd>Enter</kbd>               | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion               | <kbd>Ctrl</kbd> + <kbd>Q</kbd> | Circle / B / East <kbd>○</kbd>                 |

- Galleries

Games (and plaforms config) pages

| Action                                    | Keyboard                                                  | Game controller                |
|-------------------------------------------|-----------------------------------------------------------|--------------------------------|
| Browse games                              | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Browse machines / platforms               | <kbd>Shift</kbd> + <kbd>←</kbd> / <kbd>→</kbd>            | <kbd>L1</kbd> / <kbd>R1</kbd>  |
| Jump 10 rows                              | <kbd>Page Up</kbd> / <kbd>Page Down</kbd>                 |                                |
| Jump to first / last game                 | <kbd>Home</kbd> / <kbd>End</kbd>                          |                                |
| **Launch** selected **game** 🚀           | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |
| Open game / cover image menu              | <kbd>I</kbd>                                              | Square / X / West <kbd>□</kbd> |
| Return to home screen / machines menu (1) | <kbd>Escape</kbd>                                         | Circle / B / East <kbd>○</kbd> |

**1**: Only works on Linux ([for now](https://github.com/IBM/sdl2-gamecontroller/issues/16)).

- Game menu

Game config / download cover art menu

| Action                      | Keyboard                                                  | Game controller                |
|-----------------------------|-----------------------------------------------------------|--------------------------------|
| Navigate image thumbnails   | <kbd>←</kbd> / <kbd>→</kbd> / <kbd>↑</kbd> / <kbd>↓</kbd> | DPad                           |
| Select / save image         | <kbd>Enter</kbd>                                          | Cross / A / South <kbd>⤫</kbd> |

- Global controls

Works everywhere

| Action                                           | Keyboard                                          | Game controller                                |
|--------------------------------------------------|---------------------------------------------------|------------------------------------------------|
| Back                                             | <kbd>Escape</kbd>                                 | D-Pad Left / Right <kbd>◄</kbd> / <kbd>►</kbd> |
| Select                                           | <kbd>Enter</kbd>                                  | Cross / A / South <kbd>⤫</kbd>                 |
| Exit Emulsion                                    | <kbd>Ctrl</kbd> + <kbd>Q</kbd>                    | Circle / B / East <kbd>○</kbd>                 |
| Quit game / Exit emulator and return to Emulsion | <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>K</kbd> | Select / Share + <kbd>▼</kbd>                  |
| Reload Emulsion                                  | <kbd>F5</kbd>                                     |                                                |
| Restart Emulsion                                 | <kbd>Shift</kbd> + <kbd>F5</kbd>                  | Select / Share + <kbd>▲</kbd>                  |

- Mouse
  - Left Click: Home: Select platform, Menu: Select and save cover art image, Gallery: **launch game** 🚀
  - Right-Click: Open contextual game menu
  - Mouse Wheel: Scroll / browse machines / games

- Contextual help
  - Control hints appear in the footer based on current screen.

### CLI

Command Line Interface:

```
Options:
  --kiosk        Media center / Kids mode: No settings + disabled platforms hidden.
  --full-screen  Start Emulsion in full screen mode.
  --help         Show this help message.
```

## Can I help?

Why of course, thank you for asking.

- [Donate](https://yphil.gitlab.io/ext/support.html)
- [Report usage problems / suggestions](https://github.com/yPhil-gh/emulsion/issues)
- [Contribute code](https://github.com/yPhil-gh/emulsion/commits/master/)

This repository is a mirror of https://gitlab.com/yphil/emulsion the official Emulsion repo.
