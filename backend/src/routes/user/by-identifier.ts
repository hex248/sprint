import { UserByIdentifierQuerySchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { getUserByIdentifier } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function userByIdentifier(req: BunRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, UserByIdentifierQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { identifier } = parsed.data;

    const user = await getUserByIdentifier(identifier);
    if (!user) {
        return errorResponse(`user with identifier '${identifier}' not found`, "USER_NOT_FOUND", 404);
    }

    return Response.json(user);
}
