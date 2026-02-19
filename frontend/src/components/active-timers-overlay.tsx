import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { GlobalTimerControls } from "@/components/global-timer-controls";
import { IssueModal } from "@/components/issue-modal";
import { useSessionSafe } from "@/components/session-provider";
import { TimerControls } from "@/components/timer-controls";
import { getWorkTimeMs } from "@/components/timer-display";
import { Button } from "@/components/ui/button";
import { useActiveTimers, useInactiveTimers, useIssueById } from "@/lib/query/hooks";
import { issueID } from "@/lib/utils";

const REFRESH_INTERVAL_MS = 10000;

export function ActiveTimersOverlay() {
  const { pathname } = useLocation();
  const session = useSessionSafe();
  const { data: activeTimers = [] } = useActiveTimers({
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled: Boolean(session?.user),
  });
  const [tick, setTick] = useState(0);

  const hasRunning = useMemo(() => activeTimers.some((timer) => timer.isRunning), [activeTimers]);

  // separate global timer from issue timers
  const globalTimer = useMemo(() => activeTimers.find((t) => t.issueId === null), [activeTimers]);
  const issueTimers = useMemo(
    () => activeTimers.filter((t) => t.issueId !== null) as IssueTimerData[],
    [activeTimers],
  );

  useEffect(() => {
    if (!hasRunning) return;
    const interval = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hasRunning]);

  void tick;

  if (!session?.user) return null;
  if (pathname !== "/issues" && pathname !== "/timeline") return null;

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-[calc(1rem+env(safe-area-inset-left))] z-50 flex flex-col gap-2">
      {issueTimers.map((timer) => (
        <ActiveTimerItem key={timer.id} timer={timer} />
      ))}
      <GlobalTimerControls
        timestamps={globalTimer?.timestamps ?? null}
        isRunning={globalTimer?.isRunning ?? false}
        className="border bg-background/95 pl-2 pr-1 py-1"
      />
    </div>
  );
}

type IssueTimerData = {
  id: number;
  issueId: number;
  issueNumber: number;
  projectKey: string;
  timestamps: string[];
  isRunning: boolean;
};

function ActiveTimerItem({ timer }: { timer: IssueTimerData }) {
  const { data: issueData } = useIssueById(timer.issueId);
  const { data: inactiveTimers = [] } = useInactiveTimers(timer.issueId, { refetchInterval: 10000 });
  const [open, setOpen] = useState(false);
  const issueKey = issueID(timer.projectKey, timer.issueNumber);

  const inactiveWorkTimeMs = inactiveTimers.reduce(
    (total, session) => total + getWorkTimeMs(session?.timestamps),
    0,
  );
  const currentWorkTimeMs = getWorkTimeMs(timer.timestamps);
  const totalWorkTimeMs = inactiveWorkTimeMs + currentWorkTimeMs;

  const issueKeyNode = issueData ? (
    <IssueModal
      issueData={issueData}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="link" size="none" className="text-sm tabular-nums truncate min-w-0 font-700">
          {issueKey}
        </Button>
      }
    />
  ) : (
    <Button variant="link" size="none" className="text-sm tabular-nums truncate min-w-0 font-700" disabled>
      {issueKey}
    </Button>
  );

  return (
    <TimerControls
      issueId={timer.issueId}
      issueKey={issueKeyNode}
      timestamps={timer.timestamps}
      isRunning={timer.isRunning}
      totalTimeMs={totalWorkTimeMs}
      className="border bg-background/95 pl-2 pr-1 py-1"
    />
  );
}
