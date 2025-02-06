document.addEventListener('DOMContentLoaded', () => {
    const message = window.electronAPI.sayHello();
    document.getElementById('message').textContent = message;
});
