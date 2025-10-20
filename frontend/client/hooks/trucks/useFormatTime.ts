import { useState, useCallback } from  "react";
export function useFormatTime(){
    const formatTimeForInput = (dateTime?: string | null) =>{
        if (!dateTime) return '';
        if (typeof dateTime !== 'string') return '';
        // Jika sudah format HH:mm, langsung return
        if (/^\d{2}:\d{2}$/.test(dateTime)) return dateTime;
        try {
            const date = new Date(dateTime);
            if (isNaN(date.getTime())) return '';
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (error) {
            
            return '';
        }
    }
    const formatTimeForDatabase = (timeValue: string, originalDatetime?: string | null) => {
        if (!timeValue) return null;
        try {
            // Ambil tanggal dari datetime asli, atau gunakan tanggal hari ini
            const baseDate = originalDatetime ? new Date(originalDatetime) : new Date();
            const [hours, minutes] = timeValue.split(':');
            baseDate.setHours(parseInt(hours, 10));
            baseDate.setMinutes(parseInt(minutes, 10));
            baseDate.setSeconds(0);
            baseDate.setMilliseconds(0);
            return baseDate.toISOString();
        } catch (error) {
            console.error('Error formatting time for database:', error);
            return originalDatetime;
        }
    };
    return{
        formatTimeForInput,
        formatTimeForDatabase
    }
}