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
  summonerLevel: number | null;
  searchCount: number;
  lastSearchedAt: string;
  createdAt: string;
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
}

export interface SyncMatchesResult {
  profileId: string;
  requested: number;
  imported: number;
  skipped: number;
  matches: MatchSummary[];
}
