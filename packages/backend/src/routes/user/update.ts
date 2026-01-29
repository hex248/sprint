import { UserUpdateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { hashPassword } from "../../auth/utils";
import { getSubscriptionByUserId, getUserById } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function update(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, UserUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { name, password, avatarURL, iconPreference } = parsed.data;

    const user = await getUserById(req.userId);
    if (!user) {
        return errorResponse("user not found", "USER_NOT_FOUND", 404);
    }

    if (!name && !password && avatarURL === undefined && !iconPreference) {
        return errorResponse(
            "at least one of name, password, avatarURL, or iconPreference must be provided",
            "NO_UPDATES",
            400,
        );
    }

    // block free users from changing icon preference
    if (iconPreference !== undefined && iconPreference !== user.iconPreference) {
        const subscription = await getSubscriptionByUserId(req.userId);
        const isPro = subscription?.status === "active";
        if (!isPro) {
            return errorResponse(
                "icon style customization is only available on Pro. Upgrade to customize your icon style.",
                "ICON_STYLE_PRO_ONLY",
                403,
            );
        }
    }

    let passwordHash: string | undefined;
    if (password !== undefined) {
        passwordHash = await hashPassword(password);
    }

    const { updateById } = await import("../../db/queries/users");
    const updatedUser = await updateById(user.id, { name, passwordHash, avatarURL, iconPreference });

    if (!updatedUser) {
        return errorResponse("failed to update user", "UPDATE_FAILED", 500);
    }

    return Response.json(updatedUser);
}
