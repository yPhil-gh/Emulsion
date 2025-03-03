window.electronAPI.onPopulateGames((event, data) => {
  console.log('Games Data:', data);
  document.getElementById('user-data-path').textContent = data.userDataPath;

  // Confirm that the page is ready
  window.electronAPI.sendPageReady();
});
