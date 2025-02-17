const axios = require('axios');
const cheerio = require('cheerio');

async function searchGame(gameName, platform) {
    console.log("Searching UVList for:", gameName, platform);

    const nameParts = gameName.split(' ');
    let searchResults = null;

    for (let i = nameParts.length; i >= 1; i--) {
        const partialName = nameParts.slice(0, i).join(' ');
        console.log(`Trying search with: "${partialName}"`);

        try {
            const formattedName = sanitizeGameName(partialName);
            const searchUrl = `https://www.uvlist.net/globalsearch/?t=${formattedName}`;

            console.log('Search URL:', searchUrl);

            const response = await axios.get(searchUrl);
            if (response.status !== 200) {
                throw new Error(`Failed to load page. Status: ${response.status}`);
            }

            const resultsPage$ = cheerio.load(response.data);
            const resultsPageTitle = resultsPage$('title').text();
            console.log("title: ", resultsPageTitle);

            const targetRow = resultsPage$('span.badge-companies.comp_ninte').closest('tr');
            const gamePageUrl = resultsPage$(`span.badge-companies.${getCompanyclass(platform)}`)
                .closest('tr')
                .find('a')
                .attr('href');

            if (!gamePageUrl) {
                console.log(`No results found for "${partialName}" (${platform}).`);
                continue;
            }

            console.log('Game Page URL:', gamePageUrl);

            const gamePageResponse = await axios.get(`https://www.uvlist.net${gamePageUrl}`);
            if (gamePageResponse.status !== 200) {
                throw new Error(`Failed to load game page. Status: ${gamePageResponse.status}`);
            }

            const gamePage$ = cheerio.load(gamePageResponse.data);
            const gamePageTitle = gamePage$('title').text();
            console.log("title: ", gamePageTitle);

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

            searchResults = { title: gamePageTitle, imgSrcArray };
            break;
        } catch (error) {
            console.error(`Error searching for "${partialName}":`, error.message);
            continue;
        }
    }

    if (!searchResults) {
        throw new Error(`No results found for "${gameName}" (${platform})`);
    }

    return searchResults;
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

function sanitizeGameName(name) {
    return encodeURIComponent(name);
}

module.exports = { searchGame };
