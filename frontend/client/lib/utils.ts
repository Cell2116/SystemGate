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

// export function formatDateTime(dateString: string) {
//   const d = new Date(dateString);
//   return d.toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
// }


export const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("id-ID", {
    // if doesnt work, Change UTC to Asia/Jakarta. it depends on the computer
    timeZone: "UTC", 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const formatCustomDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return null;

  let date: Date;
  if (dateString.includes('T')) {
    const [datePart, timePart] = dateString.split('T');
    const timeOnly = timePart.split('.')[0];
    const cleanDateString = `${datePart} ${timeOnly}`;
    date = new Date(cleanDateString);
  } else if (dateString.includes(' ')) {
    date = new Date(dateString);
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}.${minutes}.${seconds}`;
};

// src/utils/trucks/formatters.ts

export const formatIsoForDisplay = (input?: string | null) => {
  if (!input) return '';
  if (typeof input !== 'string') return String(input);
  let s = input.replace('T', ' ');
  s = s.replace(/\.\d+Z?$/, '');
  s = s.replace(/Z$/, '');
  return s;
};

export const formatIntervalDisplay = (interval?: string | number | null | any) => {
  console.log('formatIntervalDisplay input:', interval, 'type:', typeof interval);
  if (!interval) return '-';

  // Handle object case (PostgreSQL interval objects)
  if (typeof interval === 'object' && interval !== null) {
    console.log('Object detected:', interval);
    // Handle PostgreSQL interval object
    if (interval.minutes !== undefined || interval.hours !== undefined || interval.seconds !== undefined) {
      const hours = interval.hours || 0;
      const minutes = interval.minutes || 0;
      const seconds = interval.seconds || 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(Math.floor(seconds)).padStart(2, '0')}`;
    }
    // Handle other object formats
    if (interval.toString && typeof interval.toString === 'function') {
      const stringValue = interval.toString();
      console.log('Object toString:', stringValue);
      if (stringValue !== '[object Object]') {
        return stringValue;
      }
    }
    return '-';
  }

  if (typeof interval === 'string') {
    if (interval.includes(':')) {
      // Format INTERVAL (HH:MM:SS)
      return interval;
    }
  }

  if (typeof interval === 'number') {
    // Format number (minutes) - legacy data
    return `${interval} minutes`;
  }

  return String(interval);
};
