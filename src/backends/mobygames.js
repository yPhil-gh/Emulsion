const axios = require('axios');
const cheerio = require('cheerio');

async function searchGame(gameName, platform) {
    console.log("Searching UVList for:", gameName);

    try {
        const searchUrl = `https://www.mobygames.com/search/?q=${encodeURIComponent(gameName)}`;

        const response = await axios.get(searchUrl);

        if (response.status !== 200) {
            throw new Error(`Failed to load page. Status: ${response.status}`);
        }

        const resultsPage$ = cheerio.load(response.data);

        const firstHref = resultsPage$('#main > table a[href]').first().attr('href');

        console.log("firstHref: ", firstHref);

        const platormCoverPage = `${firstHref}covers/${platform}`;

        console.log("trying: ", platormCoverPage);

        let coversPage$;

        const coversResponse = await axios.get(platormCoverPage);

        if (coversResponse.status !== 200) {
            throw new Error(`Failed to load platform cover page. Status: ${coversResponse.status}`);
        }

        coversPage$ = cheerio.load(coversResponse.data);

        const imgSources = [];
        coversPage$('.img-holder img[src]').each((index, element) => {
            const src = coversPage$(element).attr('src');
            imgSources.push(src);
        });

        return { title: "plop", imgSrcArray: imgSources };
    } catch (error) {
        console.error(`Error searching for "${gameName}":`, error.message);
    }
    return null;
}

module.exports = { searchGame };
