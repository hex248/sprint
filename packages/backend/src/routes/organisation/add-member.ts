import { OrgAddMemberRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createOrganisationMember,
    getOrganisationById,
    getOrganisationMemberRole,
    getUserById,
} from "../../db/queries";
import { updateSeatCount } from "../../lib/seats";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationAddMember(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgAddMemberRequestSchema);
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

    const existingMember = await getOrganisationMemberRole(organisationId, userId);
    if (existingMember) {
        return errorResponse("user is already a member of this organisation", "ALREADY_MEMBER", 409);
    }

    const requesterMember = await getOrganisationMemberRole(organisationId, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse("only owners and admins can add members", "PERMISSION_DENIED", 403);
    }

    const member = await createOrganisationMember(organisationId, userId, role);

    // update seat count if the requester is the owner
    if (requesterMember.role === "owner") {
        await updateSeatCount(req.userId);
    }

    return Response.json(member);
}
