import {
    calculateBreakTimeMs,
    calculateWorkTimeMs,
    GlobalTimerQuerySchema,
    isTimerRunning,
} from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getActiveGlobalTimedSession, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function timerGetGlobal(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, GlobalTimerQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const session = await getActiveGlobalTimedSession(req.userId, organisationId);

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
