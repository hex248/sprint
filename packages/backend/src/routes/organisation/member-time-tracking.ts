import { calculateBreakTimeMs, calculateWorkTimeMs, isTimerRunning } from "@sprint/shared";
import { z } from "zod";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getOrganisationById,
    getOrganisationMemberRole,
    getOrganisationMemberTimedSessions,
    getOrganisationOwner,
    getUserById,
} from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

const OrgMemberTimeTrackingQuerySchema = z.object({
    organisationId: z.coerce.number().int().positive("organisationId must be a positive integer"),
    fromDate: z.coerce.date().optional(),
});

// GET /organisation/member-time-tracking?organisationId=123&fromDate=2024-01-01
export default async function organisationMemberTimeTracking(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, OrgMemberTimeTrackingQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, fromDate } = parsed.data;

    // check organisation exists
    const organisation = await getOrganisationById(organisationId);
    if (!organisation) {
        return errorResponse(`organisation with id ${organisationId} not found`, "ORG_NOT_FOUND", 404);
    }

    const memberRole = await getOrganisationMemberRole(organisationId, req.userId);
    if (!memberRole) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const role = memberRole.role;
    if (role !== "owner" && role !== "admin") {
        return errorResponse("you must be an owner or admin to view member time tracking", "FORBIDDEN", 403);
    }

    // check if organisation owner has pro subscription
    const owner = await getOrganisationOwner(organisationId);
    const ownerUser = owner ? await getUserById(owner.userId) : null;
    const isPro = ownerUser?.plan === "pro";

    const sessions = await getOrganisationMemberTimedSessions(organisationId, fromDate);

    const enriched = sessions.map((session) => {
        const timestamps = session.timestamps.map((t) => new Date(t));
        const actualWorkTimeMs = calculateWorkTimeMs(timestamps);
        const actualBreakTimeMs = calculateBreakTimeMs(timestamps);

        return {
            id: session.id,
            userId: session.userId,
            issueId: session.issueId,
            issueNumber: session.issueNumber,
            projectKey: session.projectKey,
            timestamps: isPro ? session.timestamps : [],
            endedAt: isPro ? session.endedAt : null,
            createdAt: isPro ? session.createdAt : null,
            workTimeMs: isPro ? actualWorkTimeMs : 0,
            breakTimeMs: isPro ? actualBreakTimeMs : 0,
            isRunning: isPro ? session.endedAt === null && isTimerRunning(timestamps) : false,
        };
    });

    return Response.json(enriched);
}
