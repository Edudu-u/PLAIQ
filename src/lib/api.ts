import type {
  CoachingSummary,
  LookupRiotProfileInput,
  RiotProfile,
  RiotSearchHistory,
} from "../types/coaching";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

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
): Promise<RiotProfile> {
  return request<RiotProfile>("/v1/riot/profiles/lookup", {
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

export function getRiotSearchHistory(
  clientId: string,
): Promise<RiotSearchHistory[]> {
  return request<RiotSearchHistory[]>(
    `/v1/riot/search-history?clientId=${encodeURIComponent(clientId)}&limit=20`,
  );
}
