// All the libs used are required here
const { ipcRenderer, shell } = require('electron');
let fs = require('fs');
const path = require('path');
const fsp = require('fs').promises;
const axios = require('axios');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);

const LB = {}; // Launch Break :)

window.ipcRenderer = ipcRenderer;

LB.enabledPlatforms = ['settings'];

LB.isMenuOpen = false;

function updateControls(section, newIcon, newText, display) {
    const sectionDiv = document.getElementById(section);
    if (!sectionDiv) {
        console.warn(`Section '${section}' not found!`);
        return;
    }

    const icon = sectionDiv.querySelector("img.icon");
    const textSpan = sectionDiv.querySelector("span");

    if (display === 'off') {
        sectionDiv.style.display = 'none';
    }

    if (display === 'on') {
        sectionDiv.style.display = 'flex';
    }

    if (icon && newIcon !== 'same') {
        icon.src = `../../img/controls/${newIcon}.png`;
    }

    if (textSpan && newText !== 'same') {
        textSpan.innerHTML = newText;
    }
}


function getSelectedGame(gameContainers, selectedIndex) {
    let selectedContainer;
    gameContainers.forEach(async (container, index) => {
        if (index === selectedIndex) {
            selectedContainer = container;
        }

    });
    return selectedContainer || null;
}


function simulateKeyDown(key) {
    const keyCode = key === 'ArrowDown' ? 40 : 38;
    const keyboardEvent = new KeyboardEvent('keydown', {
        key,
        code: key,
        keyCode,
        which: keyCode,
        bubbles: true
    });
    document.dispatchEvent(keyboardEvent);
}

