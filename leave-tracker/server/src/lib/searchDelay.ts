// In production the leave table is large and a search by one or two letters matches
// most of it, so short searches are slow. This keeps local timings close to that.
export function searchDelay(q: string): Promise<void> {
  if (!q || process.env.JEST_WORKER_ID) return Promise.resolve();
  const ms = q.length <= 2 ? 1200 : 150;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
