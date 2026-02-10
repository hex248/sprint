import { RegisterRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import { buildAuthCookie, generateToken, hashPassword } from "../../auth/utils";
import {
    createOrganisationWithOwner,
    createProject,
    createSession,
    createUser,
    createVerificationCode,
    getOrganisationBySlug,
    getProjectByKey,
    getUserByUsername,
} from "../../db/queries";
import { getUserByEmail } from "../../db/queries/users";
import { VerificationCode } from "../../emails";
import { sendEmailWithRetry } from "../../lib/email/service";
import { errorResponse, parseJsonBody } from "../../validation";

function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

function generateProjectKey(name: string) {
    const key = name
        .replace(/[^a-zA-Z]/g, "")
        .toUpperCase()
        .slice(0, 4);
    if (key.length < 2) return "PROJ";
    return key;
}

export default async function register(req: BunRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const parsed = await parseJsonBody(req, RegisterRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { name, username, email, password, avatarURL } = parsed.data;

    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
        return errorResponse("username already taken", "USERNAME_TAKEN", 400);
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
        return errorResponse("email already registered", "EMAIL_TAKEN", 400);
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(name, username, email, passwordHash, avatarURL);
    if (!user) {
        return errorResponse("failed to create user", "USER_CREATE_ERROR", 500);
    }

    // create starter organisation and project
    try {
        const orgName = `${user.name}'s Organisation`;
        let orgSlug = slugify(orgName);

        // check for slug collision
        const existingOrg = await getOrganisationBySlug(orgSlug);
        if (existingOrg) {
            orgSlug = `${orgSlug}-${Math.floor(Math.random() * 1000)}`;
        }

        const org = await createOrganisationWithOwner(orgName, orgSlug, user.id);

        const projectName = `${user.name}'s Project`;
        let projectKey = generateProjectKey(projectName);

        // check for key collision
        const existingProject = await getProjectByKey(projectKey);
        if (existingProject) {
            projectKey = `${projectKey.slice(0, 2)}${Math.floor(Math.random() * 100)}`.slice(0, 4);
        }

        await createProject(projectKey, projectName, user.id, org.id);
    } catch (error) {
        console.error("Failed to create default organisation/project:", error);
        // we don't fail registration if this fails, but it's not ideal
    }

    const session = await createSession(user.id);
    if (!session) {
        return errorResponse("failed to create session", "SESSION_ERROR", 500);
    }

    const verification = await createVerificationCode(user.id);

    try {
        await sendEmailWithRetry({
            to: user.email,
            subject: "Verify your Sprint account",
            template: VerificationCode({ code: verification.code }),
        });
    } catch (error) {
        console.error("Failed to send verification email:", error);
        // don't fail registration if email fails - user can resend
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
