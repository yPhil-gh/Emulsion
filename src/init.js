// All the libs used are required here
let fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const fsp = require('fs').promises; // Use the promise-based fs module
const axios = require('axios');

const LB = {};

const resolvedPath = path.resolve('.');

LB.baseDir = resolvedPath;

LB.galleryNumOfCols = 6;

LB.prefs = {
    load: getPrefs,
    save: updatePreference,
    getValue: getPlatformPreference
};

LB.isMenuOpen = false;

LB.utils = {
    capitalizeWord: capitalizeWord,
    cleanFileName: cleanFileName
};

function cleanFileName(fileName) {
  // Step 1: Remove everything after the first underscore.
  let baseName = removeAfterUnderscore(fileName);

  // Step 2: Handle special digit+letter case (e.g., "3DWorld" should become "3D World")
  let withSpecialSplit = splitSpecial(baseName);

  // Step 3: Split camelCase (insert space between a lowercase and an uppercase letter)
  let withCamelSplit = splitCamelCase(withSpecialSplit);

  // Step 4: Further split acronyms from following capitalized words (e.g., "XMLHttp" -> "XML Http")
  let withAcronymSplit = splitAcronym(withCamelSplit);

  // Final cleanup: remove extra spaces and trim.
  return normalizeSpaces(withAcronymSplit);
}

function removeAfterUnderscore(fileName) {
  return fileName.split('_')[0];
}

// This function inserts a space after a pattern that looks like digits followed by an uppercase letter
// only when that token is immediately followed by an uppercase letter and then a lowercase letter.
// For example, "3DWorld" becomes "3D World" rather than "3DW orld".
function splitSpecial(s) {
  return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

// Insert a space between a lowercase letter and an uppercase letter.
function splitCamelCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Insert a space between an acronym (two or more uppercase letters) and a following capitalized word.
// For example, "XMLHttp" becomes "XML Http".
function splitAcronym(s) {
  return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// Clean up multiple spaces and trim the result.
function normalizeSpaces(s) {
  return s.trim().replace(/\s+/g, ' ');
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
        delete preferences.userDataPath;
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

