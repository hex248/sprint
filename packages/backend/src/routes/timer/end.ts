import { calculateBreakTimeMs, calculateWorkTimeMs } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { endTimedSession, getActiveTimedSession } from "../../db/queries";

// POST /timer/end
export default async function timerEnd(req: AuthedRequest) {
    const url = new URL(req.url);
    const issueId = url.searchParams.get("issueId");
    if (!issueId || Number.isNaN(Number(issueId))) {
        return new Response("missing issue id", { status: 400 });
    }
    const activeSession = await getActiveTimedSession(req.userId, Number(issueId));

    if (!activeSession) {
        return new Response("no active timer", { status: 400 });
    }

    // already ended - return existing without modification
    if (activeSession.endedAt) {
        return Response.json({
            ...activeSession,
            workTimeMs: calculateWorkTimeMs(activeSession.timestamps),
            breakTimeMs: calculateBreakTimeMs(activeSession.timestamps),
            isRunning: false,
        });
    }

    const ended = await endTimedSession(activeSession.id, activeSession.timestamps);
    if (!ended) {
        return new Response("failed to end timer", { status: 500 });
    }

    return Response.json({
        ...ended,
        workTimeMs: calculateWorkTimeMs(ended.timestamps),
        breakTimeMs: calculateBreakTimeMs(ended.timestamps),
        isRunning: false,
    });
}
