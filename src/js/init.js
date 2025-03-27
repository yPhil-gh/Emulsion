// All the libs used are required here
let fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const fsp = require('fs').promises; // Use the promise-based fs module
const axios = require('axios');

const LB = {}; // Launch Break :)

window.ipcRenderer = ipcRenderer;

const resolvedPath = path.resolve('.');

// LB.baseDir = resolvedPath;
// console.log("resolvedPath init: ", LB.baseDir);

// LB.baseDir = path.join(path.resolve(app.getAppPath()), 'src');

// console.log("path.join(path.resolve(app.getAppPath()), 'src'): ", path.join(path.resolve(app.getAppPath()), 'src'));

// console.log("app.getAppPath(): ", app.getAppPath());

LB.galleryNumOfCols = 7;

LB.prefs = {
    load: getPrefs,
    save: updatePreference,
    getValue: getPlatformPreference
};

LB.enabledPlatforms = [];

LB.isMenuOpen = false;

LB.utils = {
    capitalizeWord: capitalizeWord,
    cleanFileName: cleanFileName,
    simulateKeyDown: simulateKeyDown,
    getSelectedGame: getSelectedGame,
    updateControls: updateControls
};

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

function cleanFileName(fileName) {
  // Step 1: Remove everything after the first underscore.
  let baseName = _removeAfterUnderscore(fileName);

  // Step 2: Handle special digit+letter cases (e.g., "3DWorld" → "3D World")
  let withSpecialSplit = _splitSpecial(baseName);

  // Step 3: Split camelCase (insert space between a lowercase and an uppercase letter)
  let withCamelSplit = _splitCamelCase(withSpecialSplit);

  // Step 4: Split acronyms from following capitalized words (e.g., "XMLHttp" → "XML Http")
  let withAcronymSplit = _splitAcronym(withCamelSplit);

  // Step 5: Remove extra spaces and trim.
  let normalized = _normalizeSpaces(withAcronymSplit);

  let articleToFront = _moveTrailingArticleToFront(withAcronymSplit);

  return _removeBrackets(articleToFront);
}

function _removeAfterUnderscore(fileName) {
  return fileName.split('_')[0];
}

function _removeBrackets(s) {
    return s.replace(/\s*\[.*?\]/g, '');
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

// Normalizes spacing by trimming and replacing multiple spaces with a single space.
function _normalizeSpaces(s) {
  return s.trim().replace(/\s+/g, ' ');
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

function capitalizeWord(word) {
    switch (word) {
    case 'snes':
        return "SNES";
        break;
    case 'pcengine':
        return "PCEngine";
        break;
    default:
        break;
    }

    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}


async function _loadUserData() {
    try {
        const preferences = await ipcRenderer.invoke('load-preferences');

        LB.userDataPath = preferences.userDataPath;
        LB.baseDir = path.resolve(preferences.appPath);
        window.versionNumber = preferences.versionNumber;
        window.baseDir = LB.baseDir;
        console.log("LB.baseDir: ", LB.baseDir);
        delete preferences.userDataPath;
        delete preferences.appPath;
        delete preferences.versionNumber;
        LB.preferences = preferences;

        return preferences;
    } catch (error) {
        console.error("Failed to load preferences:", error);
        throw error; // Re-throw the error if needed
    }
}

async function getPrefs() {
    try {
        const preferences = await _loadUserData();
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

        // console.log("preferences[platformName]: ", preferences[platformName]);

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


ipcRenderer.on('deliver-about-content', (event, aboutContent) => {
    const aboutContainer = document.getElementById('about-container');
    const aboutContentDiv = document.getElementById('about-content');
    aboutContentDiv.innerHTML = aboutContent;

    const trackmoScript = document.createElement('script');
    trackmoScript.src = path.join(LB.baseDir, 'src', 'js', 'trackmo.js');
    trackmoScript.onload = () => {
        console.log('Script loaded.');
    };
    trackmoScript.onerror = () => {
        console.error('Failed to load script');
    };

    // const howlScript = document.createElement('script');
    // howlScript.src = path.join(LB.baseDir, 'node_modules', 'howler', 'howler.min.js');
    // howlScript.onload = () => {
    //     console.log('Script loaded.');
    // };
    // howlScript.onerror = (error) => {
    //     console.error('Failed to load script');
    // };
    // // document.head.appendChild(howlScript);

    // document.head.appendChild(howlScript);

    document.head.appendChild(trackmoScript);

    // const song = document.createElement('audio');
    // song.classList.add('test-audio');
    // song.src = '../../audio/ding.oga';
    // song.onload = () => {
    //     console.log('Song loaded.');
    // };
    // song.onerror = () => {
    //     console.error('Failed to load song');
    // };
    // document.body.appendChild(script);
    // document.body.appendChild(song);


    aboutContainer.style.display = 'block';
});
