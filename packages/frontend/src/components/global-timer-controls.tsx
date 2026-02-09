import { useState } from "react";
import { getWorkTimeMs } from "@/components/timer-display";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { useEndGlobalTimer, useInactiveGlobalTimers, useToggleGlobalTimer } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn, formatTime } from "@/lib/utils";

export function GlobalTimerControls({
  timestamps,
  isRunning,
  disabled = false,
  size = "md",
  className,
}: {
  timestamps?: string[] | null;
  isRunning?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const toggleTimer = useToggleGlobalTimer();
  const endTimer = useEndGlobalTimer();
  const { data: inactiveTimers = [] } = useInactiveGlobalTimers({ refetchInterval: 10000 });
  const [error, setError] = useState<string | null>(null);

  const currentWorkTimeMs = getWorkTimeMs(timestamps ?? undefined);
  const inactiveWorkTimeMs = inactiveTimers.reduce(
    (total, session) => total + getWorkTimeMs(session?.timestamps),
    0,
  );
  const totalWorkTimeMs = inactiveWorkTimeMs + currentWorkTimeMs;

  const running = Boolean(isRunning);
  const hasTimer = (timestamps?.length ?? 0) > 0;

  const handleToggle = async () => {
    if (disabled) return;
    try {
      await toggleTimer.mutateAsync();
      setError(null);
    } catch (err) {
      setError(parseError(err as Error));
    }
  };

  const handleEnd = async () => {
    if (disabled) return;
    try {
      await endTimer.mutateAsync();
      setError(null);
    } catch (err) {
      setError(parseError(err as Error));
    }
  };

  const isCompact = size === "sm";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("flex items-center", isCompact ? "gap-2" : "gap-3")}>
        <span className={cn("font-700 text-sm tabular-nums truncate min-w-0")}>GLOBAL</span>
        <span className={cn("font-mono tabular-nums leading-none", isCompact ? "text-xs" : "text-sm")}>
          {formatTime(currentWorkTimeMs)}
        </span>
        <span
          className={cn(
            "font-mono tabular-nums leading-none text-muted-foreground",
            isCompact ? "text-[11.5px] font-300" : "text-xs font-300",
          )}
        >
          ({formatTime(totalWorkTimeMs)})
        </span>
        <div className={cn("ml-auto flex items-center", isCompact ? "gap-1" : "gap-2")}>
          <IconButton
            size={"sm"}
            aria-label={running ? "Pause timer" : "Resume timer"}
            disabled={disabled}
            onClick={handleToggle}
          >
            {running ? (
              <Icon icon="pause" size={isCompact ? 14 : 16} />
            ) : (
              <Icon icon="play" size={isCompact ? 14 : 16} />
            )}
          </IconButton>
          <IconButton size={"sm"} aria-label="End timer" disabled={disabled || !hasTimer} onClick={handleEnd}>
            <Icon icon="stop" size={isCompact ? 14 : 16} color={"var(--destructive)"} />
          </IconButton>
        </div>
      </div>
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </div>
  );
}
