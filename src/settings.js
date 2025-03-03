window.electronAPI.onPopulateSettings((event, data) => {
  console.log('Settings Data:', data);
  document.getElementById('user-data-path').textContent = data.userDataPath;

  // Confirm that the page is ready
  window.electronAPI.sendPageReady();
});
