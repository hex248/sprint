import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@sprint/shared";
import { z } from "zod";
import type { AuthedRequest } from "../auth/middleware";
import {
    getActiveTimedSessionsWithIssueIncludingGlobal,
    getOrganisationMemberRole,
    getUserTimedSessions,
} from "../db/queries";
import { errorResponse, parseQueryParams } from "../validation";

const TimersQuerySchema = z.object({
    limit: z.coerce.number().int().positive().optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    activeOnly: z.coerce.boolean().optional(),
    organisationId: z.coerce.number().int().positive(),
});

export default async function timers(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, TimersQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { limit = 50, offset = 0, activeOnly = false, organisationId } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (activeOnly) {
        const sessions = await getActiveTimedSessionsWithIssueIncludingGlobal(req.userId, organisationId);
        const enriched = sessions.map((session) => ({
            id: session.id,
            issueId: session.issueId,
            issueNumber: session.issueNumber,
            projectKey: session.projectKey,
            timestamps: session.timestamps,
            endedAt: session.endedAt,
            workTimeMs: calculateWorkTimeMs(session.timestamps),
            breakTimeMs: calculateBreakTimeMs(session.timestamps),
            isRunning: isTimerRunning(session.timestamps),
        }));

        return Response.json(enriched);
    }

    const sessions = await getUserTimedSessions(req.userId, organisationId, limit, offset);

    const enriched = sessions.map((session) => ({
        ...session,
        workTimeMs: calculateWorkTimeMs(session.timestamps),
        breakTimeMs: calculateBreakTimeMs(session.timestamps),
        isRunning: session.endedAt === null && isTimerRunning(session.timestamps),
    }));

    return Response.json(enriched);
}
