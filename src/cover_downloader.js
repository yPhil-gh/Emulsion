const axios = require('axios');
const backends = {
    amiga: { module: require('./src/backends/exotica.js'), name: 'Exotica' },
    gamecube: { module: require('./src/backends/uvlist.js'), name: 'UVList' },
    dreamcast: { module: require('./src/backends/uvlist.js'), name: 'UVList' },
    default: { module: require('./src/backends/uvlist.js'), name: 'UVList' }
};

async function searchGame(gameName, platform) {
    const backend = backends[platform] || backends.default;

    console.log(`Using backend ${backend.name} for platform: ${platform}`);

    const res = await backend.module.searchGame(gameName, platform);

    console.log("res: ", res);

    return res || null;
}

function downloadAndReload(imageUrl, gameName, platform, imgElement) {
    console.log("downloadAndReload imageUrl: ", imageUrl);
    return window.coverDownloader.downloadImage(imageUrl, gameName, platform)
        .then(() => {
            window.coverDownloader.reloadImage(imgElement, path.join(window.userDataPath, "covers", platform, `${gameName}.jpg`));
            window.control.updateControlsMenu({message : `OK: ${gameName} (${platform})`});
        })
        .catch((error) => {
            console.error('Error downloading image:', error.message);
        });
}

async function downloadImage(imageUrl, gameName, platform) {
    console.log("downloadImage imageUrl: ", imageUrl);
    try {
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
    const cacheBuster = new Date().getTime(); // Unique timestamp
    const newSrc = `${coverPath}?t=${cacheBuster}`;

    console.log("Previous imgElement.src:", imgElement.src);
    imgElement.src = newSrc;
    console.log("Updated imgElement.src:", imgElement.src);
    console.log(`Image reloaded: ${newSrc}`);
}


window.coverDownloader = {
    searchGame: searchGame,
    downloadImage: downloadImage,
    reloadImage: reloadImage,
    downloadAndReload: downloadAndReload
};
