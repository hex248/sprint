import type { TimerState } from "@issue/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { timer } from "@/lib/server";
import { cn, formatTime } from "@/lib/utils";

export function IssueTimer({ issueId, onEnd }: { issueId: number; onEnd?: (data: TimerState) => void }) {
    const [timerState, setTimerState] = useState<TimerState>(null);
    const [displayTime, setDisplayTime] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // fetch current timer state on mount
    useEffect(() => {
        timer.get({
            issueId,
            onSuccess: (data) => {
                setTimerState(data);
                if (data) {
                    setDisplayTime(data.workTimeMs);
                }
            },
            onError: setError,
        });
    }, [issueId]);

    // update display time every second when running
    useEffect(() => {
        if (!timerState?.isRunning) return;

        const startTime = Date.now();
        const baseTime = timerState.workTimeMs;

        const interval = setInterval(() => {
            setDisplayTime(baseTime + (Date.now() - startTime));
        }, 1000);

        return () => clearInterval(interval);
    }, [timerState?.isRunning, timerState?.workTimeMs]);

    const handleToggle = () => {
        timer.toggle({
            issueId,
            onSuccess: (data) => {
                setTimerState(data);
                setDisplayTime(data.workTimeMs);
                setError(null);
            },
            onError: setError,
        });
    };

    const handleEnd = () => {
        timer.end({
            issueId,
            onSuccess: (data) => {
                setTimerState(data);
                setDisplayTime(data.workTimeMs);
                setError(null);
                onEnd?.(data);
            },
            onError: setError,
        });
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <div className={cn("text-6xl", !timerState?.isRunning && "text-muted-foreground")}>
                {formatTime(displayTime)}
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-4">
                <Button onClick={handleToggle}>
                    {!timerState ? "Start" : timerState.isRunning ? "Pause" : "Resume"}
                </Button>
                <Button
                    onClick={handleEnd}
                    variant="outline"
                    disabled={!timerState || timerState.endedAt != null}
                >
                    End
                </Button>
            </div>
        </div>
    );
}
