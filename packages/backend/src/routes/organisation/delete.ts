import { OrgDeleteRequestSchema } from "@issue/shared";
import type { BunRequest } from "bun";
import { deleteOrganisation, getOrganisationById } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationDelete(req: BunRequest) {
    const parsed = await parseJsonBody(req, OrgDeleteRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;

    const organisation = await getOrganisationById(id);
    if (!organisation) {
        return errorResponse(`organisation with id ${id} not found`, "ORG_NOT_FOUND", 404);
    }

    await deleteOrganisation(id);

    return Response.json({ success: true });
}
