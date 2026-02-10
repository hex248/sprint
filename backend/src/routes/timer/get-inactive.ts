import { calculateBreakTimeMs, calculateWorkTimeMs, TimerGetQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getInactiveTimedSessions } from "../../db/queries";
import { parseQueryParams } from "../../validation";

export default async function timerGetInactive(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, TimerGetQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { issueId } = parsed.data;

    const sessions = await getInactiveTimedSessions(issueId);

    if (!sessions || sessions.length === 0) {
        return Response.json(null);
    }

    return Response.json(
        sessions.map((session) => ({
            ...session,
            workTimeMs: calculateWorkTimeMs(session.timestamps),
            breakTimeMs: calculateBreakTimeMs(session.timestamps),
        })),
    );
}
