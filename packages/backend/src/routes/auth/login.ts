import { LoginRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { buildAuthCookie, generateToken, verifyPassword } from "../../auth/utils";
import { createSession, getUserByUsername } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function login(req: BunRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const parsed = await parseJsonBody(req, LoginRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { username, password } = parsed.data;

    const user = await getUserByUsername(username);
    if (!user) {
        return errorResponse("invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
        return errorResponse("invalid credentials", "INVALID_CREDENTIALS", 401);
    }

    const session = await createSession(user.id);
    if (!session) {
        return errorResponse("failed to create session", "SESSION_ERROR", 500);
    }

    const token = generateToken(session.id, user.id);

    return new Response(
        JSON.stringify({
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                avatarURL: user.avatarURL,
                iconPreference: user.iconPreference,
                emailVerified: user.emailVerified,
            },
            csrfToken: session.csrfToken,
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Set-Cookie": buildAuthCookie(token),
            },
        },
    );
}
