import { UserUpdateRequestSchema } from "@issue/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { hashPassword } from "../../auth/utils";
import { getUserById } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function update(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, UserUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { name, password, avatarURL } = parsed.data;

    const user = await getUserById(req.userId);
    if (!user) {
        return errorResponse("user not found", "USER_NOT_FOUND", 404);
    }

    if (!name && !password && avatarURL === undefined) {
        return errorResponse(
            "at least one of name, password, or avatarURL must be provided",
            "NO_UPDATES",
            400,
        );
    }

    let passwordHash: string | undefined;
    if (password !== undefined) {
        passwordHash = await hashPassword(password);
    }

    const { updateById } = await import("../../db/queries/users");
    const updatedUser = await updateById(user.id, { name, passwordHash, avatarURL });

    if (!updatedUser) {
        return errorResponse("failed to update user", "UPDATE_FAILED", 500);
    }

    return Response.json(updatedUser);
}
