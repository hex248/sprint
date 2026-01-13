import { OrgUpdateRequestSchema } from "@issue/shared";
import type { BunRequest } from "bun";
import { getOrganisationById, updateOrganisation } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationUpdate(req: BunRequest) {
    const parsed = await parseJsonBody(req, OrgUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, name, description, slug, statuses } = parsed.data;

    const existingOrganisation = await getOrganisationById(id);
    if (!existingOrganisation) {
        return errorResponse(`organisation with id ${id} does not exist`, "ORG_NOT_FOUND", 404);
    }

    if (!name && !description && !slug && !statuses) {
        return errorResponse(
            "at least one of name, description, slug, or statuses must be provided",
            "NO_UPDATES",
            400,
        );
    }

    const organisation = await updateOrganisation(id, {
        name,
        description,
        slug,
        statuses,
    });

    return Response.json(organisation);
}
