import { useEffect, useState } from "react";

type TimeTickerProps = {
    startTime: string | null | undefined;
    status: string | null | undefined;
};

function formatDuration(ms: number) {
    if (ms < 0) return "00:00:00";

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
        console.log('🔍 TimeTickerSimple received:', { startTime, status });

        const activeStatuses = ['timbang', 'loading', 'unloading'];
        const normalizedStatus = status?.toLowerCase().trim();
        const isActiveStatus = normalizedStatus && activeStatuses.includes(normalizedStatus);

        console.log('📊 Status check:', {
            original: status,
            normalized: normalizedStatus,
            isActive: isActiveStatus
        });

        if (!isActiveStatus) {
            console.log('⏸️ Status not active, showing "-"');
            setElapsed("-");
            return;
        }

        if (!startTime) {
            console.log('⚠️ No startTime provided');
            setElapsed("-");
            return;
        }

        let startTimestamp: number;

        try {
            if (/^\d{2}:\d{2}:\d{2}/.test(startTime)) {
                const today = new Date();
                const [hours, minutes, seconds] = startTime.split(':').map(Number);

                const startDate = new Date(today);
                startDate.setHours(hours, minutes, seconds || 0, 0);
                if (startDate.getTime() - today.getTime() > 60 * 60 * 1000) {
                    startDate.setDate(startDate.getDate() - 1);
                }

                startTimestamp = startDate.getTime();
                console.log('⏰ Parsed time-only format:', {
                    input: startTime,
                    parsed: startDate.toLocaleString(),
                    timestamp: startTimestamp
                });
            }
            else if (startTime.includes('1970-01-01')) {
                const parsed = new Date(startTime);
                if (isNaN(parsed.getTime())) {
                    throw new Error('Invalid date');
                }

                const hours = parsed.getUTCHours();
                const minutes = parsed.getUTCMinutes();
                const seconds = parsed.getUTCSeconds();
                const today = new Date();
                const startDate = new Date(today);
                startDate.setHours(hours, minutes, seconds, 0);
                if (startDate.getTime() - today.getTime() > 60 * 60 * 1000) {
                    startDate.setDate(startDate.getDate() - 1);
                }

                startTimestamp = startDate.getTime();
                console.log('🕐 Parsed 1970 time format:', {
                    input: startTime,
                    extractedTime: `${hours}:${minutes}:${seconds}`,
                    parsedToday: startDate.toLocaleString(),
                    timestamp: startTimestamp
                });
            }
            else {
                const parsed = new Date(startTime);
                if (isNaN(parsed.getTime())) {
                    throw new Error('Invalid date');
                }
                startTimestamp = parsed.getTime();
                console.log('📅 Parsed ISO format:', {
                    input: startTime,
                    parsed: parsed.toLocaleString(),
                    timestamp: startTimestamp
                });
            }
        } catch (error) {
            console.error('❌ Failed to parse startTime:', startTime, error);
            setElapsed("-");
            return;
        }
        const updateTimer = () => {
            const now = Date.now();
            const diff = now - startTimestamp;

            if (diff < 0) {
                setElapsed("00:00:00");
            } else if (diff > 24 * 60 * 60 * 1000) {
                setElapsed("24:00:00+");
            } else {
                setElapsed(formatDuration(diff));
            }
        };
        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime, status]);

    return (
        <span className="ml-2 text-black font-bold lg:text-xl sm:text-sm animate-pulse">
            {elapsed}
        </span>
    );
}