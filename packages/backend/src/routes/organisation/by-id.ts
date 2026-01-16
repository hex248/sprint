import { OrgByIdQuerySchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { getOrganisationById } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function organisationById(req: BunRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, OrgByIdQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const organisation = await getOrganisationById(id);
    if (!organisation) {
        return errorResponse(`organisation with id ${id} not found`, "ORG_NOT_FOUND", 404);
    }

    return Response.json(organisation);
}
