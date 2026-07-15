const STORAGE_KEY = "plaiq.client-id";

export function getClientId(): string {
  const current = localStorage.getItem(STORAGE_KEY);

  if (current) {
    return current;
  }

  const created = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, created);
  return created;
}
