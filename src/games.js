window.electronAPI.onPopulateGames((event, data) => {
  console.log('Games Data:', data);
  document.getElementById('message').textContent = data.message;
  document.getElementById('user-data-path').textContent = data.userDataPath;
});
