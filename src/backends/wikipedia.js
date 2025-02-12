const axios = require('axios');
const cheerio = require('cheerio');

async function gameDetails(filename) {
    console.log("object: ");
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

    console.log("finalName: ", finalName);

    // Step 6: Return the result as an array of objects
    return { name: finalName, platform: platform } ;
}

async function searchGame(gameName, platform) {
    console.log("Searching Wikipedia for:", gameName, platform);

    const firstLetter = gameName.charAt(0).toUpperCase();
    const categoryUrl = `https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers&from=${firstLetter}`;

    console.log('Category URL:', categoryUrl);

    const details = await gameDetails(gameName);
    console.log("gameDetails.name: ", details.name);

    try {
        const response = await axios.get(categoryUrl);
        if (response.status !== 200) {
            throw new Error(`Failed to load the "${firstLetter}" page. Status: ${response.status}`);
        }

        const categoryPage$ = cheerio.load(response.data);
        const links = categoryPage$('div.mw-category-group:nth-child(1) a');

        let gamePageUrl = null;
        links.each((_, element) => {
            const href = categoryPage$(element).attr('href');
            const title = categoryPage$(element).attr('title');
            console.log(`href: ${href}, details.name: ${details.name}`);


            if (href && title) {
                // Normalize the href and gameName for comparison
                const normalizedHref = href
                    .replace('/wiki/File:', '')
                    .replace(/_Coverart\.png$/i, '')
                    .replace(/_/g, ' ')
                    .toLowerCase();

                // Extract the base game name (e.g., remove "v2.7 cd32" from "Syndicate_v2.7_CD32")
                const baseGameName = gameName
                    .replace(/[_\-]/g, ' ') // Replace underscores and hyphens with spaces
                    .replace(/\s*v?\d+\.\d+.*$/i, '') // Remove version numbers (e.g., "v2.7 cd32")
                    .trim()
                    .toLowerCase();

                console.log(`Normalized href: ${normalizedHref}, Base game name: ${baseGameName}`);

                // Use includes for partial matching
                if (normalizedHref.includes(baseGameName)) {
                    gamePageUrl = href;
                    return false; // Break the loop
                }
            }
        });

        if (!gamePageUrl) {
            throw new Error(`No results found for "${details.name}" (${platform}).`);
        }

        console.log('Game Page URL:', gamePageUrl);

        const gamePageResponse = await axios.get(`https://en.wikipedia.org${gamePageUrl}`);
        if (gamePageResponse.status !== 200) {
            throw new Error(`Failed to load game page. Status: ${gamePageResponse.status}`);
        }

        const gamePage$ = cheerio.load(gamePageResponse.data);
        const imageUrl = gamePage$('div.fullImageLink a').attr('href');

        if (!imageUrl) {
            throw new Error(`No image found for "${details.name}" (${platform}).`);
        }

        console.log('Image URL:', imageUrl);

        return { title: gameName, imgSrcArray: [`https:${imageUrl}`] };
    } catch (error) {
        console.error(`Error searching for "${details.name}" ("${gameName}"):`, error.message);
        throw error;
    }
}

module.exports = { searchGame };
