import { IssuesReplaceTypeRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationMemberRole, replaceIssueType } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function issuesReplaceType(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, IssuesReplaceTypeRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, oldType, newType } = parsed.data;

    const membership = await getOrganisationMemberRole(organisationId, req.userId);
    if (!membership) {
        return errorResponse("not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (membership.role !== "owner" && membership.role !== "admin") {
        return errorResponse("only admins and owners can replace types", "PERMISSION_DENIED", 403);
    }

    const result = await replaceIssueType(organisationId, oldType, newType);

    return Response.json(result);
}
