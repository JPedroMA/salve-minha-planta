const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 12;

const hits = new Map<string, { count: number; resetAt: number }>();

export function allowRequest(ip: string): boolean {
  const now = Date.now();

  if (hits.size > 10_000) {
    for (const [key, entry] of hits) {
      if (entry.resetAt < now) hits.delete(key);
    }
  }

  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= LIMIT;
}
