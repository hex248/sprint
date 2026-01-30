import { OrgByIdQuerySchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { exportOrganisation } from "../../db/queries/export";
import { getOrganisationById, getOrganisationMemberRole } from "../../db/queries/organisations";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function organisationExport(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, OrgByIdQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { id } = parsed.data;
    const { userId } = req;

    // check if organisation exists
    const organisation = await getOrganisationById(id);
    if (!organisation) {
        return errorResponse(`organisation with id ${id} not found`, "ORG_NOT_FOUND", 404);
    }

    // check if user is admin or owner
    const memberRole = await getOrganisationMemberRole(id, userId);
    if (!memberRole || (memberRole.role !== "owner" && memberRole.role !== "admin")) {
        return errorResponse("only organisation admins and owners can export data", "FORBIDDEN", 403);
    }

    const exportData = await exportOrganisation(id);
    if (!exportData) {
        return errorResponse("failed to export organisation data", "EXPORT_FAILED", 500);
    }

    // add metadata to export
    const exportWithMetadata = {
        ...exportData,
        _metadata: {
            exportedAt: new Date().toISOString(),
            exportedBy: userId,
            version: "1.0",
        },
    };

    return Response.json(exportWithMetadata);
}
