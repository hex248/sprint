import { calculateBreakTimeMs, calculateWorkTimeMs } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { endActiveGlobalTimer } from "../../db/queries";

export default async function timerEndGlobal(req: AuthedRequest) {
    const ended = await endActiveGlobalTimer(req.userId);

    if (!ended) {
        return Response.json({ error: "no active global timer", code: "NO_ACTIVE_TIMER" }, { status: 404 });
    }

    return Response.json({
        ...ended,
        workTimeMs: calculateWorkTimeMs(ended.timestamps),
        breakTimeMs: calculateBreakTimeMs(ended.timestamps),
        isRunning: false,
    });
}
