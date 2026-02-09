import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    appendTimestamp,
    createGlobalTimedSession,
    endAllActiveIssueTimers,
    getActiveGlobalTimedSession,
} from "../../db/queries";

export default async function timerToggleGlobal(req: AuthedRequest) {
    // end any active issue timers before starting/resuming global timer
    await endAllActiveIssueTimers(req.userId);

    const activeSession = await getActiveGlobalTimedSession(req.userId);

    if (!activeSession) {
        const newSession = await createGlobalTimedSession(req.userId);
        return Response.json({
            ...newSession,
            workTimeMs: 0,
            breakTimeMs: 0,
            isRunning: true,
        });
    }

    const updated = await appendTimestamp(activeSession.id, activeSession.timestamps);
    if (!updated) {
        return Response.json({ error: "failed to update timer", code: "UPDATE_FAILED" }, { status: 500 });
    }

    const running = isTimerRunning(updated.timestamps);

    return Response.json({
        ...updated,
        workTimeMs: calculateWorkTimeMs(updated.timestamps),
        breakTimeMs: calculateBreakTimeMs(updated.timestamps),
        isRunning: running,
    });
}
