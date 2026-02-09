import { calculateBreakTimeMs, calculateWorkTimeMs } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getInactiveGlobalTimedSessions } from "../../db/queries";

export default async function timerGetInactiveGlobal(req: AuthedRequest) {
    const sessions = await getInactiveGlobalTimedSessions(req.userId);

    const enriched = sessions.map((session) => ({
        ...session,
        workTimeMs: calculateWorkTimeMs(session.timestamps),
        breakTimeMs: calculateBreakTimeMs(session.timestamps),
    }));

    return Response.json(enriched);
}
