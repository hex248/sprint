import { OrgMembersQuerySchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { getOrganisationById, getOrganisationMembers } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function organisationMembers(req: BunRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, OrgMembersQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId } = parsed.data;

    const organisation = await getOrganisationById(organisationId);
    if (!organisation) {
        return errorResponse(`organisation with id ${organisationId} not found`, "ORG_NOT_FOUND", 404);
    }

    const members = await getOrganisationMembers(organisationId);

    return Response.json(members);
}
