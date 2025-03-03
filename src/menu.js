document.addEventListener('DOMContentLoaded', () => {
  window.electronAPI.onPopulateMenu((event, data) => {
    console.log('Menu Data:', data);
    document.getElementById('user-data-path').textContent = data.userDataPath;

    // Confirm that the page is ready
    window.electronAPI.sendPageReady();
  });

  window.electronAPI.onEnableNavigation(() => {
    // Enable navigation buttons
    document.getElementById('games-button').disabled = false;
    document.getElementById('settings-button').disabled = false;
  });

  document.getElementById('games-button').addEventListener('click', () => {
    window.electronAPI.navigateTo('games');
  });

  document.getElementById('settings-button').addEventListener('click', () => {
    window.electronAPI.navigateTo('settings');
  });
});
