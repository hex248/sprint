import type { UserRecord } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { hashPassword } from "../../auth/utils";
import { getUserById } from "../../db/queries";

// /user/update?id=1&name=NewName&password=NewPassword&avatarURL=...
export default async function update(req: AuthedRequest) {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return new Response("id is required", { status: 400 });
    }

    const user = await getUserById(Number(id));
    if (!user) {
        return new Response("user not found", { status: 404 });
    }

    const name = url.searchParams.get("name") || undefined;
    const password = url.searchParams.get("password") || undefined;
    const avatarURL =
        url.searchParams.get("avatarURL") === "null" ? null : url.searchParams.get("avatarURL") || undefined;
    let passwordHash: string | undefined;
    if (password !== undefined) {
        passwordHash = await hashPassword(password);
    }

    const { updateById } = await import("../../db/queries/users");
    const updatedUser = await updateById(user.id, { name, passwordHash, avatarURL });

    if (!updatedUser) {
        return new Response("failed to update user", { status: 500 });
    }

    return Response.json(updatedUser as UserRecord);
}
