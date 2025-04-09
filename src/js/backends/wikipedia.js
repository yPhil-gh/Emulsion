// src/js/backends/wikipedia.js
import axios from 'axios';
import * as cheerio from 'cheerio';

export const fetchImages = async (gameName, platform = '') => {

    console.log("\n");
    console.log(`Searching Wikipedia for ${gameName} (${platform})`);

    try {
        const firstLetter = gameName.charAt(0).toUpperCase();
        const categoryUrl = `https://en.wikipedia.org/w/index.php?title=Category:Amiga_game_covers&from=${firstLetter}`;

        const searchResponse = await axios.get(categoryUrl);
        if (searchResponse.status !== 200) return [];

        const $ = cheerio.load(searchResponse.data);
        const baseGameName = gameName
            .replace(/\s*v?\d+\.\d+.*$/i, '')
            .toLowerCase();

        let gamePagePath = null;

        // Search through category links
        $('div.mw-category-group a').each((i, el) => {
            const href = $(el).attr('href') || '';
            const title = $(el).attr('title') || '';

            const normalized = href
                .replace('/wiki/File:', '')
                .replace(/_Coverart\.png$/i, '')
                .replace(/_/g, ' ')
                .toLowerCase();

            if (normalized.includes(baseGameName) ||
               title.toLowerCase().includes(baseGameName)) {
                gamePagePath = href;
                return false; // Break loop
            }
        });

        if (!gamePagePath) return [];

        // Fetch image page
        const gamePageUrl = `https://en.wikipedia.org${gamePagePath}`;
        const gamePageResponse = await axios.get(gamePageUrl);
        if (gamePageResponse.status !== 200) return [];

        const gamePage$ = cheerio.load(gamePageResponse.data);
        const imgSources = [];

        // Extract all full-resolution images
        gamePage$('div.fullImageLink a').each((i, el) => {
            const href = gamePage$(el).attr('href');
            if (href) {
                imgSources.push(href.startsWith('//')
                    ? `https:${href}`
                    : href
                );
            }
        });

        return imgSources.map(url => ({
            url,
            source: 'Wikipedia'
        }));

    } catch (err) {
        console.error(`[Wikipedia] Error: ${err.message}`);
        return [];
    }
};
