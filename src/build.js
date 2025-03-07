function buildGameMenu(gameName, gameImage) {

    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('game-menu-container');

    const gameMenuImgDiv = document.createElement('div');
    gameMenuImgDiv.classList.add('game-menu-image-div');

    const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');

    const gameMenuImg = document.createElement('img');
    gameMenuImg.classList.add('game-menu-image');

    gameMenuImgDiv.appendChild(gameMenuImg);

    gameMenuImg.src = gameImage.src;
    const gameMenuFetchButton = document.createElement('button');
    gameMenuFetchButton.classList.add('game-menu-fetch-button');
    gameMenuFetchButton.classList.add('info');
    gameMenuFetchButton.textContent = "Fetch cover image";

    const gameMenuControls = document.createElement('div');
    gameMenuControls.classList.add('game-menu-controls');

    gameMenuControls.appendChild(gameMenuFetchButton);

    gameMenuContainer.appendChild(gameMenuImgDiv);
    gameMenuContainer.appendChild(gameMenuControls);

    return gameMenuContainer;
}

LB.build = {
    gameMenu: buildGameMenu
};
