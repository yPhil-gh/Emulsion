const { contextBridge } = require("electron");
const path = require("path");

function escapeFilePath(filePath) {
    // Normalize path for the OS
    let normalizedPath = path.normalize(filePath);

    // Escape spaces and special characters for shell commands (cross-platform)
    if (process.platform !== "win32") {
        // Linux/macOS: Escape spaces & special characters for bash/zsh
        normalizedPath = normalizedPath
            .replace(/ /g, "\\ ")
            .replace(/\(/g, "\\(")
            .replace(/\)/g, "\\)")
            .replace(/&/g, "\\&");
    } else {
        // Windows: Wrap path in double quotes (cmd-friendly)
        normalizedPath = `"${normalizedPath}"`;
    }

    return normalizedPath;
}

contextBridge.exposeInMainWorld("electronAPI", {
    escapePath: (filePath) => escapeFilePath(filePath)
});
