import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationsByUserId } from "../../db/queries";

export default async function organisationsByUser(req: AuthedRequest) {
    const organisations = await getOrganisationsByUserId(req.userId);

    return Response.json(organisations);
}
