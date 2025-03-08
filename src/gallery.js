LB.gallery = {
    buildGalleries: async function (preferences, userDataPath) {
        return new Promise(async (resolve, reject) => {
            try {
                const galleriesContainer = document.getElementById('galleries');
                let index = 1;

                const platforms = Object.keys(preferences);

                for (const platformName of platforms) {
                    let prefs = preferences[platformName];

                    if (prefs) {
                        let gamesDir = prefs.gamesDir;
                        let emulator = prefs.emulator;
                        let emulatorArgs = prefs.emulatorArgs;
                        let extensions = prefs.extensions;

                        const params = {
                            platform: platformName,
                            gamesDir,
                            emulator,
                            emulatorArgs,
                            userDataPath,
                            index,
                            platforms,
                            extensions
                        };

                        const container = await buildGallery(params); // Await the async buildGallery

                        if (container) {
                            galleriesContainer.appendChild(container);
                        }

                        index++;
                    } else if (platformName === 'settings') {
                        const params = {
                            platform: platformName,
                            gamesDir: 'none',
                            emulator: 'none',
                            emulatorArgs: 'none',
                            userDataPath,
                            index,
                            platforms,
                            extensions: 'none'
                        };

                        const container = await buildGallery(params); // Await the async buildGallery

                        if (container) {
                            galleriesContainer.appendChild(container);
                        }

                        index++;
                    } else {
                        reject('No prefs for ', platformName);
                    }
                }

                resolve(platforms);
            } catch (error) {
                reject(error);
            }
        });
    }
};

// Recursively scan a directory for files with specific extensions.
// If recursive is false, only the top-level directory is scanned.
// If gamesDir is invalid, it returns an empty array.
async function scanDirectory(gamesDir, extensions, recursive = true) {
    let files = [];

    // Validate the gamesDir argument
    if (!gamesDir || typeof gamesDir !== 'string') {
        console.warn("scanDirectory: Invalid directory path provided:", gamesDir);
        return files;
    }

    try {
        const items = await fsp.readdir(gamesDir, { withFileTypes: true });
        for (const item of items) {
            const fullPath = path.join(gamesDir, item.name);
            if (item.isDirectory()) {
                if (recursive) {
                    const subDirFiles = await scanDirectory(fullPath, extensions, recursive);
                    files = files.concat(subDirFiles);
                }
            } else if (extensions.includes(path.extname(item.name).toLowerCase())) {
                files.push(fullPath);
            }
        }
    } catch (err) {
        console.error("Error reading directory:", gamesDir, err);
    }

    return files;
}

const imageFormats = ['jpg', 'png', 'webp'];

function findImageFile(basePath, fileNameWithoutExt) {
    for (const format of imageFormats) {
        const imagePath = path.join(basePath, `${fileNameWithoutExt}.${format}`);
        if (fs.existsSync(imagePath)) {
            return imagePath;
        }
    }
    return null;
}

function buildSettingsPageContent(platforms) {
    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');

    platforms.forEach((platformName) => {
        // if (platformName === "settings") return;

        const platformContainer = document.createElement('div');
        platformContainer.classList.add('game-container');
        platformContainer.title = platformName;
        platformContainer.classList.add('settings');
        platformContainer.setAttribute('data-platform', platformName);

        const platformNameElement = document.createElement('div');
        platformNameElement.textContent = platformName;
        platformNameElement.classList.add('platform-name');

        const platformImage = document.createElement('img');
        platformImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
        platformImage.classList.add('platform-image');
        platformImage.classList.add('game-image');

        // platformContainer.appendChild(platformNameElement);
        platformContainer.appendChild(platformImage);

        pageContent.appendChild(platformContainer);
    });

    return pageContent;
}

