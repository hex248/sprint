import { calculateBreakTimeMs, calculateWorkTimeMs, GlobalTimerEndRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { endActiveGlobalTimer, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function timerEndGlobal(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, GlobalTimerEndRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const ended = await endActiveGlobalTimer(req.userId, organisationId);

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
