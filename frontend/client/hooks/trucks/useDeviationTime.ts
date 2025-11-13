
function normalizeTime(timeValue: any): string | null {
    if (!timeValue) return null;

    if (typeof timeValue === "string") {
        const match = timeValue.match(/(\d{2}:\d{2}:\d{2})/);
        if (match) return match[1];
    }
    if (timeValue instanceof Date) {
        return timeValue.toTimeString().split(" ")[0];
    }

    return null;
}

import { getIndonesianTime } from '@/lib/timezone';

export function deviationTime(start: string, end?: string): string {
    // const currentTimeOnly = getIndonesianTime();
    const currentTime = getIndonesianTime();
    const endTimeRaw = end || currentTime;
    // const sqlTimeFormat = formatTimeForSQL(currentTimeOnly);
    const startTimeStr = normalizeTime(start);
    const endTimeStr = normalizeTime(endTimeRaw);
    if (!startTimeStr || !endTimeStr) throw new Error("Invalid Time Data")
    const startTime = new Date(`1970-01-01T${startTimeStr}`);
    const endTime = new Date(`1970-01-01T${endTimeStr}`);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        throw new Error(`Invalid time format: start=${startTimeStr}, end=${endTimeStr}`);
    }
    let diffMs = endTime.getTime() - startTime.getTime();
    if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
    }
    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
// export function calculateTimeDifference(startTime: string, endTime: string): string {
//     const start = new Date(startTime);
//     const end = new Date(endTime);
//     const diffMs = end.getTime() - start.getTime();
//     console.log(startTime, "+", endTime, "+", diffMs);

//     const diffSeconds = Math.floor(diffMs / 1000);
//     const diffMinutes = Math.floor(diffSeconds / 60);
//     const diffHours = Math.floor(diffMinutes / 60);

//     const hours = String(diffHours).padStart(2, '0');
//     const minutes = String(diffMinutes % 60).padStart(2, '0');
//     const seconds = String(diffSeconds % 60).padStart(2, '0');
//     const arrivalDate = new Date(startTime);
//     const year = arrivalDate.getFullYear();
//     const month = String(arrivalDate.getMonth() + 1).padStart(2, '0');
//     const day = String(arrivalDate.getDate()).padStart(2, '0');

//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// };


export function calculateTimeDifference(startTime: string, endTime: string): string {
    const start = new Date(startTime);
    let end: Date;

    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(endTime)) {
        end = new Date(endTime.replace(' ', 'T') + 'Z');
        console.log('🔄 Converted endTime to UTC:', endTime, '→', end.toISOString());
    } else {
        end = new Date(endTime);
    }

    const diffMs = end.getTime() - start.getTime();

    console.log('⏱️ Time calculation:', {
        startTime,
        endTime,
        startParsed: start.toISOString(),
        endParsed: end.toISOString(),
        diffMs,
        diffMinutes: Math.floor(diffMs / 1000 / 60)
    });

    // Handle negative difference
    if (diffMs < 0) {
        console.warn('Negative time difference detected!');
        return '00:00:00';
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    const hours = String(diffHours).padStart(2, '0');
    const minutes = String(diffMinutes % 60).padStart(2, '0');
    const seconds = String(diffSeconds % 60).padStart(2, '0');

    // Use startTime for the date portion
    const arrivalDate = new Date(startTime);
    const year = arrivalDate.getUTCFullYear();
    const month = String(arrivalDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(arrivalDate.getUTCDate()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
    // return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// // Alternative: Jika Anda ingin format endTime tetap sebagai local time
// export function calculateTimeDifferenceLocal(startTime: string, endTime: string): string {
//     // Parse startTime (UTC) dan convert ke local
//     const start = new Date(startTime);

//     // Parse endTime sebagai local time
//     const end = new Date(endTime);

//     const diffMs = end.getTime() - start.getTime();

//     console.log('⏱️ Time calculation (local):', {
//         startTime,
//         endTime,
//         startLocal: start.toLocaleString(),
//         endLocal: end.toLocaleString(),
//         diffMs,
//         diffMinutes: Math.floor(diffMs / 1000 / 60)
//     });

//     // Handle negative difference
//     if (diffMs < 0) {
//         console.warn('⚠️ Negative time difference detected!');
//         return '0000-00-00 00:00:00';
//     }

//     const diffSeconds = Math.floor(diffMs / 1000);
//     const diffMinutes = Math.floor(diffSeconds / 60);
//     const diffHours = Math.floor(diffMinutes / 60);

//     const hours = String(diffHours).padStart(2, '0');
//     const minutes = String(diffMinutes % 60).padStart(2, '0');
//     const seconds = String(diffSeconds % 60).padStart(2, '0');

//     // Use startTime for the date portion (in local timezone)
//     const year = start.getFullYear();
//     const month = String(start.getMonth() + 1).padStart(2, '0');
//     const day = String(start.getDate()).padStart(2, '0');

//     return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
// }