function safeFileName(fileName) {

    const illegalRe = /[\/\?<>\\:\*\|"]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[\. ]+$/;

    return fileName
        .replace(/[\s]/g, '_') // Replace spaces with underscores
        .replace(illegalRe, '') // Remove invalid characters
        .replace(controlRe, '') // Remove control characters
        .replace(reservedRe, '') // Remove trailing dots
        .replace(/^\s+|\s+$/g, '') || 'default_filename'; // Prevent empty names
}

function cleanFileName(fileName) {
    // Step 1: Remove everything after the first underscore.
    let baseName = _removeAfterUnderscore(fileName);

    // Step 2: Handle special digit+letter cases (e.g., "3DWorld" → "3D World")
    let withSpecialSplit = _splitSpecial(baseName);

    // Step 3: Split camelCase (insert space between a lowercase and an uppercase letter)
    let withCamelSplit = _splitCamelCase(withSpecialSplit);

    // Step 4: Split acronyms from following capitalized words (e.g., "XMLHttp" → "XML Http")
    let withAcronymSplit = _splitAcronym(withCamelSplit);

    let withNumberSplit = _splitNumberWord(withAcronymSplit);

    // // Step 5: Remove extra spaces and trim.
    // let normalized = _normalizeSpaces(withNumberSplit);

    let articleToFront = _moveTrailingArticleToFront(withAcronymSplit);

    let withoutParens = _removeParens(articleToFront);

    return _removeBrackets(withoutParens);
}

function _removeAfterUnderscore(fileName) {
    return fileName.split('_')[0];
}

function _removeBrackets(s) {
    return s.replace(/\s*\[.*?\]/g, '');
}

function _removeParens(s) {
    return s.replace(/\s*\(.*?\)/g, '');
}

// Inserts a space after a sequence like "3D" when it is immediately followed by an uppercase letter and a lowercase letter.
function _splitSpecial(s) {
    return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

// Splits camelCase by inserting a space between a lowercase letter and an uppercase letter.
function _splitCamelCase(s) {
    return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Splits an acronym from a following capitalized word (e.g., "XMLHttp" becomes "XML Http").
function _splitAcronym(s) {
    return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// // Normalizes spacing by trimming and replacing multiple spaces with a single space.
// function _normalizeSpaces(s) {
//   return s.trim().replace(/\s+/g, ' ');
// }

function _splitNumberWord(s) {
    s.replace(/(?<!\b[234])(\d+)([A-Za-z])/g, '$1 $2');
}

// Final function: If the string ends with ", The", move "The" to the beginning.
function _moveTrailingArticleToFront(s) {
    // Match pattern: any text, followed by a comma, optional whitespace, then "The" (case-insensitive)
    const pattern = /^(.*),\s*(The)$/i;
    const match = s.match(pattern);
    if (match) {
        // Return "The " + the rest of the string (trimmed)
        return match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase() + ' ' + match[1].trim();
    }
    return s;
}

function getPlatformName(name) {
    switch (name) {
    case 'snes':
        return "SNES";
        break;
    case 'pcengine':
        return "PCEngine";
        break;
    case 'psx':
        return "Playstation";
        break;
    case 'ps2':
        return "Playstation 2";
        break;
    case 'ps3':
        return "Playstation 3";
        break;
    case 'gamecube':
        return "GameCube";
        break;
    case 'n64':
        return "Nintendo64";
        break;
    default:
        break;
    }

    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}


async function _loadUserData() {
    try {
        const preferences = await ipcRenderer.invoke('load-preferences');

        LB.userDataPath = preferences.userDataPath;
        LB.baseDir = path.resolve(preferences.appPath);
        LB.versionNumber = preferences.versionNumber;
        LB.kidsMode = preferences.kidsMode;
        LB.recents = preferences.recents;

        delete preferences.userDataPath;
        delete preferences.appPath;
        delete preferences.versionNumber;
        delete preferences.kidsMode;
        delete preferences.recents;

        LB.preferences = preferences;

        return preferences;
    } catch (error) {
        console.error("Failed to load preferences:", error);
        window.location.reload();

        throw error; // Re-throw the error if needed
    }
}

async function getPrefs() {
    try {
        const preferences = await _loadUserData();
        console.log("getPrefs: ", preferences);
        return preferences;
    } catch (error) {
        console.error("Error loading preferences:", error);
        throw error;
    }
}

async function updatePreference(platformName, key, value) {
    console.log("platformName, key, value: ", platformName, key, value);
    try {

        const preferences = await getPrefs();

        console.log("preferences[key]: ", preferences[platformName][key]);
        console.log("preferences[key] === value: ", preferences[platformName][key] === value);

        if (preferences[platformName][key] === value) {
            console.log("Nothing to save or do.");
            return null;
        }

        preferences[platformName][key] = value;
        await ipcRenderer.invoke('save-preferences', preferences);

        const notifications = document.getElementById('notifications');
        const notification = document.getElementById('notification');

        notification.textContent = 'Preferences saved successfuly';

        notifications.style.opacity = 1;

        // Fade out after 1 second (same duration as the transition)
        setTimeout(() => {
            notifications.style.opacity = 0;
        }, 3000); // Adjust timing to match your transition duration


        console.log(`${platformName} Preferences saved successfully!`);

        return 'OK';
    } catch (error) {
        console.error('Error updating preference:', error);
        throw error; // Re-throw the error to handle it elsewhere
    }
}

async function getPlatformPreference(platformName, key) {
    try {
        // Step 1: Load the current preferences
        const preferences = await getPrefs();

        console.log("preferences[platformName]: ", preferences[platformName]);

        // Step 2: Check if the platform exists
        if (!preferences[platformName]) {
            throw new Error(`Platform "${platformName}" not found in preferences.`);
        }

        // Step 3: Check if the key exists for the platform
        if (preferences[platformName][key] === undefined) {
            throw new Error(`Key "${key}" not found for platform "${platformName}".`);
        }

        // // Step 4: Return the value for the specified key
        return preferences[platformName][key];
    } catch (error) {
        console.error('Error getting platform preference:', error);
        throw error; // Re-throw the error to handle it elsewhere
    }
}

function applyTheme(theme) {
    const body = document.querySelector('body');
    const menu = document.getElementById('menu');

    const baseDir = LB.baseDir.endsWith('/')
        ? LB.baseDir.slice(0, -1)
        : LB.baseDir;

    const bgImageUrl = `url("${baseDir}/img/themes/${theme}/background.png")`;

    body.style.backgroundImage = bgImageUrl;
    menu.style.backgroundImage = bgImageUrl;

    menu.style.transition = 'filter 1s';
    menu.style.filter = 'opacity(0.5)';

    body.classList.remove('theme-day', 'theme-night', 'theme-default');
    body.classList.add(`theme-${theme}`);

    menu.style.transition = 'filter 1s, color 1s';
    menu.style.filter = 'opacity(0.5)';

    setTimeout(() => {
        menu.style.backgroundImage = bgImageUrl;
        menu.style.filter = 'opacity(1)';
    }, 100);
}

function setFooterSize(size) {
  const footer = document.getElementById('footer');
  footer.className = size === 'big' ? '' : `footer-${size}`;
  // localStorage.setItem('footerSize', size);
}

LB.prefs = {
    load: getPrefs,
    save: updatePreference,
    getValue: getPlatformPreference
};

LB.utils = {
    applyTheme: applyTheme,
    setFooterSize: setFooterSize,
    getPlatformName: getPlatformName,
    cleanFileName: cleanFileName,
    safeFileName: safeFileName,
    simulateKeyDown: simulateKeyDown,
    getSelectedGame: getSelectedGame,
    updateControls: updateControls
};
