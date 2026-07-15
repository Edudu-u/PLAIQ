export type GoalMetric = "cs_at_10" | "deaths_before_15" | "vision_score";

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