// Build the gallery for a specific platform
async function buildGallery(params) {
    const platform = params.platform;
    const gamesDir = params.gamesDir;
    const emulator = params.emulator;
    const emulatorArgs = params.emulatorArgs;
    const userDataPath = params.userDataPath;
    const index = params.index;
    const platforms = params.platforms;
    const extensions = params.extensions;

    if (!gamesDir || !emulator) {
        return null;
    }

    const galleryContainer = document.createElement('div');
    galleryContainer.id = `page-${platform}`;
    galleryContainer.classList.add('gallery');
    galleryContainer.tabindex = -1;

    const page = document.createElement('div');
    page.classList.add('page');
    page.id = `page${index}`;
    page.setAttribute('data-platform', platform);
    page.setAttribute('data-index', index);

    const pagePrevLink = document.createElement('a');
    pagePrevLink.classList.add('page-link');
    pagePrevLink.textContent = "Prev";

    const pageTitle = document.createElement('div');
    pageTitle.classList.add('page-title');
    pageTitle.textContent = platform;

    const pageNextLink = document.createElement('a');
    pageNextLink.classList.add('page-link');
    pageNextLink.textContent = "Next";

    let pageContent;

    if (platform === "settings") {
        pageContent = buildSettingsPageContent(platforms);
    } else {
        pageContent = document.createElement('div');
        pageContent.classList.add('page-content');

        const gameFiles = await scanDirectory(gamesDir, extensions, true);

        function formatTitle(title) {
            if (title.toLowerCase().endsWith(", the")) {
                const prefix = title.slice(0, -5).trim();
                return "The " + prefix;
            }
            return title;
        }

        const viewportWidth = window.innerWidth;
        const columnWidth = viewportWidth / LB.galleryNumOfCols; // Width per column

        // Load all items at once
        for (let i = 0; i < gameFiles.length; i++) {
            const gameFile = gameFiles[i];
            const fileName = path.basename(gameFile);
            const fileNameWithoutExt = path.parse(fileName).name;
            const coverImagePath = findImageFile(path.join(userDataPath, "covers", platform), fileNameWithoutExt);
            const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');

            const isImgExists = fs.existsSync(coverImagePath);

            const gameContainer = document.createElement('div');
            gameContainer.classList.add('game-container');
            gameContainer.title = fileNameWithoutExt;
            gameContainer.setAttribute('data-game-name', fileNameWithoutExt);
            gameContainer.setAttribute('data-platform', platform);
            gameContainer.setAttribute('data-command', `${emulator} ${emulatorArgs || ""} "${gameFile}"`);

            // Set the container size based on the column width
            // gameContainer.style.width = `${columnWidth}px`;
            // gameContainer.style.height = `${columnWidth}px`; // Placeholder height (square)

            gameContainer.addEventListener('click', (event) => {
                event.stopPropagation();
                ipcRenderer.send('run-command', event.target.dataset.command);
            });

            const gameImage = document.createElement('img');
            gameImage.src = isImgExists ? coverImagePath : missingImagePath;
            gameImage.classList.add('game-image');

            if (!isImgExists) {
                gameImage.classList.add('missing-image');
            }

            // Set explicit width and height attributes
            gameImage.width = columnWidth; // Set width attribute
            // gameImage.height = columnWidth; // Set height attribute (placeholder)

            const gameLabel = document.createElement('div');
            gameLabel.classList.add('game-label');
            gameLabel.textContent = fileNameWithoutExt;

            // Set the label width to match the column width
            gameLabel.style.width = `${columnWidth}px`;

            gameContainer.appendChild(gameLabel);
            gameContainer.appendChild(gameImage);
            pageContent.appendChild(gameContainer);

            // Calculate the image height after it loads
            // gameImage.onload = () => {
            //     const aspectRatio = gameImage.naturalWidth / gameImage.naturalHeight; // Calculate aspect ratio
            //     const height = columnWidth / aspectRatio; // Calculate height based on aspect ratio

            //     // Update the image dimensions
            //     gameImage.width = columnWidth;
            //     gameImage.height = height;

            //     // Adjust the container height to match the image height
            //     gameContainer.style.height = `${height}px`;
            // };
        }
    }

    page.appendChild(pageContent);

    return page;
}
