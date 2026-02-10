import { VerifyEmailRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import type { AuthedRequest } from "../../auth/middleware";
import { verifyCode } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function verifyEmail(req: BunRequest | AuthedRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const authedReq = req as AuthedRequest;
    if (!authedReq.userId) {
        return errorResponse("unauthorized", "UNAUTHORIZED", 401);
    }

    const parsed = await parseJsonBody(req, VerifyEmailRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { code } = parsed.data;

    const result = await verifyCode(authedReq.userId, code);

    if (!result.success) {
        return errorResponse(result.error || "verification failed", "VERIFICATION_FAILED", 400);
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
    });
}
