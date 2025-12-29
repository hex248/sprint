import type { AuthedRequest } from "../../auth/middleware";
import { createOrganisationWithOwner, getOrganisationBySlug } from "../../db/queries";

// /organisation/create?name=Org%20Name&slug=org-name&userId=1&description=Optional%20description
export default async function organisationCreate(req: AuthedRequest) {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    const slug = url.searchParams.get("slug");
    const userId = url.searchParams.get("userId");
    const description = url.searchParams.get("description") || undefined;

    if (!name || !slug || !userId) {
        return new Response(
            `missing parameters: ${!name ? "name " : ""}${!slug ? "slug " : ""}${!userId ? "userId" : ""}`,
            { status: 400 },
        );
    }

    const userIdNumber = Number(userId);
    if (!Number.isInteger(userIdNumber)) {
        return new Response("userId must be an integer", { status: 400 });
    }

    // users can only create organisations for themselves (userId cannot be spoofed)
    if (req.userId !== userIdNumber) {
        return new Response("access denied: you can only create organisations for yourself", { status: 403 });
    }

    const existingOrganisation = await getOrganisationBySlug(slug);
    if (existingOrganisation) {
        return new Response(`organisation with slug "${slug}" already exists`, { status: 409 });
    }

    const organisation = await createOrganisationWithOwner(name, slug, userIdNumber, description);

    return Response.json(organisation);
}
