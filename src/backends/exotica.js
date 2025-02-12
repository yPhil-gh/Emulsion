const axios = require('axios');
const cheerio = require('cheerio');

async function searchGame(gameName, platform) {
    console.log("Searching Exotica for:", gameName, platform);

    // Extract the first letter of the game name
    const firstLetter = gameName.charAt(0).toUpperCase();
    const exoticaUrl = `https://www.exotica.org.uk/wiki/Amiga_Game_Box_Scans/${firstLetter}`;

    console.log('Exotica URL:', exoticaUrl);

    try {
        // Fetch the Exotica page
        const response = await axios.get(exoticaUrl);
        if (response.status !== 200) {
            throw new Error(`Failed to load page. Status: ${response.status}`);
        }

        const $ = cheerio.load(response.data);

        // Normalize the game name for comparison
        const normalizedGameName = gameName
            .replace(/[_\-]/g, ' ') // Replace underscores and hyphens with spaces
            .replace(/\s*v?\d+\.\d+.*$/i, '') // Remove version numbers (e.g., "v2.7 cd32")
            .trim()
            .toLowerCase();

        console.log('Normalized game name:', normalizedGameName);

        let gamePageUrl = null;

        // Search for the game in the .gallerybox elements
        $('.gallerybox').each((_, element) => {
            const galleryText = $(element).find('.gallerytext p').text().trim().toLowerCase();
            const href = $(element).find('a.image').attr('href');

            // Check if the game name matches either the gallery text or the href
            if (
                galleryText.includes(normalizedGameName) ||
                (href && href.toLowerCase().includes(normalizedGameName))
            ) {
                gamePageUrl = "https://www.exotica.org.uk/" + href;
                return false; // Break the loop
            }
        });

        if (!gamePageUrl) {
            throw new Error(`No results! found for "${gameName}" (${platform}).`);
        }

        console.log('Game Page URL:', gamePageUrl);

        // Fetch the game page to get the full image URL
        const gamePageResponse = await axios.get(gamePageUrl);
        if (gamePageResponse.status !== 200) {
            throw new Error(`Failed to load game page. Status: ${gamePageResponse.status}`);
        }

        const gamePage$ = cheerio.load(gamePageResponse.data);
        const imageUrl = gamePage$('div.fullImageLink a').attr('href');

        console.log("imageUrl: ", imageUrl);

        if (!imageUrl) {
            throw new Error(`No image found for "${gameName}" (${platform}).`);
        }

        const parts = imageUrl.split('/');
        const directory = parts[3]; // "0"
        const subdirectory = parts[4]; // "05"

        const result = `${directory}/${subdirectory}`; // "0/05"
        console.log("result: ", result);

        const filesUrl = `https://www.exotica.org.uk/mediawiki/files/${directory}/${subdirectory}/`;

        const fileName = filesUrl + parts.pop();

        console.log("fileName: ", fileName);

        return { title: gameName, imgSrcArray: [ fileName ] };
    } catch (error) {
        console.info(`Error searching for "${gameName}":`, error.message);
        throw error;
    }
}

module.exports = { searchGame };
