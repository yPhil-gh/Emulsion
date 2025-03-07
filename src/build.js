function buildGameMenu(gameName) {

    const gameMenuContainer = document.createElement('div');
    gameMenuContainer.classList.add('game-menu-container');

    const gameMenuImgDiv = document.createElement('div');
    gameMenuImgDiv.classList.add('game-menu-image');

    const missingImagePath = path.join(LB.baseDir, 'img', 'missing.png');

    const gameMenuImg = document.createElement('img');
    gameMenuImg.classList.add('game-menu-image');

    gameMenuImgDiv.appendChild(gameMenuImg);

    gameMenuImg.src = missingImagePath;
    const gameMenuFetchButton = document.createElement('button');
    gameMenuFetchButton.classList.add('game-menu-fetch-button');
    gameMenuFetchButton.textContent = "Fetch cover image";

    const gameMenuControls = document.createElement('div');
    gameMenuControls.classList.add('game-menu-controls');

    gameMenuControls.appendChild(gameMenuFetchButton);

    gameMenuContainer.textContent = gameName;

    gameMenuContainer.appendChild(gameMenuImgDiv);
    gameMenuContainer.appendChild(gameMenuControls);

    return gameMenuContainer;
}


LB.build = {
    gameMenu: buildGameMenu
};
