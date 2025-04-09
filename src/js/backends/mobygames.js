// src/js/backends/mobygames.js
import axios from 'axios';
import * as cheerio from 'cheerio'; // It's a CJS thing

export const fetchImages = async (gameName, _apiKey, platform = '') => {

    console.log("gameName, _apiKey, platform: ", gameName, _apiKey, platform);

    try {
        const searchUrl = `https://www.mobygames.com/search/?q=${encodeURIComponent(gameName)}`;
        const searchResponse = await axios.get(searchUrl);

        if (searchResponse.status !== 200) return [];

        const $ = cheerio.load(searchResponse.data);
        const firstHref = $('#main > table a[href]').first().attr('href');

        if (!firstHref) return [];

        // Make sure the URL is correct
        const coversPage = firstHref.startsWith('http')
            ? firstHref
            : `https://www.mobygames.com${firstHref}covers/${platform}`;

        const coversResponse = await axios.get(coversPage);

        if (coversResponse.status !== 200) return [];

        const covers$ = cheerio.load(coversResponse.data);
        const imgSources = [];

        covers$('.img-holder img[src]').each((i, el) => {
            const src = covers$(el).attr('src');
            if (src) {
                imgSources.push(src.startsWith('http') ? src : `https://www.mobygames.com${src}`);
            }
        });

        return imgSources.map((url) => ({
            url,
            source: 'MobyGames'
        }));

    } catch (err) {
        console.error(`[MobyGames] Error: ${err.message}`);
        return [];
    }
};
