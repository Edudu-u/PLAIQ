const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const liveClient = require("./live-client.cjs");

const brandIcon = path.join(__dirname, "..", "public", "brand", "icon.png");
const LIVE_POLL_MS = 5000;
const MAX_LIVE_SNAPSHOTS = 720;

let liveTimer = null;
let liveSession = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 920,
    minHeight: 620,
    backgroundColor: "#12121a",
    title: "PLAYQ.GG",
    icon: brandIcon,
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

function liveStatus() {
  if (!liveSession) {
    return {
      running: false,
      inGame: false,
      connected: false,
      sessionId: null,
      startedAt: null,
      snapshotCount: 0,
      lastSnapshot: null,
      endedReason: null,
      expectedRiotId: null,
    };
  }

  return {
    running: Boolean(liveTimer),
    inGame: liveSession.inGame,
    connected: liveSession.connected,
    sessionId: liveSession.id,
    startedAt: liveSession.startedAt,
    snapshotCount: liveSession.snapshots.length,
    lastSnapshot:
      liveSession.snapshots[liveSession.snapshots.length - 1] ?? null,
    endedReason: liveSession.endedReason ?? null,
    expectedRiotId: liveSession.expectedRiotId,
  };
}

function broadcastLiveStatus(eventName, payload) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(eventName, payload);
    }
  }
}

async function pollLiveClient() {
  if (!liveSession) return;

  const probe = await liveClient.probe();
  liveSession.connected = probe.connected;

  if (!probe.connected) {
    liveSession.missedPolls += 1;
    broadcastLiveStatus("plaiq:live-status", liveStatus());

    // Do not finish a session for one transient local connection failure.
    if (liveSession.inGame && liveSession.missedPolls < 4) {
      return;
    }

    if (!liveSession.inGame) return;
  } else {
    liveSession.missedPolls = 0;
  }

  if (!probe.inGame) {
    if (liveSession.inGame) {
      await finalizeLiveSession("game-ended");
    }
    return;
  }

  try {
    const snapshot = await liveClient.snapshot(liveSession.expectedRiotId);

    if (!liveSession.inGame) {
      liveSession.startedAt = new Date(
        Date.now() - snapshot.gameTimeSeconds * 1000,
      ).toISOString();
    }

    liveSession.inGame = true;
    liveSession.connected = true;

    if (snapshot.championName) {
      liveSession.championName = snapshot.championName;
    }

    if (snapshot.role) {
      liveSession.role = snapshot.role;
    }

    if (liveSession.snapshots.length < MAX_LIVE_SNAPSHOTS) {
      liveSession.snapshots.push({
        capturedAtMs: snapshot.capturedAtMs,
        gameTimeSeconds: snapshot.gameTimeSeconds,
        creepScore: snapshot.creepScore,
        kills: snapshot.kills,
        deaths: snapshot.deaths,
        assists: snapshot.assists,
        visionScore: snapshot.visionScore,
      });
    }

    broadcastLiveStatus("plaiq:live-snapshot", snapshot);
    broadcastLiveStatus("plaiq:live-status", liveStatus());
  } catch (error) {
    liveSession.connected = true;
    liveSession.lastError =
      error instanceof Error ? error.message : "No se pudo leer Live Client.";
    broadcastLiveStatus("plaiq:live-status", liveStatus());
  }
}

async function finalizeLiveSession(reason) {
  if (!liveSession) return;

  if (liveTimer) {
    clearInterval(liveTimer);
    liveTimer = null;
  }

  liveSession.inGame = false;
  liveSession.endedReason = reason;
  liveSession.endedAt = new Date().toISOString();

  broadcastLiveStatus("plaiq:live-session-ended", {
    ...liveStatus(),
    endedAt: liveSession.endedAt,
    role: liveSession.role,
    championName: liveSession.championName,
    queueId: liveSession.queueId,
    snapshots: liveSession.snapshots,
  });

  broadcastLiveStatus("plaiq:live-status", liveStatus());
}

async function startLiveSession(expectedRiotId) {
  if (liveTimer) {
    return liveStatus();
  }

  if (typeof expectedRiotId !== "string" || !expectedRiotId.trim()) {
    throw new Error("Se necesita un Riot ID activo para iniciar la captura.");
  }

  liveSession = {
    id: randomUUID(),
    expectedRiotId: expectedRiotId.trim(),
    startedAt: new Date().toISOString(),
    endedAt: null,
    endedReason: null,
    connected: false,
    inGame: false,
    missedPolls: 0,
    lastError: null,
    championName: null,
    role: null,
    queueId: 0,
    snapshots: [],
  };

  await pollLiveClient();
  liveTimer = setInterval(() => {
    void pollLiveClient();
  }, LIVE_POLL_MS);

  broadcastLiveStatus("plaiq:live-status", liveStatus());
  return liveStatus();
}

async function stopLiveSession() {
  if (!liveSession) return liveStatus();
  await finalizeLiveSession("manual");
  return liveStatus();
}

function sessionForRenderer() {
  if (!liveSession) return null;

  return {
    ...liveStatus(),
    endedAt: liveSession.endedAt,
    role: liveSession.role,
    championName: liveSession.championName,
    queueId: liveSession.queueId,
    snapshots: liveSession.snapshots,
  };
}

ipcMain.handle("live:probe", () => liveClient.probe());
ipcMain.handle("live:start", (_event, expectedRiotId) =>
  startLiveSession(expectedRiotId),
);
ipcMain.handle("live:stop", () => stopLiveSession());
ipcMain.handle("live:get-session", () => sessionForRenderer());

app.whenReady().then(() => {
  app.setName("PLAYQ.GG");

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
  if (liveTimer) {
    clearInterval(liveTimer);
    liveTimer = null;
  }

  if (process.platform !== "darwin") app.quit();
});
