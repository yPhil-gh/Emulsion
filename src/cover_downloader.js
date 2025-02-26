const axios = require('axios');
const backends = {
    amiga: { module: require('./src/backends/exotica.js'), name: 'Exotica' },
    // amiga: { module: require('./src/backends/lemonamiga.js'), name: 'LemonAmiga' },
    gamecube: { module: require('./src/backends/uvlist.js'), name: 'UVList' },
    // dreamcast: { module: require('./src/backends/uvlist.js'), name: 'UVList' },
    dreamcast: { module: require('./src/backends/mobygames.js'), name: 'MobyGames' },
    default: { module: require('./src/backends/uvlist.js'), name: 'UVList' }
};

async function searchGame(gameName, platform) {
    const backend = backends[platform] || backends.default;

    console.log(`Using backend ${backend.name} to search for ${gameName} (${platform})`);

    const nameParts = gameName.split(' ');
    let searchResults = null;

    let res;

    for (let i = nameParts.length; i >= 1; i--) {
        const partialName = nameParts.slice(0, i).join(' ');
        try {
            res = await backend.module.searchGame(partialName, platform);
            if (res) {
                return res;
            }
        } catch (error) {
            console.error(`Error searching for "${partialName}":`, error.message);
            continue;
        }
    }

    console.log("res: ", res);

    return res || null;
}

async function downloadAndReload(imageUrl, gameName, platform, imgElement) {
    try {
        const coverPath = await window.coverDownloader.downloadImage(imageUrl, gameName, platform);

        // Small delay to ensure the file is fully written (optional)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Reload the image
        window.coverDownloader.reloadImage(imgElement, coverPath);
        window.control.updateControlsMenu({ message: `OK: ${gameName} (${platform})` });
    } catch (error) {
        console.error('Error downloading image:', error.message);
        imgElement.src = 'path/to/missing.png'; // Fallback to missing image
    }
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

// async function downloadImage(imageUrl, gameName, platform) {
//     fsy = require('fs').promises; // Use promises for async file operations
//     console.log("downloadImage imageUrl: ", imageUrl);
//     try {
//         const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });

//         // Ensure the directory exists
//         const coversDir = path.join(window.userDataPath, "covers", platform);
//         await fsy.mkdir(coversDir, { recursive: true });

//         // Create a unique file name
//         const timestamp = Date.now();
//         const uniqueFileName = `${gameName}_${timestamp}.jpg`;
//         const coverPath = path.join(coversDir, uniqueFileName);

//         // Convert the ArrayBuffer to a Node.js Buffer and write to disk
//         const coverBuffer = Buffer.from(response.data);
//         await fsy.writeFile(coverPath, coverBuffer);

//         console.log(`Cover downloaded! for ${gameName} (${platform})`);
//         return coverPath;
//     } catch (error) {
//         console.error(`Error downloading cover for ${gameName}:`, error.message);
//         throw error;
//     }
// }


function reloadImage(imgElement, coverPath) {
    // Ensure the image exists before updating the src

    const newSrc = `${coverPath}?t=${Date.now()}`; // Add a timestamp to bypass cache

    // Update the imgElement.src
    imgElement.src = newSrc;
    console.log(`Image reloaded: ${coverPath}`);
}


window.coverDownloader = {
    searchGame: searchGame,
    downloadImage: downloadImage,
    reloadImage: reloadImage,
    downloadAndReload: downloadAndReload
};
