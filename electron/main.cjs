const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#090d16",
    title: "PLAYQ.GG",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(() => {
  // YouTube embeds often fail in Electron (Error 153) without a normal Referer.
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const url = details.url;
    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("googlevideo.com") ||
      url.includes("ytimg.com") ||
      url.includes("google.com/js") ||
      url.includes("gstatic.com")
    ) {
      details.requestHeaders.Referer = "https://www.youtube.com/";
      details.requestHeaders["Sec-Fetch-Site"] = "cross-site";
      details.requestHeaders["Sec-Fetch-Mode"] = "navigate";
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
