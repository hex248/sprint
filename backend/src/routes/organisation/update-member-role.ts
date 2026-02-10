import { OrgUpdateMemberRoleRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getOrganisationById,
    getOrganisationMemberRole,
    getUserById,
    updateOrganisationMemberRole,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationUpdateMemberRole(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgUpdateMemberRoleRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId, userId, role } = parsed.data;

    const organisation = await getOrganisationById(organisationId);
    if (!organisation) {
        return errorResponse(`organisation with id ${organisationId} not found`, "ORG_NOT_FOUND", 404);
    }

    const user = await getUserById(userId);
    if (!user) {
        return errorResponse(`user with id ${userId} not found`, "USER_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    let member = await getOrganisationMemberRole(organisationId, userId);
    if (!member) {
        return errorResponse(
            `user with id ${userId} is not a member of this organisation`,
            "NOT_MEMBER",
            404,
        );
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse("only owners and admins can update member roles", "PERMISSION_DENIED", 403);
    }

    member = await updateOrganisationMemberRole(organisationId, userId, role);

    return Response.json(member);
}
