import { OrgCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { createOrganisationWithOwner, getOrganisationBySlug } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { name, slug, description } = parsed.data;

    const existingOrganisation = await getOrganisationBySlug(slug);
    if (existingOrganisation) {
        return errorResponse(`organisation with slug "${slug}" already exists`, "SLUG_TAKEN", 409);
    }

    const organisation = await createOrganisationWithOwner(name, slug, req.userId, description);

    return Response.json(organisation);
}
