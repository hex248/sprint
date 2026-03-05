import {
    calculateBreakTimeMs,
    calculateWorkTimeMs,
    GlobalTimerToggleRequestSchema,
    isTimerRunning,
} from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    appendTimestamp,
    createGlobalTimedSession,
    endAllActiveIssueTimers,
    getActiveGlobalTimedSession,
    getOrganisationMemberRole,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function timerToggleGlobal(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, GlobalTimerToggleRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    await endAllActiveIssueTimers(req.userId, organisationId);

    const activeSession = await getActiveGlobalTimedSession(req.userId, organisationId);

    if (!activeSession) {
        const newSession = await createGlobalTimedSession(req.userId, organisationId);
        return Response.json({
            ...newSession,
            workTimeMs: 0,
            breakTimeMs: 0,
            isRunning: true,
        });
    }

    const updated = await appendTimestamp(activeSession.id, activeSession.timestamps);
    if (!updated) {
        return Response.json({ error: "failed to update timer", code: "UPDATE_FAILED" }, { status: 500 });
    }

    const running = isTimerRunning(updated.timestamps);

    return Response.json({
        ...updated,
        workTimeMs: calculateWorkTimeMs(updated.timestamps),
        breakTimeMs: calculateBreakTimeMs(updated.timestamps),
        isRunning: running,
    });
}
