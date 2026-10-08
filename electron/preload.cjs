const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("plaiq", {
  platform: process.platform,
  live: {
    probe: () => ipcRenderer.invoke("live:probe"),
    start: (expectedRiotId) =>
      ipcRenderer.invoke("live:start", expectedRiotId),
    stop: () => ipcRenderer.invoke("live:stop"),
    getSession: () => ipcRenderer.invoke("live:get-session"),
    onSnapshot: (listener) => {
      const handler = (_event, payload) => listener(payload);
      ipcRenderer.on("plaiq:live-snapshot", handler);
      return () => ipcRenderer.removeListener("plaiq:live-snapshot", handler);
    },
    onStatus: (listener) => {
      const handler = (_event, payload) => listener(payload);
      ipcRenderer.on("plaiq:live-status", handler);
      return () => ipcRenderer.removeListener("plaiq:live-status", handler);
    },
    onSessionEnded: (listener) => {
      const handler = (_event, payload) => listener(payload);
      ipcRenderer.on("plaiq:live-session-ended", handler);
      return () => ipcRenderer.removeListener("plaiq:live-session-ended", handler);
    },
  },
});
