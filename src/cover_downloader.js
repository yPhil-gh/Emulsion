const axios = require('axios');

const uvlist = require('./src/backends/uvlist.js');
const lemonamiga = require('./src/backends/lemonamiga.js');

async function searchGame(gameName, platform) {
    let backend;
    switch (platform) {
        case 'amiga':
            backend = lemonamiga;
            break;
        case 'gamecube':
        case 'dreamcast':
        default:
            backend = uvlist;
            break;
    }

    console.log(`Using backend for platform: ${platform}`);
    return backend.searchGame(gameName, platform);
}

async function downloadCover(imageUrl, gameName, platform) {
  try {
    console.log("window.userDataPath: ", window.userDataPath);
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    console.log("response: ", response);

      const coverPath = path.join(window.userDataPath, "covers", platform, `${gameName}.jpg`);
    // Convert the ArrayBuffer to a Node.js Buffer
    const coverBuffer = Buffer.from(response.data);
    fs.writeFileSync(coverPath, coverBuffer);

    console.log(`Cover downloaded for ${gameName} (${platform})`);
    return coverPath;
  } catch (error) {
    console.error(`Error downloading cover for ${gameName}:`, error.message);
    throw error;
  }
}


function reloadImage(imgElement, coverPath) {
    imgElement.src = coverPath;
    console.log(`Image reloaded: ${coverPath}`);
}

// Expose functions globally
window.coverDownloader = { searchGame, downloadCover, reloadImage };
