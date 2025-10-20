// Utility functions untuk menangani timezone Indonesia (UTC+7)
/**
 * Mendapatkan tanggal dalam timezone Indonesia (UTC+7)
 * @param daysOffset - Offset hari (0 = hari ini, -1 = kemarin, 1 = besok)
 * @returns string format YYYY-MM-DD
 */
export const getIndonesianDate = (daysOffset: number = 0): string => {
    const now = new Date();
    const indonesianTime = new Date(now.getTime() + (7 * 60 * 60 * 1000) + (daysOffset * 24 * 60 * 60 * 1000));
    return indonesianTime.toISOString().split("T")[0];
};
/**
 * Mendapatkan timestamp lengkap dalam timezone Indonesia (UTC+7)
 * @returns string format YYYY-MM-DD HH:mm:ss (compatible dengan PostgreSQL timestamp)
 */
export const getIndonesianDateTime = (): string => {
    const now = new Date();
    const indonesianTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    
    // Format ke YYYY-MM-DD HH:mm:ss untuk PostgreSQL
    const year = indonesianTime.getUTCFullYear();
    const month = String(indonesianTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(indonesianTime.getUTCDate()).padStart(2, '0');
    const hours = String(indonesianTime.getUTCHours()).padStart(2, '0');
    const minutes = String(indonesianTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(indonesianTime.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
/**
 * Mendapatkan waktu dalam timezone Indonesia (UTC+7)
 * @returns string format HH:mm:ss
 */
export const getIndonesianTime = (): string => {
    const now = new Date();
    const indonesianTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    return indonesianTime.toTimeString().split(' ')[0];
};
/**
 * Konversi UTC Date ke Indonesian Time
 * @param utcDate - Date object dalam UTC
 * @returns Date object dalam timezone Indonesia
 */
export const utcToIndonesianTime = (utcDate: Date): Date => {
    return new Date(utcDate.getTime() + (7 * 60 * 60 * 1000));
};
/**
 * Format tanggal untuk display dalam bahasa Indonesia
 * @param date - string tanggal YYYY-MM-DD atau Date object
 * @returns string format "DD MMMM YYYY"
 */
export const formatIndonesianDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};
/**
 * Format datetime untuk display dalam bahasa Indonesia
 * @param date - string tanggal atau Date object
 * @returns string format "DD MMMM YYYY, HH:mm"
 */
export const formatIndonesianDateTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};