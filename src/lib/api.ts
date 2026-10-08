import type {
  CoachingSummary,
  LookupRiotProfileInput,
  MatchDetail,
  MatchSummary,
  PlayerProfileDetail,
  RiotProfile,
  RiotSearchHistory,
  SyncMatchesResult,
} from "../types/coaching";
import type { PatchArticle, PatchIndex } from "../types/patches";
import type {
  TierlistQuery,
  TierlistResponse,
  TierlistSyncStatus,
} from "../types/tierlist";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_URL + path, options);

  if (!response.ok) {
    let message = "API request failed with status " + response.status;

    try {
      const payload = (await response.json()) as {
        message?: string | string[];
      };
      if (payload.message) {
        message = Array.isArray(payload.message)
          ? payload.message.join(", ")
          : payload.message;
      }
    } catch {
      // Preserve the HTTP status fallback when the API has no JSON body.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getCoachingSummary(
  clientId: string,
  profileId?: string | null,
  limit = 20,
): Promise<CoachingSummary> {
  const params = new URLSearchParams({ clientId });
  if (profileId) params.set("profileId", profileId);
  params.set("limit", String(limit));

  return request<CoachingSummary>("/v1/coaching/summary?" + params.toString());
}

export function lookupRiotProfile(
  input: LookupRiotProfileInput,
): Promise<PlayerProfileDetail> {
  return request<PlayerProfileDetail>("/v1/riot/profiles/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function getRiotProfiles(clientId: string): Promise<RiotProfile[]> {
  return request<RiotProfile[]>(
    "/v1/riot/profiles?clientId=" + encodeURIComponent(clientId),
  );
}

export function getProfileDetail(
  clientId: string,
  profileId: string,
  refresh = true,
): Promise<PlayerProfileDetail> {
  const params = new URLSearchParams({
    clientId,
    refresh: refresh ? "true" : "false",
  });

  return request<PlayerProfileDetail>(
    "/v1/riot/profiles/" +
      encodeURIComponent(profileId) +
      "/detail?" +
      params.toString(),
  );
}

export function getRiotSearchHistory(
  clientId: string,
): Promise<RiotSearchHistory[]> {
  return request<RiotSearchHistory[]>(
    "/v1/riot/search-history?clientId=" +
      encodeURIComponent(clientId) +
      "&limit=20",
  );
}

export const MATCH_HISTORY_LIMIT = 100;

export function syncProfileMatches(
  clientId: string,
  profileId: string,
  count = MATCH_HISTORY_LIMIT,
): Promise<SyncMatchesResult> {
  return request<SyncMatchesResult>(
    "/v1/riot/profiles/" +
      encodeURIComponent(profileId) +
      "/matches/sync",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, count }),
    },
  );
}

export function getProfileMatches(
  clientId: string,
  profileId: string,
  limit = MATCH_HISTORY_LIMIT,
): Promise<MatchSummary[]> {
  return request<MatchSummary[]>(
    "/v1/riot/profiles/" +
      encodeURIComponent(profileId) +
      "/matches?clientId=" +
      encodeURIComponent(clientId) +
      "&limit=" +
      limit,
  );
}

export function getMatchDetail(
  clientId: string,
  profileId: string,
  matchId: string,
): Promise<MatchDetail> {
  return request<MatchDetail>(
    "/v1/riot/profiles/" +
      encodeURIComponent(profileId) +
      "/matches/" +
      encodeURIComponent(matchId) +
      "?clientId=" +
      encodeURIComponent(clientId),
  );
}

export function getTierlist(query: TierlistQuery): Promise<TierlistResponse> {
  const params = new URLSearchParams({
    platform: query.platform,
    role: query.role,
    patch: query.patch,
    league: query.league,
    queueId: query.queueId,
  });
  return request<TierlistResponse>("/v1/tierlist?" + params.toString());
}

export function getTierlistSyncStatus(
  signal?: AbortSignal,
): Promise<TierlistSyncStatus> {
  return request<TierlistSyncStatus>("/v1/tierlist/sync", { signal });
}

