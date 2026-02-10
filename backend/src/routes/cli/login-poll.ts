import { CliLoginPollRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import {
    CLI_LOGIN_POLL_RATE_LIMIT,
    getClientIP,
    rateLimitResponse,
    recordRateLimitAttempt,
} from "../../auth/rate-limit";
import { generateToken } from "../../auth/utils";
import {
    expireCliLoginCode,
    getCliLoginCodeByDeviceHash,
    getSession,
    touchCliLoginCodePoll,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";
import { hashCode } from "./utils";

export default async function cliLoginPoll(req: BunRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const parsed = await parseJsonBody(req, CliLoginPollRequestSchema);
    if ("error" in parsed) return parsed.error;

    const deviceCodeHash = await hashCode(parsed.data.deviceCode);
    const rateLimitKey = `cli-login-poll:ip:${getClientIP(req)}:device:${deviceCodeHash}`;
    const attempt = recordRateLimitAttempt(rateLimitKey, CLI_LOGIN_POLL_RATE_LIMIT);
    if (!attempt.allowed) {
        return rateLimitResponse(attempt.retryAfterMs);
    }

    const code = await getCliLoginCodeByDeviceHash(deviceCodeHash);
    if (!code) {
        return errorResponse("invalid device code", "INVALID_DEVICE_CODE", 400);
    }

    const now = new Date();
    if (code.expiresAt < now && code.status === "pending") {
        await expireCliLoginCode(code.id);
        return Response.json({ status: "expired" });
    }

    if (code.status === "pending") {
        await touchCliLoginCodePoll(code.id);
        const expiresInSeconds = Math.max(0, Math.floor((code.expiresAt.getTime() - now.getTime()) / 1000));
        return Response.json({
            status: "pending",
            intervalSeconds: code.pollIntervalSeconds,
            expiresInSeconds,
        });
    }

    if (code.status === "denied") {
        return Response.json({ status: "denied" });
    }

    if (code.status === "expired") {
        return Response.json({ status: "expired" });
    }

    if (code.status === "approved" && code.sessionId && code.approvedByUserId) {
        const session = await getSession(code.sessionId);
        if (!session || session.expiresAt < now) {
            return Response.json({ status: "expired" });
        }

        const token = generateToken(code.sessionId, code.approvedByUserId);
        return Response.json({
            status: "approved",
            token,
            csrfToken: session.csrfToken,
        });
    }

    return Response.json({ status: "expired" });
}
