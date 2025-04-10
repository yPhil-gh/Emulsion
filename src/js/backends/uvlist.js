// src/js/backends/uvlist.js
import axios from 'axios';
import * as cheerio from 'cheerio'; // CommonJS shim

export const fetchImages = async (gameName, platform = '') => {
    console.log("\n");
    console.log(`Searching UVList for ${gameName} (${platform})`);

    try {
        const searchUrl = `https://www.uvlist.net/globalsearch/?t=${encodeURIComponent(gameName)}`;
        const searchResponse = await axios.get(searchUrl);
        if (searchResponse.status !== 200) return [];

        const $ = cheerio.load(searchResponse.data);

        const href = $(`tr:has(span.badge-companies.${getCompanyClass(platform)})`)
            .find(`a:contains(${gameName})`)
            .attr('href');

        if (!href) return [];

        const gameUrl = `https://www.uvlist.net${href}`;
        const gameResponse = await axios.get(gameUrl);
        if (gameResponse.status !== 200) return [];

        const game$ = cheerio.load(gameResponse.data);
        const imgSources = [];

        const colGoldImgs = game$('div.col_gold1 img[data-background-image]');
        if (colGoldImgs.length) {
            colGoldImgs.each((i, el) => {
                const src = game$(el).attr('data-background-image');
                if (src) imgSources.push(src.startsWith('http') ? src : `https://www.uvlist.net${src}`);
            });
        } else {
            const fallbackSrc = game$('div.mainImage img').attr('src');
            if (fallbackSrc) imgSources.push(fallbackSrc.startsWith('http') ? fallbackSrc : `https://www.uvlist.net${fallbackSrc}`);
        }

        return imgSources.map(url => ({
            url,
            source: 'UVList'
        }));

    } catch (err) {
        console.error(`[UVList] Error: ${err.message}`);
        return [];
    }
};

function getCompanyClass(platform) {
    switch (platform) {
        case 'pcengine':
            return 'comp_nec';
        case 'gamecube':
            return 'comp_ninte';
        case 'dreamcast':
            return 'comp_sega';
        default:
            return 'comp_ninte';
    }
}