export function startTierlistSync(): Promise<TierlistSyncStatus> {
  return request<TierlistSyncStatus>("/v1/tierlist/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platforms: ["LA2", "LA1"],
      queueIds: [420],
      includeDiamond: false,
      playersPerTier: 5,
      matchesPerPlayer: 8,
    }),
  });
}

export function getPatchIndex(signal?: AbortSignal): Promise<PatchIndex> {
  return request<PatchIndex>("/v1/patches", { signal });
}

export function getPatchArticle(
  slug: string,
  signal?: AbortSignal,
): Promise<PatchArticle> {
  return request<PatchArticle>(
    "/v1/patches/" + encodeURIComponent(slug),
    { signal },
  );
}

export interface CreateGameSessionInput {
  clientId: string;
  profileId: string;
  localSessionId: string;
  queueId: number;
  role: string;
  championId: number;
  championName: string;
  startedAt: string;
  endedAt: string;
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

export interface CreateGameSessionResult {
  sessionId: string;
  localSessionId: string;
  profileId: string;
  status: "stored";
  receivedSnapshots: number;
  acceptedAt: string;
}

export function createGameSession(
  input: CreateGameSessionInput,
): Promise<CreateGameSessionResult> {
  return request<CreateGameSessionResult>("/v1/game-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export interface GameSessionSummary {
  id: string;
  localSessionId: string;
  profileId: string;
  queueId: number;
  role: string;
  championId: number;
  championName: string;
  startedAt: string;
  endedAt: string;
  sampleCount: number;
  durationSeconds: number;
}

export interface GameSessionDetail extends GameSessionSummary {
  analysis: {
    csAt10: number | null;
    deathsAt15: number | null;
    visionAt15: number | null;
    finalKda: number | null;
    observedMinutes: number;
    averageSampleIntervalSeconds: number | null;
    quality: "good" | "partial" | "insufficient";
  };
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

export function getGameSessions(
  clientId: string,
  profileId?: string | null,
  limit = 20,
): Promise<GameSessionSummary[]> {
  const params = new URLSearchParams({
    clientId,
    limit: String(limit),
  });
  if (profileId) params.set("profileId", profileId);

  return request<GameSessionSummary[]>(
    "/v1/game-sessions?" + params.toString(),
  );
}

export function getGameSession(
  clientId: string,
  sessionId: string,
): Promise<GameSessionDetail> {
  const params = new URLSearchParams({ clientId });
  return request<GameSessionDetail>(
    "/v1/game-sessions/" +
      encodeURIComponent(sessionId) +
      "?" +
      params.toString(),
  );
}

export interface CoachAiNarrative {
  headline: string;
  summary: string;
  strengths: Array<{ title: string; evidence: string }>;
  weaknesses: Array<{ title: string; evidence: string; impact: string }>;
  actionPlan: Array<{ title: string; reason: string; measurable: string }>;
  confidence: "low" | "medium" | "high";
  limitations: string[];
}

export interface CoachAiAnalysis {
  id: string | null;
  model: string;
  analysisVersion: string;
  sampleSize: number;
  narrative: CoachAiNarrative;
  responseId: string | null;
  createdAt: string;
  cached: boolean;
}

export function generateAiCoaching(
  clientId: string,
  profileId: string,
  limit = 20,
): Promise<CoachAiAnalysis> {
  const params = new URLSearchParams({
    clientId,
    profileId,
    limit: String(limit),
  });

  return request<CoachAiAnalysis>(
    "/v1/coaching/ai-analysis?" + params.toString(),
    { method: "POST" },
  );
}

export function getLatestAiCoaching(
  clientId: string,
  profileId: string,
): Promise<CoachAiAnalysis | null> {
  const params = new URLSearchParams({ clientId, profileId });

  return request<CoachAiAnalysis | null>(
    "/v1/coaching/ai-analysis/latest?" + params.toString(),
  );
}
