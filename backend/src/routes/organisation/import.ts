import { z } from "zod";
import type { AuthedRequest } from "../../auth/middleware";
import { importOrganisation } from "../../db/queries/import";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationImport(req: AuthedRequest) {
    try {
        const parsedBody = await parseJsonBody(req, z.any());
        if ("error" in parsedBody) return parsedBody.error;

        const imported = await importOrganisation(parsedBody.data, req.userId);
        if (!imported) {
            return errorResponse("failed to import organisation data", "IMPORT_FAILED", 500);
        }

        return Response.json(imported);
    } catch (error) {
        console.error(error);
        return errorResponse("failed to import organisation data", "IMPORT_FAILED", 500);
    }
}
