import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an ISO timestamp into a more human-friendly string without the 'T' and 'Z'.
 * Examples:
 *  - formatIsoTimestamp('2025-09-04T08:30:00.000Z') => '2025-09-04 08:30:00'
 *  - formatIsoTimestamp('2025-09-04T08:30:00.000Z', { utc: false }) => local time string '2025-09-04 15:30:00' (depending on TZ)
 *
 * Options:
 *  - utc (default true): treat/return time in UTC. If false, convert to local time.
 *  - includeMs: include milliseconds (default false) => '2025-09-04 08:30:00.000'
 */
export function formatIsoTimestamp(isoString: string | null | undefined, opts?: { utc?: boolean; includeMs?: boolean }): string | null {
  if (!isoString) return null;

  const { utc = true, includeMs = false } = opts || {};

  // Try to parse robustly. If string lacks Z or T, Date will still attempt to parse.
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return null;

  const pad = (n: number, width = 2) => String(n).padStart(width, '0');

  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() + 1 : date.getMonth() + 1;
  const day = utc ? date.getUTCDate() : date.getDate();

  const hours = utc ? date.getUTCHours() : date.getHours();
  const minutes = utc ? date.getUTCMinutes() : date.getMinutes();
  const seconds = utc ? date.getUTCSeconds() : date.getSeconds();
  const ms = utc ? date.getUTCMilliseconds() : date.getMilliseconds();

  const base = `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return includeMs ? `${base}.${String(ms).padStart(3, '0')}` : base;
}
