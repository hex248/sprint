import type { UserRecord } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getUserById } from "../../db/queries";

export default async function me(req: AuthedRequest) {
    const user = await getUserById(req.userId);
    if (!user) {
        return new Response("user not found", { status: 404 });
    }

    const { passwordHash: _, ...safeUser } = user;

    return Response.json({
        user: safeUser as Omit<UserRecord, "passwordHash">,
        csrfToken: req.csrfToken,
        emailVerified: user.emailVerified,
    });
}
