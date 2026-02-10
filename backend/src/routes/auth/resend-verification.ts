import type { BunRequest } from "bun";
import type { AuthedRequest } from "../../auth/middleware";
import { createVerificationCode } from "../../db/queries";
import { getUserById } from "../../db/queries/users";
import { VerificationCode } from "../../emails";
import { sendEmailWithRetry } from "../../lib/email/service";
import { errorResponse } from "../../validation";

const resendAttempts = new Map<number, number[]>();

const MAX_RESENDS_PER_HOUR = 3;
const HOUR_IN_MS = 60 * 60 * 1000;

function canResend(userId: number): boolean {
    const now = Date.now();
    const attempts = resendAttempts.get(userId) || [];

    const recentAttempts = attempts.filter((time) => now - time < HOUR_IN_MS);

    if (recentAttempts.length >= MAX_RESENDS_PER_HOUR) {
        return false;
    }

    recentAttempts.push(now);
    resendAttempts.set(userId, recentAttempts);
    return true;
}

export default async function resendVerification(req: BunRequest | AuthedRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const authedReq = req as AuthedRequest;
    if (!authedReq.userId) {
        return errorResponse("unauthorized", "UNAUTHORIZED", 401);
    }

    if (!canResend(authedReq.userId)) {
        return errorResponse("too many resend attempts. please try again later", "RATE_LIMITED", 429);
    }

    const user = await getUserById(authedReq.userId);
    if (!user) {
        return errorResponse("user not found", "USER_NOT_FOUND", 404);
    }

    if (user.emailVerified) {
        return errorResponse("email already verified", "ALREADY_VERIFIED", 400);
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
        return errorResponse("failed to send verification email", "EMAIL_SEND_FAILED", 500);
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
