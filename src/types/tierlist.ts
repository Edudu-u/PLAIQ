export interface TierlistRow {
  rank: number;
  tier: string;
  championId: number;
  championName: string;
  championIconUrl: string;
  role: string;
  roleLabel: string;
  games: number;
  wins: number;
  winRate: number;
  pickRate: number;
  banRate: number;
  kda: number;
  score: number;
}

export interface TierlistFilters {
  platforms: string[];
  roles: Array<{ id: string; label: string }>;
  leagues: Array<{ id: string; label: string }>;
  queues: Array<{ id: number; label: string }>;
  patches: string[];
}

export interface TierlistResponse {
  source: string;
  generatedAt: string;
  totalMatches: number;
  filters: {
    platform: string;
    role: string;
    patch: string;
    league: string;
    queueId: number | "ALL";
  };
  rows: TierlistRow[];
  available: TierlistFilters;
}

export interface TierlistSyncStatus {
  running: boolean;
  status: string;
  message: string | null;
  platforms: string[];
  queueIds: number[];
  playersScanned: number;
  matchesImported: number;
  matchesSkipped: number;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface TierlistQuery {
  platform: string;
  role: string;
  patch: string;
  league: string;
  queueId: string;
}
