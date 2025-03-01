const axios = require('axios');
const backends = {
    amiga: { module: require('./src/backends/exotica.js'), name: 'Exotica' },
    // amiga: { module: require('./src/backends/lemonamiga.js'), name: 'LemonAmiga' },
    gamecube: { module: require('./src/backends/uvlist.js'), name: 'UVList' },
    // dreamcast: { module: require('./src/backends/uvlist.js'), name: 'UVList' },
    dreamcast: { module: require('./src/backends/mobygames.js'), name: 'MobyGames' },
    default: { module: require('./src/backends/uvlist.js'), name: 'UVList' }
};

function cleanFileName(filename) {

  filename = filename.replace(/\.[^/.]+$/, ""); // Remove file extension (if any)

  const parts = filename.split("_"); // Split into parts based on underscores

  // Filter out unwanted parts: always keep the first part (game name)
  // and tokens that are exactly "AGA", "CD32", "3D", or "2D"
  const filteredParts = parts.filter((part, index) => {
    return index === 0 || ["AGA", "CD32", "3D", "2D"].includes(part);
  });

  // Remove version numbers (e.g., "v1.1") and numeric ID parts (e.g., "0280")
  const cleanedParts = filteredParts
    .map((part) => part.replace(/^v\d+\.\d+$/, ""))
    .filter((part) => !/^\d{3,}$/.test(part))
    .filter((part) => part !== "");

  // Process each part for proper spacing and capitalization
  const processedParts = cleanedParts.map((part) => {
    // If the part is exactly one of the protected tokens, leave it unchanged.
    if (["AGA", "CD32", "3D", "2D"].includes(part)) {
      return part;
    }
    // Isolate "3D" and "2D" occurrences by surrounding them with spaces.
    let modifiedPart = part.replace(/(3D|2D)/g, ' $1 ');
    // Ensure there's a space between a lowercase letter and an uppercase letter or digit.
    modifiedPart = modifiedPart.replace(/([a-z])([A-Z0-9])/g, '$1 $2').trim();
    // Capitalize the first letter of each resulting word.
    return modifiedPart
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  });

  // Join all processed parts with a space
  return processedParts.join(" ");
}

async function searchGame(gameName, platform) {
    console.log("gameName, platform: ", gameName, platform);
    const backend = backends[platform] || backends.default;

    const cleanName = cleanFileName(gameName);

    console.log(`Using backend ${backend.name} to search for ${cleanName} (${platform})`);

    const nameParts = cleanName.split(' ');
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
    console.log("imageUrl, gameName, platform, imgElement: ", imageUrl, gameName, platform, imgElement);
    try {
        const coverPath = await window.coverDownloader.downloadImage(imageUrl, gameName, platform);

        // Small delay to ensure the file is fully written (optional)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Reload the image
        window.coverDownloader.reloadImage(imgElement, coverPath);
        window.control.updateControlsMenu({ message: `OK: ${gameName} (${platform})` });
    } catch (error) {
        console.error('Error downloading image:', error.message);
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

function reloadImage(imgElement, coverPath) {
    // Ensure the image exists before updating the src
    const newSrc = `${coverPath}?t=${Date.now()}`; // Add a timestamp to bypass cache

    imgElement.src = newSrc;
    console.log(`Image reloaded: ${coverPath}`);
}

window.coverDownloader = {
    searchGame: searchGame,
    downloadImage: downloadImage,
    reloadImage: reloadImage,
    downloadAndReload: downloadAndReload
};
