window.electronAPI.onPopulateSettings((event, data) => {
  console.log('Settings Data:', data);
  document.getElementById('message').textContent = data.message;
  document.getElementById('user-data-path').textContent = data.userDataPath;
});
