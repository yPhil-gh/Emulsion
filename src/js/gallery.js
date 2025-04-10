
// LB.gallery.buildGalleries now also builds the "recent" gallery
LB.gallery = {
    buildGalleries: async function (preferences, userDataPath) {
        return new Promise(async (resolve, reject) => {
            try {
                const galleriesContainer = document.getElementById('galleries');
                let i = 0; // current page index
                const platforms = Object.keys(preferences);

                // Build regular galleries from each platform/sheet in preferences
                for (const platformName of platforms) {
                    let prefs = preferences[platformName];

                    if (prefs) {
                        // Build regular gallery for platform (including settings)
                        let gamesDir, emulator, emulatorArgs, extensions, isEnabled, index;
                        if (platformName === 'settings') {
                            gamesDir = 'none';
                            emulator = 'none';
                            emulatorArgs = 'none';
                            extensions = 'none';
                            index = i;
                        } else {
                            gamesDir = prefs.gamesDir;
                            emulator = prefs.emulator;
                            emulatorArgs = prefs.emulatorArgs;
                            extensions = prefs.extensions;
                            isEnabled = prefs.isEnabled;
                            // Use the index defined in the preferences for that platform
                            index = prefs.index;
                        }
                        const params = {
                            platform: platformName,
                            gamesDir,
                            emulator,
                            emulatorArgs,
                            userDataPath,
                            index: index,
                            platforms,
                            extensions,
                            isEnabled
                        };

                        const container = await buildGallery(params);
                        if (container) {
                            galleriesContainer.appendChild(container);
                            i++; // increment page index as we added a page
                        }

                        if (platformName !== 'settings' && prefs.isEnabled) {
                            LB.enabledPlatforms.push(platformName);
                        }
                    } else if (platformName === 'settings') {
                        const params = {
                            platform: platformName,
                            gamesDir: 'none',
                            emulator: 'none',
                            emulatorArgs: 'none',
                            userDataPath,
                            index: i,
                            platforms,
                            extensions: 'none'
                        };
                        const container = await buildGallery(params);
                        if (container) {
                            galleriesContainer.appendChild(container);
                        }
                        i++;
                    } else {
                        reject('No prefs for ' + platformName);
                    }
                }

                // If preferences.settings.showRecent is true, build and append the recent gallery
                if (preferences.settings.showRecent) {
                    const recentGallery = await _buildRecentGallery({ userDataPath, index: i });
                    if (recentGallery) {
                        galleriesContainer.appendChild(recentGallery);
                        i++;
                    }
                    platforms.push("recents");
                }

                resolve(platforms);
            } catch (error) {
                reject(error);
            }
        });
    }
};

// Internal function that builds the "Recently Played" gallery page.
async function _buildRecentGallery({ userDataPath, index }) {
    // Path to your recently_played.json file
    let recents = LB.recents;

    if (!recents || recents.length === 0) {
        console.log("No recent entries found.");
        return null;
    }

    // Create the main page container for the "recent" gallery
    const page = document.createElement('div');
    page.classList.add('page');
    page.id = `page${index}`;
    page.setAttribute('data-index', index);
    page.setAttribute('data-platform', 'recent');

    // Create the page content container with grid layout
    const pageContent = document.createElement('div');
    pageContent.classList.add('page-content');
    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    // For each recent entry, create a game container
    recents.forEach((recent, i) => {

        const gameContainer = document.createElement('div');
        gameContainer.classList.add('game-container');
        // Use the same dangerous height logic
        gameContainer.style.height = `calc(120vw / ${LB.galleryNumOfCols})`;
        gameContainer.title = recent.gameName;

        gameContainer.setAttribute('data-game-name', recent.gameName);
        gameContainer.setAttribute('data-platform', recent.platform);
        gameContainer.setAttribute('data-emulator', recent.emulator);
        gameContainer.setAttribute('data-emulator-args', recent.emulatorArgs);
        gameContainer.setAttribute('data-game-path', recent.filePath);
        gameContainer.setAttribute('data-index', i);

        let coverImagePath = findImageFile(
            path.join(userDataPath, "covers", recent.platform),
            recent.fileName
        );
        const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');
        const isImgExists = (coverImagePath && fs.existsSync(coverImagePath));
        const gameImage = document.createElement('img');
        gameImage.src = isImgExists ? coverImagePath : missingImagePath;
        gameImage.classList.add('game-image');
        if (!isImgExists) {
            gameImage.classList.add('missing-image');
        }

        const viewportWidth = window.innerWidth;
        const columnWidth = viewportWidth / LB.galleryNumOfCols;
        gameImage.width = columnWidth;

        const gameLabel = document.createElement('div');
        gameLabel.classList.add('game-label');
        gameLabel.textContent = recent.gameName;

        gameContainer.appendChild(gameLabel);
        gameContainer.appendChild(gameImage);
        pageContent.appendChild(gameContainer);
    });

    page.appendChild(pageContent);
    return page;
}

