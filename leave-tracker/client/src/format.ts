import { ApiError } from './api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-03' → '03 Nov 2026'. Works on the text, so the browser's time zone does not matter. */
export function formatDate(date: string): string {
  return `${date.slice(8, 10)} ${MONTHS[Number(date.slice(5, 7)) - 1]} ${date.slice(0, 4)}`;
}

export function describeError(err: unknown, prefix: string): string {
  const message = err instanceof Error ? err.message : String(err);
  const status = err instanceof ApiError ? ` (HTTP ${err.status})` : '';
  return `${prefix}: ${message}${status}`;
}
