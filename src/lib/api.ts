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
import type {
  PatchArticle,
  PatchIndex,
} from "../types/patches";
import type {
  TierlistQuery,
  TierlistResponse,
  TierlistSyncStatus,
} from "../types/tierlist";

const API_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000/api";

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options);

  if (!response.ok) {
    let message = `API request failed with status ${response.status}`;

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
      // Keep the fallback status message when the API has no JSON body.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getCoachingSummary(
  signal?: AbortSignal,
): Promise<CoachingSummary> {
  return request<CoachingSummary>("/v1/coaching/summary", { signal });
}

export function lookupRiotProfile(
  input: LookupRiotProfileInput,
): Promise<PlayerProfileDetail> {
  return request<PlayerProfileDetail>("/v1/riot/profiles/lookup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function getRiotProfiles(clientId: string): Promise<RiotProfile[]> {
  return request<RiotProfile[]>(
    `/v1/riot/profiles?clientId=${encodeURIComponent(clientId)}`,
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
    `/v1/riot/profiles/${encodeURIComponent(profileId)}/detail?${params}`,
  );
}

export function getRiotSearchHistory(
  clientId: string,
): Promise<RiotSearchHistory[]> {
  return request<RiotSearchHistory[]>(
    `/v1/riot/search-history?clientId=${encodeURIComponent(clientId)}&limit=20`,
  );
}

/** Riot Match-v5 max ids per request; used for sync + list. */
export const MATCH_HISTORY_LIMIT = 100;

export function syncProfileMatches(
  clientId: string,
  profileId: string,
  count = MATCH_HISTORY_LIMIT,
): Promise<SyncMatchesResult> {
  return request<SyncMatchesResult>(
    `/v1/riot/profiles/${encodeURIComponent(profileId)}/matches/sync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
    `/v1/riot/profiles/${encodeURIComponent(profileId)}/matches?clientId=${encodeURIComponent(clientId)}&limit=${limit}`,
  );
}

export function getMatchDetail(
  clientId: string,
  profileId: string,
  matchId: string,
): Promise<MatchDetail> {
  return request<MatchDetail>(
    `/v1/riot/profiles/${encodeURIComponent(profileId)}/matches/${encodeURIComponent(matchId)}?clientId=${encodeURIComponent(clientId)}`,
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
  return request<TierlistResponse>(`/v1/tierlist?${params}`);
}

export function getTierlistSyncStatus(
  signal?: AbortSignal,
): Promise<TierlistSyncStatus> {
  return request<TierlistSyncStatus>("/v1/tierlist/sync", { signal });
}

export function startTierlistSync(): Promise<TierlistSyncStatus> {
  return request<TierlistSyncStatus>("/v1/tierlist/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
    `/v1/patches/${encodeURIComponent(slug)}`,
    { signal },
  );
}
