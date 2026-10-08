const https = require("node:https");

const BASE_URL = "https://127.0.0.1:2999";
const REQUEST_TIMEOUT_MS = 1500;

function requestJson(path) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      BASE_URL + path,
      {
        rejectUnauthorized: false,
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          Accept: "application/json",
          "User-Agent": "PLAIQ/0.1 Live Client Collector",
        },
      },
      (response) => {
        let body = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          if ((response.statusCode ?? 500) < 200 || (response.statusCode ?? 500) >= 300) {
            reject(new Error("Live Client respondió HTTP " + response.statusCode));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error("Live Client devolvió JSON inválido"));
          }
        });
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Live Client timeout"));
    });

    request.on("error", reject);
  });
}

async function getGameStats() {
  return requestJson("/liveclientdata/gamestats");
}

async function getActivePlayerName() {
  return requestJson("/liveclientdata/activeplayername");
}

async function getPlayerList() {
  return requestJson("/liveclientdata/playerlist");
}

async function getPlayerScores(riotId) {
  return requestJson(
    "/liveclientdata/playerscores?riotId=" +
      encodeURIComponent(riotId),
  );
}

function normalizeRiotId(value) {
  if (typeof value === "string") return value.trim();
  if (!value || typeof value !== "object") return "";
  return (
    value.riotId ||
    value.riotIdGameName ||
    value.summonerName ||
    ""
  ).trim();
}

function findActivePlayer(players, activeRiotId) {
  if (!Array.isArray(players)) return null;

  const wanted = activeRiotId.toLowerCase();
  return (
    players.find(
      (player) => normalizeRiotId(player).toLowerCase() === wanted,
    ) ??
    players.find(
      (player) =>
        typeof player.riotIdGameName === "string" &&
        player.riotIdGameName.toLowerCase() === activeRiotId.toLowerCase(),
    ) ??
    null
  );
}

async function probe() {
  try {
    const game = await getGameStats();

    return {
      connected: true,
      inGame: Number(game?.gameTime ?? 0) > 0,
      gameTimeSeconds: Number(game?.gameTime ?? 0),
      mapName: game?.mapName ?? null,
      gameMode: game?.gameMode ?? null,
    };
  } catch {
    return {
      connected: false,
      inGame: false,
      gameTimeSeconds: 0,
      mapName: null,
      gameMode: null,
    };
  }
}

async function snapshot(expectedRiotId) {
  const [game, activeName, players] = await Promise.all([
    getGameStats(),
    getActivePlayerName(),
    getPlayerList(),
  ]);

  const activeRiotId = normalizeRiotId(activeName);
  const normalizedExpected = normalizeRiotId(expectedRiotId);

  if (
    normalizedExpected &&
    activeRiotId &&
    activeRiotId.toLowerCase() !== normalizedExpected.toLowerCase()
  ) {
    throw new Error(
      "El jugador activo no coincide con el perfil seleccionado.",
    );
  }

  const player = findActivePlayer(players, activeRiotId || normalizedExpected);
  const score = await getPlayerScores(activeRiotId || normalizedExpected);

  return {
    capturedAtMs: Date.now(),
    gameTimeSeconds: Number(game?.gameTime ?? 0),
    creepScore: Math.max(0, Math.trunc(Number(score?.creepScore ?? 0))),
    kills: Math.max(0, Math.trunc(Number(score?.kills ?? 0))),
    deaths: Math.max(0, Math.trunc(Number(score?.deaths ?? 0))),
    assists: Math.max(0, Math.trunc(Number(score?.assists ?? 0))),
    visionScore: Math.max(0, Number(score?.wardScore ?? 0)),
    riotId: activeRiotId || normalizedExpected || null,
    championName: typeof player?.championName === "string" ? player.championName : null,
    role:
      typeof player?.position === "string" && player.position.trim()
        ? player.position.toUpperCase()
        : null,
    inGame: Number(game?.gameTime ?? 0) > 0,
    mapName: game?.mapName ?? null,
    gameMode: game?.gameMode ?? null,
  };
}

module.exports = {
  probe,
  snapshot,
};
