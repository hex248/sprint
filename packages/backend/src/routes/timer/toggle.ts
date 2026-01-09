import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { appendTimestamp, createTimedSession, getActiveTimedSession } from "../../db/queries";

// POST /timer/toggle?issueId=123
export default async function timerToggle(req: AuthedRequest) {
    const url = new URL(req.url);
    const issueId = url.searchParams.get("issueId");
    if (!issueId || Number.isNaN(Number(issueId))) {
        return new Response("missing issue id", { status: 400 });
    }

    const activeSession = await getActiveTimedSession(req.userId, Number(issueId));

    if (!activeSession) {
        // no active session, create new one with first timestamp
        const newSession = await createTimedSession(req.userId, Number(issueId));
        return Response.json({
            ...newSession,
            workTimeMs: 0,
            breakTimeMs: 0,
            isRunning: true,
        });
    }

    // active session exists, append timestamp (toggle)
    const updated = await appendTimestamp(activeSession.id, activeSession.timestamps);
    if (!updated) {
        return new Response("failed to update timer", { status: 500 });
    }

    const running = isTimerRunning(updated.timestamps);

    return Response.json({
        ...updated,
        workTimeMs: calculateWorkTimeMs(updated.timestamps),
        breakTimeMs: calculateBreakTimeMs(updated.timestamps),
        isRunning: running,
    });
}
