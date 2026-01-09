import type { AuthedRequest } from "../../auth/middleware";
import {
    getOrganisationById,
    getOrganisationMemberRole,
    getUserById,
    updateOrganisationMemberRole,
} from "../../db/queries";

// /organisation/update-member-role?organisationId=1&userId=2&role=admin
export default async function organisationUpdateMemberRole(req: AuthedRequest) {
    const url = new URL(req.url);
    const organisationId = url.searchParams.get("organisationId");
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role");
    if (!role || !["admin", "member"].includes(role)) {
        return new Response("Invalid role: must be either 'admin' or 'member'", { status: 400 });
    }

    if (!organisationId || !userId || !role) {
        return new Response(
            `missing parameters: ${!organisationId ? "organisationId " : ""}${!userId ? "userId " : ""}${!role ? "role" : ""}`,
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

    const user = await getUserById(userIdNumber);
    if (!user) {
        return new Response(`user with id ${userId} not found`, { status: 404 });
    }

    const requesterMember = await getOrganisationMemberRole(orgIdNumber, req.userId);
    if (!requesterMember) {
        return new Response("You are not a member of this organisation", { status: 403 });
    }

    let member = await getOrganisationMemberRole(orgIdNumber, userIdNumber);
    if (!member) {
        return new Response(`User with id ${userId} is not a member of this organisation`, { status: 404 });
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return new Response("Only owners and admins can update member roles", { status: 403 });
    }

    member = await updateOrganisationMemberRole(orgIdNumber, userIdNumber, role);

    return Response.json(member);
}
