import { OrgDeleteRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { deleteOrganisation, getOrganisationById, getOrganisationMemberRole } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationDelete(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const organisation = await getOrganisationById(id);
    if (!organisation) {
        return errorResponse(`organisation with id ${id} not found`, "ORG_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(id, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (requesterMember.role !== "owner") {
        return errorResponse("only owners can delete organisations", "PERMISSION_DENIED", 403);
    }

    await deleteOrganisation(id);

    return Response.json({ success: true });
}
