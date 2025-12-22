import type { UserRecord } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getUserById } from "../../db/queries";

export default async function me(req: AuthedRequest) {
    const user = await getUserById(req.userId);
    if (!user) {
        return new Response("user not found", { status: 404 });
    }

    return Response.json(user as UserRecord);
}
