import { calculateBreakTimeMs, calculateWorkTimeMs, GlobalTimerQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getInactiveGlobalTimedSessions, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function timerGetInactiveGlobal(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, GlobalTimerQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const sessions = await getInactiveGlobalTimedSessions(req.userId, organisationId);

    const enriched = sessions.map((session) => ({
        ...session,
        workTimeMs: calculateWorkTimeMs(session.timestamps),
        breakTimeMs: calculateBreakTimeMs(session.timestamps),
    }));

    return Response.json(enriched);
}
