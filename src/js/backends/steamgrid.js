import SGDB from 'steamgriddb';

export const fetchImages = async (gameName, APIKey, platform) => {
    const client = new SGDB({ key: APIKey });

    try {
        const games = await client.searchGame(gameName);
        if (!games.length) return [];

        const allUrls = [];

        for (const game of games) {
            const gameId = game.steam_app_id || game.id;
            const images = await client.getGrids({ type: 'game', id: gameId });
            allUrls.push(...images.map(img => img.url));
        }

        return allUrls;
    } catch (err) {
        console.error('SteamGridDB error:', err.message);
        return [];
    }
};
