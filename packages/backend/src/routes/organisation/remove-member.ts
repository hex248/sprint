import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationById, getOrganisationMemberRole, removeOrganisationMember } from "../../db/queries";

// /organisation/remove-member?organisationId=1&userId=2
export default async function organisationRemoveMember(req: AuthedRequest) {
    const url = new URL(req.url);
    const organisationId = url.searchParams.get("organisationId");
    const userId = url.searchParams.get("userId");

    if (!organisationId || !userId) {
        return new Response(
            `missing parameters: ${!organisationId ? "organisationId " : ""}${!userId ? "userId" : ""}`,
            { status: 400 },
        );
    }

    const orgIdNumber = Number(organisationId);
    const userIdNumber = Number(userId);

    if (!Number.isInteger(orgIdNumber) || !Number.isInteger(userIdNumber)) {
        return new Response("organisationId and userId must be integers", { status: 400 });
    }

    const organisation = await getOrganisationById(orgIdNumber);
    if (!organisation) {
        return new Response(`organisation with id ${organisationId} not found`, { status: 404 });
    }

    const memberToRemove = await getOrganisationMemberRole(orgIdNumber, userIdNumber);
    if (!memberToRemove) {
        return new Response("User is not a member of this organisation", { status: 404 });
    }

    if (memberToRemove.role === "owner") {
        return new Response("Cannot remove the organisation owner", { status: 403 });
    }

    const requesterMember = await getOrganisationMemberRole(orgIdNumber, req.userId);
    if (!requesterMember) {
        return new Response("You are not a member of this organisation", { status: 403 });
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return new Response("Only owners and admins can remove members", { status: 403 });
    }

    await removeOrganisationMember(orgIdNumber, userIdNumber);

    return Response.json({ success: true });
}
