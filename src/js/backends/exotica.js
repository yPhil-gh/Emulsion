// src/js/backends/exotica.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export const fetchImages = async (gameName, platform = '') => {

    console.log("\n");
    console.log(`Searching Exotica for ${gameName} (${platform})`);

    try {
        // Build the Exotica search URL using the first letter of the game name
        const firstLetter = gameName.charAt(0).toUpperCase();
        const exoticaUrl = `https://www.exotica.org.uk/wiki/Amiga_Game_Box_Scans/${firstLetter}`;

        // Fetch the Exotica page
        const searchResponse = await axios.get(exoticaUrl);
        if (searchResponse.status !== 200) return [];

        const $ = cheerio.load(searchResponse.data);

        let gamePageUrl = null;

        // Search for the game in the gallery boxes on the page
        $('.gallerybox').each((_, element) => {
            const galleryText = $(element).find('.gallerytext p').text().trim().toLowerCase();
            const href = $(element).find('a.image').attr('href');

            if (
                galleryText.includes(gameName) ||
                (href && href.toLowerCase().includes(gameName))
            ) {
                gamePageUrl = "https://www.exotica.org.uk/" + href;
                return false; // Break out of the loop
            }
        });

        if (!gamePageUrl) {
            console.error(`[Exotica] No results found on for "${gameName}" (${platform}).`);
            return [];
        }

        const gamePageResponse = await axios.get(gamePageUrl);
        if (gamePageResponse.status !== 200) return [];

        const gamePage$ = cheerio.load(gamePageResponse.data);
        const imageUrl = gamePage$('div.fullImageLink a').attr('href');

        if (!imageUrl) {
            console.error(`[Exotica] No image found for "${gameName}" (${platform}).`);
            return [];
        }

        const parts = imageUrl.split('/');
        const directory = parts[3];
        const subdirectory = parts[4];
        const filesUrl = `https://www.exotica.org.uk/mediawiki/files/${directory}/${subdirectory}/`;
        const fileName = filesUrl + parts.pop();

        return [{
            url: fileName,
            source: 'Exotica'
        }];

    } catch (err) {
        console.error(`[Exotica] Error: ${err.message}`);
        return [];
    }
};
