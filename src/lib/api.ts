import type { CoachingSummary } from "../types/coaching";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export async function getCoachingSummary(
  signal?: AbortSignal,
): Promise<CoachingSummary> {
  const response = await fetch(`${API_URL}/v1/coaching/summary`, { signal });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<CoachingSummary>;
}
