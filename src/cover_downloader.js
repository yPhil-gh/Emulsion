const axios = require('axios');

const uvlist = require('./src/backends/uvlist.js');
const lemonamiga = require('./src/backends/lemonamiga.js');
const wikipedia = require('./src/backends/wikipedia.js');
const exotica = require('./src/backends/exotica.js');

async function searchGame(gameName, platform) {
    let backend;
    switch (platform) {
    case 'amiga':
        backend = exotica;
        break;
    case 'gamecube':
    case 'dreamcast':
    default:
        backend = uvlist;
        break;
    }

    console.log(`Using backend for platform: ${platform}`);

    const res = await backend.searchGame(gameName, platform);

    console.log("res: ", res);

    return res || null;
    // return null;
}

async function downloadImage(imageUrl, gameName, platform) {
    try {
        console.log("window.userDataPath: ", window.userDataPath);
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        // console.log("response: ", response);
        console.log("gameName, platform: ", gameName, platform);
        const coverPath = path.join(window.userDataPath, "covers", platform, `${gameName}.jpg`);
        console.log("coverPath: ", coverPath);
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

window.coverDownloader = {
    searchGame: searchGame,
    downloadImage: downloadImage,
    reloadImage: reloadImage
};
