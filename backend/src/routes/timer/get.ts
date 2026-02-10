import {
    calculateBreakTimeMs,
    calculateWorkTimeMs,
    isTimerRunning,
    TimerGetQuerySchema,
} from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getActiveTimedSession } from "../../db/queries";
import { parseQueryParams } from "../../validation";

export default async function timerGet(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, TimerGetQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const activeSession = await getActiveTimedSession(req.userId, issueId);

    if (!activeSession) {
        return Response.json(null);
    }

    const running = isTimerRunning(activeSession.timestamps);

    return Response.json({
        ...activeSession,
        workTimeMs: calculateWorkTimeMs(activeSession.timestamps),
        breakTimeMs: calculateBreakTimeMs(activeSession.timestamps),
        isRunning: running,
    });
}
