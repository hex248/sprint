import type { ReactNode } from "react";
import { useState } from "react";
import { getWorkTimeMs } from "@/components/timer-display";
import Icon from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { useEndTimer, useToggleTimer } from "@/lib/query/hooks";
import { parseError } from "@/lib/server";
import { cn, formatTime } from "@/lib/utils";

export function TimerControls({
  issueId,
  issueKey,
  timestamps,
  isRunning,
  totalTimeMs,
  disabled = false,
  size = "md",
  className,
}: {
  issueId: number;
  issueKey: ReactNode;
  timestamps?: string[] | null;
  isRunning?: boolean;
  totalTimeMs?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const toggleTimer = useToggleTimer();
  const endTimer = useEndTimer();
  const [error, setError] = useState<string | null>(null);

  const elapsedMs = getWorkTimeMs(timestamps ?? undefined);
  const resolvedTotalMs = totalTimeMs ?? elapsedMs;
  const running = Boolean(isRunning);
  const hasTimer = (timestamps?.length ?? 0) > 0;

  const handleToggle = async () => {
    if (disabled) return;
    try {
      await toggleTimer.mutateAsync({ issueId });
      setError(null);
    } catch (err) {
      setError(parseError(err as Error));
    }
  };

  const handleEnd = async () => {
    if (disabled) return;
    try {
      await endTimer.mutateAsync({ issueId });
      setError(null);
    } catch (err) {
      setError(parseError(err as Error));
    }
  };

  const isCompact = size === "sm";

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className={cn("flex items-center", isCompact ? "gap-2" : "gap-3")}>
        <div className="min-w-0 flex items-center">{issueKey}</div>
        <span className={cn("font-mono tabular-nums leading-none", isCompact ? "text-xs" : "text-sm")}>
          {formatTime(elapsedMs)}
        </span>
        <span
          className={cn(
            "font-mono tabular-nums leading-none text-muted-foreground",
            isCompact ? "text-[11.5px] font-300" : "text-xs font-300",
          )}
        >
          ({formatTime(resolvedTotalMs)})
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
