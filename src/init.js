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

  // Step 2: Handle special digit+letter cases (e.g., "3DWorld" → "3D World")
  let withSpecialSplit = splitSpecial(baseName);

  // Step 3: Split camelCase (insert space between a lowercase and an uppercase letter)
  let withCamelSplit = splitCamelCase(withSpecialSplit);

  // Step 4: Split acronyms from following capitalized words (e.g., "XMLHttp" → "XML Http")
  let withAcronymSplit = splitAcronym(withCamelSplit);

  // Step 5: Remove extra spaces and trim.
  let normalized = normalizeSpaces(withAcronymSplit);

  // Final pass: If the string ends with ", The", move it to the front.
  return moveTrailingArticleToFront(normalized);
}

function removeAfterUnderscore(fileName) {
  return fileName.split('_')[0];
}

// Inserts a space after a sequence like "3D" when it is immediately followed by an uppercase letter and a lowercase letter.
function splitSpecial(s) {
  return s.replace(/(\d+[A-Z])(?=[A-Z][a-z])/g, '$1 ');
}

// Splits camelCase by inserting a space between a lowercase letter and an uppercase letter.
function splitCamelCase(s) {
  return s.replace(/([a-z])([A-Z])/g, '$1 $2');
}

// Splits an acronym from a following capitalized word (e.g., "XMLHttp" becomes "XML Http").
function splitAcronym(s) {
  return s.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

// Normalizes spacing by trimming and replacing multiple spaces with a single space.
function normalizeSpaces(s) {
  return s.trim().replace(/\s+/g, ' ');
}

// Final function: If the string ends with ", The", move "The" to the beginning.
function moveTrailingArticleToFront(s) {
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

