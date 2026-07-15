const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("plaiq", {
  platform: process.platform,
});
