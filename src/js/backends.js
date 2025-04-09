import { fetchImages as steamgridFetch } from './backends/steamgrid.js';
import { fetchImages as mobygamesFetch } from './backends/mobygames.js';
import { fetchImages as exoticaFetch } from './backends/exotica.js';
import { fetchImages as wikipediaFetch } from './backends/wikipedia.js';
import { fetchImages as commonsFetch } from './backends/commons.js';

export const getAllCoverImageUrls = async (gameName, platform, options = {}) => {
    const { steamGridKey } = options;

    const backends = [];

    if (steamGridKey) {
        backends.push(() => steamgridFetch(gameName, steamGridKey));
    }

    backends.push(() => mobygamesFetch(gameName, platform));
    backends.push(() => exoticaFetch(gameName, platform));
    backends.push(() => commonsFetch(gameName, platform));

    if (platform === 'amiga') {
        backends.push(() => wikipediaFetch(gameName, platform));
    }

    const allResults = await Promise.allSettled(backends.map(fn => fn()));

    const allImages = allResults.flatMap(result =>
        result.status === 'fulfilled' ? result.value : []
    );

    return allImages.flat();

};
