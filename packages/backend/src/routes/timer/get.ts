import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getActiveTimedSession } from "../../db/queries";

// GET /timer?issueId=123
export default async function timerGet(req: AuthedRequest) {
    const url = new URL(req.url);
    const issueId = url.searchParams.get("issueId");
    if (!issueId || Number.isNaN(Number(issueId))) {
        return new Response("missing issue id", { status: 400 });
    }
    const activeSession = await getActiveTimedSession(req.userId, Number(issueId));

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
