window.electronAPI.onPopulateMenu((event, data) => {
  console.log('Menu Data:', data);
  document.getElementById('message').textContent = data.message;
  document.getElementById('user-data-path').textContent = data.userDataPath;
});
