// src/js/backends/commons.js
import axios from 'axios';

export const fetchImages = async (gameName, platform = '') => {

    console.log("\n");
    console.log("Searching Wikimedia commons for ", gameName, platform);

    try {
        const apiUrl = new URL('https://commons.wikimedia.org/w/api.php');
        apiUrl.searchParams.append('action', 'query');
        apiUrl.searchParams.append('list', 'search');
        apiUrl.searchParams.append('srsearch', `${gameName} video game cover`);
        apiUrl.searchParams.append('srnamespace', '6'); // File namespace
        apiUrl.searchParams.append('srlimit', '20');
        apiUrl.searchParams.append('format', 'json');

        const response = await axios.get(apiUrl.toString());
        if (response.status !== 200) {
            console.warn(`[Wikimedia Commons] Non-200 response for: ${gameName}`);
            return [];
        }

        const results = response.data?.query?.search || [];
        if (results.length === 0) {
            console.info(`[Wikimedia Commons] No images found for: "${gameName}" (${platform})`);
            return [];
        }

        const imgSources = results.reduce((acc, item) => {
            if (item.title.startsWith('File:')) {
                const filename = encodeURIComponent(item.title.slice(5)); // Remove "File:" prefix
                acc.push(`https://commons.wikimedia.org/wiki/Special:Redirect/file/${filename}`);
            }
            return acc;
        }, []);

        if (imgSources.length > 0) {
            console.info(`[Wikimedia Commons] Found ${imgSources.length} image(s) for: "${gameName}"`);
        } else {
            console.info(`[Wikimedia Commons] No valid image URLs extracted for: "${gameName}"`);
        }

        return imgSources.map(url => ({
            url,
            source: 'Wikimedia Commons',
            metadata: {
                isCoverArt: url.toLowerCase().includes('cover'),
                isBoxArt: url.toLowerCase().match(/box|package|case/)
            }
        }));

    } catch (err) {
        console.error(`[Wikimedia Commons] Error for "${gameName}": ${err.message}`);
        return [];
    }
};
