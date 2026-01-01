import type { AuthedRequest } from "../../auth/middleware";
import {
    createOrganisationMember,
    getOrganisationById,
    getOrganisationMemberRole,
    getUserById,
} from "../../db/queries";

// /organisation/add-member?organisationId=1&userId=2&role=member
export default async function organisationAddMember(req: AuthedRequest) {
    const url = new URL(req.url);
    const organisationId = url.searchParams.get("organisationId");
    const userId = url.searchParams.get("userId");
    const role = url.searchParams.get("role") || "member";

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

    const user = await getUserById(userIdNumber);
    if (!user) {
        return new Response(`user with id ${userId} not found`, { status: 404 });
    }

    const existingMember = await getOrganisationMemberRole(orgIdNumber, userIdNumber);
    if (existingMember) {
        return new Response("User is already a member of this organisation", { status: 409 });
    }

    const requesterMember = await getOrganisationMemberRole(orgIdNumber, req.userId);
    if (!requesterMember) {
        return new Response("You are not a member of this organisation", { status: 403 });
    }

    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return new Response("Only owners and admins can add members", { status: 403 });
    }

    const member = await createOrganisationMember(orgIdNumber, userIdNumber, role);

    return Response.json(member);
}
