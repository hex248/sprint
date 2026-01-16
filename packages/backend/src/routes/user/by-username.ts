import { UserByUsernameQuerySchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { getUserByUsername } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";

export default async function userByUsername(req: BunRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, UserByUsernameQuerySchema);
    if ("error" in parsed) return parsed.error;

    const { username } = parsed.data;

    const user = await getUserByUsername(username);
    if (!user) {
        return errorResponse(`user with username '${username}' not found`, "USER_NOT_FOUND", 404);
    }

    return Response.json(user);
}