// Recursively scan a directory for files with specific extensions.
// If recursive is false, only the top-level directory is scanned.
// If gamesDir is invalid, it returns an empty array.
async function scanDirectory(gamesDir, extensions, recursive = true, ignoredDirs = ['PS3_EXTRA', 'PKGDIR', 'freezer', 'tmp']) {
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

            // Skip ignored directories
            if (item.isDirectory()) {
                if (ignoredDirs.includes(item.name)) {
                    console.log(`Skipping ignored directory: ${fullPath}`);
                    continue;
                }

                if (recursive) {
                    const subDirFiles = await scanDirectory(fullPath, extensions, recursive, ignoredDirs);
                    files = files.concat(subDirFiles);
                }
            } else if (extensions.includes(path.extname(item.name))) {
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

    pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;

    let i = 0;
    platforms.forEach((platformName) => {
        // if (platformName === "settings") return;

        const platformContainer = document.createElement('div');
        platformContainer.classList.add('game-container', 'platform-container');
        platformContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';

        platformContainer.title = platformName;
        platformContainer.classList.add('settings');
        platformContainer.setAttribute('data-platform', platformName);
        platformContainer.setAttribute('data-index', i);

        const platformNameElement = document.createElement('div');
        platformNameElement.textContent = platformName;
        platformNameElement.classList.add('platform-name');

        const platformImage = document.createElement('img');

        if (platformName === 'settings') {
            platformImage.src = path.join(LB.baseDir, 'img', 'emulsion.png');
        } else {
            platformImage.src = path.join(LB.baseDir, 'img', 'platforms', `${platformName}.png`);
        }

        platformImage.classList.add('platform-image');
        platformImage.classList.add('game-image');

        // platformContainer.appendChild(platformNameElement);
        platformContainer.appendChild(platformImage);

        pageContent.appendChild(platformContainer);
        i++;
    });

    return pageContent;
}

// Build the gallery for a specific platform
async function buildGallery(params) {

    if (LB.kidsMode && params.platform === 'settings') {
        return null;
    }

    const platform = params.platform;
    const gamesDir = params.gamesDir;
    const emulator = params.emulator;
    const emulatorArgs = params.emulatorArgs;
    const userDataPath = params.userDataPath;
    const index = params.index;
    const platforms = params.platforms;
    const extensions = params.extensions;
    const isEnabled = params.isEnabled;

    const galleryContainer = document.createElement('div');
    galleryContainer.id = `page-${platform}`;
    galleryContainer.classList.add('gallery');
    galleryContainer.tabindex = -1;

    const page = document.createElement('div');
    page.classList.add('page');
    page.id = `page${index}`;
    page.setAttribute('data-index', index);
    page.setAttribute('data-platform', platform);

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

        pageContent.style.gridTemplateColumns = `repeat(${LB.galleryNumOfCols}, 1fr)`;


        if (!isEnabled) {
            pageContent.textContent = 'EMPTY';

            const gameContainer = document.createElement('div');
            gameContainer.classList.add('game-container');
            gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
            gameContainer.title = 'Empty';
            gameContainer.setAttribute('data-platform', platform);

            pageContent.appendChild(gameContainer);
            page.setAttribute('data-status', 'disabled');
            page.appendChild(pageContent);
            page.classList.add('disabled');
            return page;
        }

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

        console.log("platform: ", platform);

        function getEbootPath(gameFile) {
            const gameDir = path.dirname(gameFile); // Get the directory of the game file
            return path.join(gameDir, 'USRDIR', 'EBOOT.BIN'); // Append the relative path
        }

        async function getPs3GameTitle(filePath) {
            try {
                return await ipcRenderer.invoke('parse-sfo', filePath);
            } catch (error) {
                console.error('Failed to parse SFO:', error);
                return null;
            }
        }

        if (gameFiles.length > 0) {
            for (let i = 0; i < gameFiles.length; i++) {
                const gameFilePath = gameFiles[i];
                // console.log("gameFile: ", gameFile);
                const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');

                let fileName = path.basename(gameFilePath);
                let fileNameWithoutExt = path.parse(fileName).name;
                let fileNameClean = LB.utils.cleanFileName(fileNameWithoutExt);

                let dataCommand = `${emulator} ${emulatorArgs || ""} "${gameFilePath}"`;

                if (platform === 'ps3') {
                    const ps3GameTitle = await getPs3GameTitle(gameFilePath);
                    fileNameWithoutExt = LB.utils.safeFileName(ps3GameTitle);
                    fileNameClean = ps3GameTitle;
                    dataCommand = `${emulator} ${emulatorArgs || ""} "${getEbootPath(gameFilePath)}"`;
                }

                let coverImagePath = findImageFile(path.join(userDataPath, "covers", platform), fileNameWithoutExt);

                const isImgExists = fs.existsSync(coverImagePath);

                const gameContainer = document.createElement('div');
                gameContainer.classList.add('game-container');
                gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
                gameContainer.title = fileNameClean;
                gameContainer.setAttribute('data-game-name', fileNameWithoutExt);
                gameContainer.setAttribute('data-platform', platform);
                gameContainer.setAttribute('data-command', dataCommand);
                gameContainer.setAttribute('data-emulator', emulator);
                gameContainer.setAttribute('data-emulator-args', emulatorArgs);
                gameContainer.setAttribute('data-game-path', gameFilePath);
                gameContainer.setAttribute('data-index', i);

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
                gameLabel.textContent = fileNameClean;

                gameContainer.appendChild(gameLabel);
                gameContainer.appendChild(gameImage);
                pageContent.appendChild(gameContainer);
            }
        } else {

            const gameContainer = document.createElement('div');
            gameContainer.classList.add('game-container', 'empty-platform-game-container');
            // gameContainer.style.height = 'calc(120vw / ' + LB.galleryNumOfCols + ')';
            // gameContainer.style.gridColumn = `1 / span ${LB.galleryNumOfCols}`;
            // gameContainer.style.gridColumn = `2 / calc(${LB.galleryNumOfCols} - 1)`;
            // gameContainer.style.gridColumn = `calc(${LB.galleryNumOfCols} / 2) / span 2`;
            gameContainer.style.gridColumn = `1 / span 2`;

            gameContainer.innerHTML = `<p><i class="fa fa-heartbeat fa-5x" aria-hidden="true"></i></p><p>No game files found in</p><p><code>${gamesDir}</code></p>`;
            pageContent.appendChild(gameContainer);

        }

    }

    page.appendChild(pageContent);

    return page;
}
