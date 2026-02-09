import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@sprint/shared";
import type { AuthedRequest } from "../auth/middleware";
import { getActiveTimedSessionsWithIssueIncludingGlobal, getUserTimedSessions } from "../db/queries";

// GET /timers?limit=50&offset=0
export default async function timers(req: AuthedRequest) {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");
    const activeOnlyParam = url.searchParams.get("activeOnly");

    const limit = limitParam ? Number(limitParam) : 50;
    const offset = offsetParam ? Number(offsetParam) : 0;
    const activeOnly = activeOnlyParam === "true" || activeOnlyParam === "1";

    if (activeOnly) {
        const sessions = await getActiveTimedSessionsWithIssueIncludingGlobal(req.userId);
        const enriched = sessions.map((session) => ({
            id: session.id,
            issueId: session.issueId,
            issueNumber: session.issueNumber,
            projectKey: session.projectKey,
            timestamps: session.timestamps,
            endedAt: session.endedAt,
            workTimeMs: calculateWorkTimeMs(session.timestamps),
            breakTimeMs: calculateBreakTimeMs(session.timestamps),
            isRunning: isTimerRunning(session.timestamps),
        }));

        return Response.json(enriched);
    }

    const sessions = await getUserTimedSessions(req.userId, limit, offset);

    const enriched = sessions.map((session) => ({
        ...session,
        workTimeMs: calculateWorkTimeMs(session.timestamps),
        breakTimeMs: calculateBreakTimeMs(session.timestamps),
        isRunning: session.endedAt === null && isTimerRunning(session.timestamps),
    }));

    return Response.json(enriched);
}
