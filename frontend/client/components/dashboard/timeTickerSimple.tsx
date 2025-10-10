import { useEffect, useState } from "react";

type TimeTickerProps = {
    startTime: string | null | undefined;
    status: string | null | undefined;
};

// Simple duration formatter - max 23:59:59
function formatDuration(ms: number) {
    if (ms < 0) return "00:00:00";
    
    // Cap at 24 hours to prevent huge numbers
    const cappedMs = Math.min(ms, 24 * 60 * 60 * 1000 - 1);
    
    const totalSeconds = Math.floor(cappedMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function TimeTickerSimple({ startTime, status }: TimeTickerProps) {
    const [elapsed, setElapsed] = useState("00:00:00");

    useEffect(() => {
        if (!startTime || !status) {
            setElapsed("00:00:00");
            return;
        }

        console.log('🕐 Simple TimeTicker - Input:', { startTime, status });

        let startTimestamp: number;

        try {
            // Method 1: If it looks like a time (HH:MM:SS), combine with today
            if (/^\d{2}:\d{2}:\d{2}/.test(startTime)) {
                const today = new Date();
                const [hours, minutes, seconds] = startTime.split(':').map(Number);
                
                const startDate = new Date(today);
                startDate.setHours(hours, minutes, seconds || 0, 0);
                
                // If the time seems to be in the future (more than 1 hour ahead), 
                // assume it's from yesterday
                if (startDate.getTime() - today.getTime() > 60 * 60 * 1000) {
                    startDate.setDate(startDate.getDate() - 1);
                }
                
                startTimestamp = startDate.getTime();
                console.log('📅 Time-only format detected:', {
                    original: startTime,
                    parsed: startDate.toLocaleString(),
                    timestamp: startTimestamp
                });
            }
            // Method 2: Try direct Date parsing
            else {
                const parsed = new Date(startTime);
                if (isNaN(parsed.getTime())) {
                    throw new Error('Invalid date');
                }
                startTimestamp = parsed.getTime();
                console.log('📅 Direct parsing:', {
                    original: startTime,
                    parsed: parsed.toLocaleString(),
                    timestamp: startTimestamp
                });
            }
        } catch (error) {
            console.error('❌ Failed to parse startTime:', startTime, error);
            setElapsed("--:--:--");
            return;
        }

        const updateTimer = () => {
            const now = Date.now();
            const diff = now - startTimestamp;
            
            if (diff < 0) {
                setElapsed("00:00:00");
            } else if (diff > 24 * 60 * 60 * 1000) {
                setElapsed("24:00:00+");
                console.warn('⚠️ Duration exceeds 24 hours:', diff / (1000 * 60 * 60), 'hours');
            } else {
                setElapsed(formatDuration(diff));
            }
        };

        // Initial update
        updateTimer();
        
        // Update every second
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [startTime, status]);

    return (
        <span className="ml-2 text-black font-bold lg:text-xl sm:text-sm animate-pulse">
            {elapsed}
        </span>
    );
}