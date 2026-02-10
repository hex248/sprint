import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getActiveGlobalTimedSession } from "../../db/queries";

export default async function timerGetGlobal(req: AuthedRequest) {
    const session = await getActiveGlobalTimedSession(req.userId);

    if (!session) {
        return Response.json(null);
    }

    return Response.json({
        ...session,
        workTimeMs: calculateWorkTimeMs(session.timestamps),
        breakTimeMs: calculateBreakTimeMs(session.timestamps),
        isRunning: isTimerRunning(session.timestamps),
    });
}
