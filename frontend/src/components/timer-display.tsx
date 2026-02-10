import { calculateWorkTimeMs } from "@sprint/shared";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useInactiveTimers, useTimerState } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { formatTime } from "@/lib/utils";

const FALLBACK_TIME = "--:--:--";
const REFRESH_INTERVAL_MS = 10000;

export function getWorkTimeMs(timestamps: string[] | undefined): number {
  if (!timestamps?.length) return 0;
  const dates = timestamps.map((t) => new Date(t));
  return calculateWorkTimeMs(dates);
}

export function TimerDisplay({ issueId }: { issueId: number }) {
  const { data: timerState, error: timerError } = useTimerState(issueId, {
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  const { data: inactiveTimers = [], error: inactiveError } = useInactiveTimers(issueId, {
    refetchInterval: REFRESH_INTERVAL_MS,
  });

  const [tick, setTick] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const combinedError = timerError ?? inactiveError;

  useEffect(() => {
    if (combinedError) {
      const message = parseError(combinedError as Error);
      setError(message);
      toast.error(`Error fetching timer data: ${message}`, {
        dismissible: false,
      });
      return;
    }
    setError(null);
  }, [combinedError]);

  useEffect(() => {
    if (!timerState?.isRunning) return;

    const interval = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerState?.isRunning]);

  const inactiveWorkTimeMs = useMemo(
    () => inactiveTimers.reduce((total, session) => total + getWorkTimeMs(session?.timestamps), 0),
    [inactiveTimers],
  );

  void tick;
  const currentWorkTimeMs = getWorkTimeMs(timerState?.timestamps);
  const totalWorkTimeMs = inactiveWorkTimeMs + currentWorkTimeMs;
  const displayWorkTime = error ? FALLBACK_TIME : formatTime(totalWorkTimeMs);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="font-mono tabular-nums">{displayWorkTime}</span>
    </div>
  );
}
