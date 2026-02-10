import { CliLoginStartRequestSchema } from "@sprint/shared";
import type { BunRequest } from "bun";
import {
    CLI_LOGIN_START_RATE_LIMIT,
    getClientIP,
    rateLimitResponse,
    recordRateLimitAttempt,
} from "../../auth/rate-limit";
import { createCliLoginCode } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";
import {
    CLI_LOGIN_EXPIRES_IN_SECONDS,
    CLI_LOGIN_INTERVAL_SECONDS,
    generateDeviceCode,
    generateUserCode,
    hashCode,
} from "./utils";

export default async function cliLoginStart(req: BunRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const rateLimitKey = `cli-login-start:ip:${getClientIP(req)}`;
    const attempt = recordRateLimitAttempt(rateLimitKey, CLI_LOGIN_START_RATE_LIMIT);
    if (!attempt.allowed) {
        return rateLimitResponse(attempt.retryAfterMs);
    }

    const parsed = await parseJsonBody(req, CliLoginStartRequestSchema);
    if ("error" in parsed) return parsed.error;

    const deviceCode = generateDeviceCode();
    const userCode = generateUserCode();
    const expiresAt = new Date(Date.now() + CLI_LOGIN_EXPIRES_IN_SECONDS * 1000);

    try {
        await createCliLoginCode({
            deviceCodeHash: await hashCode(deviceCode),
            userCodeHash: await hashCode(userCode),
            pollIntervalSeconds: CLI_LOGIN_INTERVAL_SECONDS,
            expiresAt,
        });
    } catch {
        return errorResponse("failed to create login code", "LOGIN_CODE_CREATE_FAILED", 500);
    }

    const verificationUri = (() => {
        if (process.env.CLI_LOGIN_VERIFICATION_URI) {
            return process.env.CLI_LOGIN_VERIFICATION_URI;
        }

        const baseUrl = process.env.FRONTEND_URL || "https://sprintpm.org";
        const url = new URL(baseUrl);
        url.pathname = "/cli/login";
        url.search = "";
        url.hash = "";
        return url.toString();
    })();

    return Response.json({
        deviceCode,
        userCode,
        verificationUri,
        expiresInSeconds: CLI_LOGIN_EXPIRES_IN_SECONDS,
        intervalSeconds: CLI_LOGIN_INTERVAL_SECONDS,
    });
}
