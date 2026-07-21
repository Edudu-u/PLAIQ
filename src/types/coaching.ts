export type GoalMetric = "cs_at_10" | "deaths_before_15" | "vision_score";
export type AppView = "resumen" | "perfiles" | "objetivos" | "partidas";

export interface CoachingGoal {
  id: string;
  title: string;
  metric: GoalMetric;
  current: number;
  target: number;
  unit: string;
  completed: boolean;
}

export interface CoachingSummary {
  player: {
    riotId: string;
    region: string;
    primaryRole: string;
  };
  focus: string;
  coachMessage: string;
  goals: CoachingGoal[];
  generatedAt: string;
}

export interface RiotProfile {
  id: string;
  riotId: string;
  gameName: string;
  tagLine: string;
  platform: string;
  profileIconId: number | null;
  profileIconUrl?: string | null;
  summonerLevel: number | null;
  searchCount: number;
  lastSearchedAt: string;
  createdAt: string;
}

export type RankedQueueKey =
  | "soloDuo"
  | "flex"
  | "tft"
  | "tftDoubleUp"
  | "tftHyperRoll";

export interface RankedQueueEntry {
  key: RankedQueueKey;
  queueType: string;
  queueLabel: string;
  tier: string | null;
  rank: string | null;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number | null;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
  ratedTier: string | null;
  ratedRating: number | null;
  unranked: boolean;
  emblemUrl: string;
}

export interface ChampionMasteryEntry {
  championId: number;
  championName: string;
  championLevel: number;
  championPoints: number;
  lastPlayTime: string | null;
  chestGranted: boolean;
  tokensEarned: number;
  championIconUrl: string;
}

export interface PlayerProfileDetail {
  id: string;
  riotId: string;
  gameName: string;
  tagLine: string;
  platform: string;
  profileIconId: number;
  profileIconUrl: string;
  summonerLevel: number;
  searchCount: number;
  lastSearchedAt: string;
  ranked: Record<RankedQueueKey, RankedQueueEntry>;
  rankedList: RankedQueueEntry[];
  topMasteries: ChampionMasteryEntry[];
  dataDragonVersion: string;
  refreshedAt: string;
}

export interface RiotSearchHistory {
  id: string;
  riotId: string;
  gameName: string;
  tagLine: string;
  platform: string;
  status: "found" | "not_found" | "error";
  errorMessage: string | null;
  searchedAt: string;
}

export interface LookupRiotProfileInput {
  clientId: string;
  gameName: string;
  tagLine: string;
  platform: string;
}

export interface MatchSummary {
  id: string;
  riotMatchId: string;
  queueId: number;
  queueLabel: string;
  gameMode: string | null;
  gameCreation: string;
  gameDurationSeconds: number;
  patchVersion: string | null;
  championId: number;
  championName: string;
  teamPosition: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  visionScore: number;
  goldEarned: number;
  totalDamageToChampions: number;
  mvpRiotId?: string | null;
  mvpChampionName?: string | null;
}

export interface MatchPlayerSummary {
  puuid: string;
  riotId: string;
  teamId: number;
  championId: number;
  championName: string;
  championIconUrl: string;
  teamPosition: string | null;
  win: boolean;
  kills: number;
  deaths: number;
  assists: number;
  creepScore: number;
  visionScore: number;
  goldEarned: number;
  totalDamageToChampions: number;
  isMvp: boolean;
  isTrackedPlayer: boolean;
  rankLabel: string | null;
}

export interface MatchDetail {
  id: string;
  riotMatchId: string;
  queueId: number;
  queueLabel: string;
  gameMode: string | null;
  gameCreation: string;
  gameDurationSeconds: number;
  patchVersion: string | null;
  win: boolean;
  championName: string;
  mvpRiotId: string | null;
  mvpChampionName: string | null;
  allyTeam: MatchPlayerSummary[];
  enemyTeam: MatchPlayerSummary[];
  players: MatchPlayerSummary[];
}

export interface SyncMatchesResult {
  profileId: string;
  requested: number;
  imported: number;
  skipped: number;
  matches: MatchSummary[];
}
