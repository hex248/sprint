import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@sprint/shared";
import type { AuthedRequest } from "../auth/middleware";
import { getUserTimedSessions } from "../db/queries";

// GET /timers?limit=50&offset=0
export default async function timers(req: AuthedRequest) {
    const url = new URL(req.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const limit = limitParam ? Number(limitParam) : 50;
    const offset = offsetParam ? Number(offsetParam) : 0;

    const sessions = await getUserTimedSessions(req.userId, limit, offset);

    const enriched = sessions.map((session) => ({
        ...session,
        workTimeMs: calculateWorkTimeMs(session.timestamps),
        breakTimeMs: calculateBreakTimeMs(session.timestamps),
        isRunning: session.endedAt === null && isTimerRunning(session.timestamps),
    }));

    return Response.json(enriched);
}
