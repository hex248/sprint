import type { BunRequest } from "bun";
import { generateToken, hashPassword } from "../../auth/utils";
import { createUser, getUserByUsername } from "../../db/queries";

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

export default async function register(req: BunRequest) {
    if (req.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return new Response("invalid JSON", { status: 400 });
    }

    if (!body || typeof body !== "object") {
        return new Response("invalid request body", { status: 400 });
    }

    const { name, username, password, avatarURL } = body as Record<string, unknown>;

    if (!isNonEmptyString(name) || !isNonEmptyString(username) || !isNonEmptyString(password)) {
        return new Response("name, username, and password are required", { status: 400 });
    }

    if (username.length < 1 || username.length > 32) {
        return new Response("username must be 1-32 characters", { status: 400 });
    }

    if (password.length < 8) {
        return new Response("password must be at least 8 characters", { status: 400 });
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        return new Response("password must contain uppercase, lowercase, and numbers", { status: 400 });
    }

    const existing = await getUserByUsername(username);
    if (existing) {
        return new Response("username already taken", { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(name, username, passwordHash, avatarURL as string | undefined);
    if (!user) {
        return new Response("failed to create user", { status: 500 });
    }

    const token = generateToken(user.id);

    return Response.json({
        token,
        user,
    });
}
