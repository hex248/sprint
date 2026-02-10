import { calculateBreakTimeMs, calculateWorkTimeMs, TimerEndRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { endTimedSession, getActiveTimedSession } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function timerEnd(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, TimerEndRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const activeSession = await getActiveTimedSession(req.userId, issueId);

    if (!activeSession) {
        return errorResponse("no active timer", "NO_ACTIVE_TIMER", 400);
    }

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
        return errorResponse("failed to end timer", "END_FAILED", 500);
    }

    return Response.json({
        ...ended,
        workTimeMs: calculateWorkTimeMs(ended.timestamps),
        breakTimeMs: calculateBreakTimeMs(ended.timestamps),
        isRunning: false,
    });
}
