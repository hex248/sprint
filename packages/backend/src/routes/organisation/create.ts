import { OrgCreateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    createOrganisationWithOwner,
    FREE_TIER_LIMITS,
    getOrganisationBySlug,
    getUserById,
    getUserOrganisationCount,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationCreate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgCreateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { name, slug, description } = parsed.data;

    const existingOrganisation = await getOrganisationBySlug(slug);
    if (existingOrganisation) {
        return errorResponse(`organisation with slug "${slug}" already exists`, "SLUG_TAKEN", 409);
    }

    // check free tier limit
    const user = await getUserById(req.userId);
    if (user && user.plan !== "pro") {
        const orgCount = await getUserOrganisationCount(req.userId);
        if (orgCount >= FREE_TIER_LIMITS.organisationsPerUser) {
            return errorResponse(
                `free tier is limited to ${FREE_TIER_LIMITS.organisationsPerUser} organisation. upgrade to pro for unlimited organisations.`,
                "FREE_TIER_ORG_LIMIT",
                403,
            );
        }
    }

    const organisation = await createOrganisationWithOwner(name, slug, req.userId, description);

    return Response.json(organisation);
}
