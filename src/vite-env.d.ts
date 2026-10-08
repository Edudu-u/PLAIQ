/// <reference types="vite/client" />

interface LiveClientProbe {
  connected: boolean;
  inGame: boolean;
  gameTimeSeconds: number;
  mapName: string | null;
  gameMode: string | null;
}

interface LiveClientSnapshot {
  capturedAtMs: number;
  gameTimeSeconds: number;
  creepScore: number;
  kills: number;
  deaths: number;
  assists: number;
  visionScore: number;
  riotId: string | null;
  championName: string | null;
  role: string | null;
  inGame: boolean;
  mapName: string | null;
  gameMode: string | null;
}

interface LiveClientStatus {
  running: boolean;
  inGame: boolean;
  connected: boolean;
  sessionId: string | null;
  startedAt: string | null;
  snapshotCount: number;
  lastSnapshot: LiveClientSnapshot | null;
  endedReason: string | null;
  expectedRiotId: string | null;
}

interface LiveClientSession extends LiveClientStatus {
  endedAt: string | null;
  role: string | null;
  championName: string | null;
  queueId: number;
  snapshots: Array<{
    capturedAtMs: number;
    gameTimeSeconds: number;
    creepScore: number;
    kills: number;
    deaths: number;
    assists: number;
    visionScore: number;
  }>;
}

interface Window {
  plaiq?: {
    platform: string;
    live: {
      probe(): Promise<LiveClientProbe>;
      start(expectedRiotId: string): Promise<LiveClientStatus>;
      stop(): Promise<LiveClientStatus>;
      getSession(): Promise<LiveClientSession | null>;
      onSnapshot(listener: (snapshot: LiveClientSnapshot) => void): () => void;
      onStatus(listener: (status: LiveClientStatus) => void): () => void;
      onSessionEnded(listener: (session: LiveClientSession) => void): () => void;
    };
  };
}
