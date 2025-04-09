import SGDB from 'steamgriddb';

/**
 * Fetches an array of cover image URLs for all games matching the given name.
 */
export const getAllCoverImageUrls = async (gameName, APIKey) => {

    // Initialize the SteamGridDB client
    const client = new SGDB({
        key: APIKey,
    });

    try {
        // Search for the game by name
        const games = await client.searchGame(gameName);
        if (!games.length) {
            console.log('No games found for:', gameName);
            return [];
        }

        // Array to store all image URLs
        const allImageUrls = [];

        // Iterate through all matching games
        for (const game of games) {

            // Determine the correct ID to use
            const gameId = game.steam_app_id || game.id; // Use steam_app_id if available, otherwise fallback to id

            const images = await client.getGrids({ type: 'game', id: gameId });

            if (!images.length) {
                console.log(`No cover images found for ${game.name}.`);
                continue; // Skip to the next game
            }

            // Extract the URLs from the images
            const imageUrls = images.map((image) => image.url);

            // Add the URLs to the main array
            allImageUrls.push(...imageUrls);
        }

        return allImageUrls; // Return the array of all image URLs
    } catch (error) {
        console.error('Error fetching grids:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return []; // Return an empty array in case of error
    }
};
