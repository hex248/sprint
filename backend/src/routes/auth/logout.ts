import type { AuthedRequest } from "../../auth/middleware";
import { buildClearAuthCookie } from "../../auth/utils";
import { deleteSession } from "../../db/queries";

export default async function logout(req: AuthedRequest) {
    if (req.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    await deleteSession(req.sessionId);

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Set-Cookie": buildClearAuthCookie(),
        },
    });
}
