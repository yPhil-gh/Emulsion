const axios = require('axios');
const cheerio = require('cheerio');

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
