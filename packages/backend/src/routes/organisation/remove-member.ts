import { OrgRemoveMemberRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationById, getOrganisationMemberRole, removeOrganisationMember } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationRemoveMember(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgRemoveMemberRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, userId } = parsed.data;

    const organisation = await getOrganisationById(organisationId);
    if (!organisation) {
        return errorResponse(`organisation with id ${organisationId} not found`, "ORG_NOT_FOUND", 404);
    }

    const memberToRemove = await getOrganisationMemberRole(organisationId, userId);
    if (!memberToRemove) {
        return errorResponse("user is not a member of this organisation", "NOT_MEMBER", 404);
    }

    if (memberToRemove.role === "owner") {
        return errorResponse("cannot remove the organisation owner", "CANNOT_REMOVE_OWNER", 403);
    }

    const requesterMember = await getOrganisationMemberRole(organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse("only owners and admins can remove members", "PERMISSION_DENIED", 403);
    }

    await removeOrganisationMember(organisationId, userId);

    return Response.json({ success: true });
}
