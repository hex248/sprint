import type { BunRequest } from "bun";
import { getUserByUsername } from "../../db/queries";

// /user/by-username?username=someusername
export default async function userByUsername(req: BunRequest) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
        return new Response("username is required", { status: 400 });
    }

    const user = await getUserByUsername(username);
    if (!user) {
        return new Response(`User with username '${username}' not found`, { status: 404 });
    }

    return Response.json(user);
}
