const axios = require('axios');
const cheerio = require('cheerio');

function gameDetails(filename) {
    // Step 1: Remove the file extension (.lha)
    const withoutExtension = filename.replace(/\.lha$/, '');

    // Step 2: Extract the platform (CD32 or AGA)
    let platform = null;
    if (withoutExtension.includes('_CD32_')) {
        platform = 'CD32';
    } else if (withoutExtension.includes('_AGA_')) {
        platform = 'AGA';
    }

    // Step 3: Remove version numbers and other suffixes (e.g., _v2.6_AGA_0173)
    const withoutSuffixes = withoutExtension.replace(/_.+$/, ''); // Remove everything after the first underscore

    // Step 4: Insert spaces before capital letters (e.g., "ChaosEngine2" -> "Chaos Engine 2")
    // Preserve "3D" and "II" as single units
    const formattedName = withoutSuffixes
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert spaces between lowercase and uppercase letters
        .replace(/(\d)([A-Za-z])/g, '$1$2') // Preserve "3D" as a single unit
        .replace(/([A-Za-z])(\d)/g, '$1 $2') // Separate numbers from letters (e.g., "Engine2" -> "Engine 2")
        .trim();

    // Step 5: Handle edge cases (e.g., "ChaosEngine2" -> "Chaos Engine 2")
    const finalName = formattedName
        .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
        .trim();

    // Step 6: Return the result as an array of objects
    return [
        {
            name: finalName,
            platform: platform
        }
    ];
}

async function searchGame(gameName, platform) {
    console.log("Searching Lemon Amiga for:", gameName, platform);

    // Implement Lemon Amiga-specific search logic here
    // Example:
    const searchUrl = `https://www.lemonamiga.com/games/list.php?list_title=${encodeURIComponent(gameName)}`;

    try {
        const response = await axios.get(searchUrl);
        if (response.status !== 200) {
            throw new Error(`Failed to load page. Status: ${response.status}`);
        }

        const $ = cheerio.load(response.data);
        const gamePageUrl = $('a[href^="/games/details.php"]').first().attr('href');

        if (!gamePageUrl) {
            throw new Error(`No results found for "${gameName}"`);
        }

        const gamePageResponse = await axios.get(`https://www.lemonamiga.com${gamePageUrl}`);
        if (gamePageResponse.status !== 200) {
            throw new Error(`Failed to load game page. Status: ${gamePageResponse.status}`);
        }

        const gamePage$ = cheerio.load(gamePageResponse.data);
        const imageUrl = gamePage$('img.game-cover').attr('src');

        if (!imageUrl) {
            throw new Error(`No cover image found for "${gameName}"`);
        }

        return { title: gameName, imgSrcArray: [imageUrl] };
    } catch (error) {
        console.error(`Error searching Lemon Amiga:`, error.message);
        throw error;
    }
}

module.exports = { searchGame };
