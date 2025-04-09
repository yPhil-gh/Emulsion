import { fetchImages as steamgridFetch } from './backends/steamgrid.js';
import { fetchImages as mobygamesFetch } from './backends/mobygames.js';

export const getAllCoverImageUrls = async (gameName, platform, options = {}) => {
    const { steamGridKey } = options;

    const backends = [];

    if (steamGridKey) {
        backends.push(() => steamgridFetch(gameName, steamGridKey));
    }

    // MobyGames doesn't need an API key
    backends.push(() => mobygamesFetch(gameName, null, platform));

    const allResults = await Promise.allSettled(backends.map(fn => fn()));

    const allImages = allResults.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    return allImages.flat();

};
