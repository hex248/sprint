import { calculateBreakTimeMs, calculateWorkTimeMs } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getInactiveTimedSessions } from "../../db/queries";

// GET /timer?issueId=123
export default async function timerGetInactive(req: AuthedRequest) {
    const url = new URL(req.url);
    const issueId = url.searchParams.get("issueId");
    if (!issueId || Number.isNaN(Number(issueId))) {
        return new Response("missing issue id", { status: 400 });
    }
    const sessions = await getInactiveTimedSessions(Number(issueId));

    if (!sessions[0] || !sessions) {
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
