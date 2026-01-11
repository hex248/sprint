import type { TimerState } from "@issue/shared";
import { useEffect, useState } from "react";
import { timer } from "@/lib/server";
import { formatTime } from "@/lib/utils";

const FALLBACK_TIME = "--:--:--";
const REFRESH_INTERVAL_MS = 10000;

export function TimerDisplay({ issueId }: { issueId: number }) {
    const [timerState, setTimerState] = useState<TimerState>(null);
    const [workTimeMs, setWorkTimeMs] = useState(0);
    const [inactiveWorkTimeMs, setInactiveWorkTimeMs] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchTimer = () => {
            timer.get({
                issueId,
                onSuccess: (data) => {
                    if (!isMounted) return;
                    setTimerState(data);
                    setWorkTimeMs(data?.workTimeMs ?? 0);
                    setError(null);
                },
                onError: (message) => {
                    if (!isMounted) return;
                    setError(message);
                },
            });

            timer.getInactive({
                issueId,
                onSuccess: (data) => {
                    if (!isMounted) return;
                    const sessions = (data ?? []) as TimerState[];
                    const totalWorkTime = sessions.reduce(
                        (total, session) => total + (session?.workTimeMs ?? 0),
                        0,
                    );
                    setInactiveWorkTimeMs(totalWorkTime);
                    setError(null);
                },
                onError: (message) => {
                    if (!isMounted) return;
                    setError(message);
                },
            });
        };

        fetchTimer();
        const refreshInterval = window.setInterval(fetchTimer, REFRESH_INTERVAL_MS);

        return () => {
            isMounted = false;
            window.clearInterval(refreshInterval);
        };
    }, [issueId]);

    useEffect(() => {
        if (!timerState?.isRunning) return;

        const startTime = Date.now();
        const baseWorkTime = timerState.workTimeMs;
        const interval = window.setInterval(() => {
            setWorkTimeMs(baseWorkTime + (Date.now() - startTime));
        }, 1000);

        return () => window.clearInterval(interval);
    }, [timerState?.isRunning, timerState?.workTimeMs]);

    const totalWorkTimeMs = inactiveWorkTimeMs + workTimeMs;
    const displayWorkTime = error ? FALLBACK_TIME : formatTime(totalWorkTimeMs);

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono tabular-nums">{displayWorkTime}</span>
        </div>
    );
}
