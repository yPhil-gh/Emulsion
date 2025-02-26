const axios = require('axios');
const cheerio = require('cheerio');

async function searchGame(gameName, platform) {
    console.log("Searching UVList for:", gameName);

    let searchResults = null;

    try {
        const searchUrl = `https://www.uvlist.net/globalsearch/?t=${encodeURIComponent(gameName)}`;

        const response = await axios.get(searchUrl);

        if (response.status !== 200) {
            throw new Error(`Failed to load page. Status: ${response.status}`);
        }

        const resultsPage$ = cheerio.load(response.data);

        const href = resultsPage$(`tr:has(span.badge-companies.${getCompanyclass(platform)})`)
              .find(`a:contains(${gameName})`)
              .attr('href');

        if (!href) {
            return null;
        }

        const gamePageResponse = await axios.get(`https://www.uvlist.net${href}`);
        if (gamePageResponse.status !== 200) {
            throw new Error(`Failed to load game page. Status: ${gamePageResponse.status}`);
        }

        const gamePage$ = cheerio.load(gamePageResponse.data);
        const gamePageTitle = gamePage$('title').text();

        let imgSrcArray = [];
        const colGold1Images = gamePage$('div.col_gold1 img')
              .map((_, img) => gamePage$(img).attr('data-background-image'))
              .get();

        if (colGold1Images.length > 0) {
            imgSrcArray = colGold1Images;
        } else {
            const mainImageSrc = gamePage$('div.mainImage img').attr('src');
            if (mainImageSrc) {
                imgSrcArray.push(mainImageSrc);
            }
        }

        return { title: gamePageTitle, imgSrcArray };
    } catch (error) {
        console.error(`Error searching for "${gameName}":`, error.message);
    }

    // if (!searchResults) {
    //     throw new Error(`No results found for "${gameName}" (${platform})`);
    // }

    // return searchResults;
}

function getCompanyclass(platform) {
    switch (platform) {
    case "pcengine":
        return "comp_nec";
    case "gamecube":
        return "comp_ninte";
    case "dreamcast":
        return "comp_sega";
    default:
        return "comp_ninte";
    }
}

module.exports = { searchGame };
