import { ProjectByOrgQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationById, getOrganisationsByUserId, getProjectsByOrganisationId } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function projectsByOrganisation(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, ProjectByOrgQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { organisationId } = parsed.data;

    const organisation = await getOrganisationById(organisationId);
    if (!organisation) {
        return errorResponse(`organisation with id ${organisationId} not found`, "ORG_NOT_FOUND", 404);
    }

    const userOrganisations = await getOrganisationsByUserId(req.userId);
    const hasAccess = userOrganisations.some((item) => item.Organisation.id === organisationId);
    if (!hasAccess) {
        return errorResponse("access denied: you are not a member of this organisation", "NOT_MEMBER", 403);
    }

    const projects = await getProjectsByOrganisationId(organisationId);

    return Response.json(projects);
}
