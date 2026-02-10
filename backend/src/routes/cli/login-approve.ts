import { CliLoginApproveRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { approveCliLoginCode, createSession, getCliLoginCodeByUserHash } from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";
import { hashCode } from "./utils";

export default async function cliLoginApprove(req: AuthedRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    const parsed = await parseJsonBody(req, CliLoginApproveRequestSchema);
    if ("error" in parsed) return parsed.error;

    const userCodeHash = await hashCode(parsed.data.userCode.trim().toUpperCase());
    const code = await getCliLoginCodeByUserHash(userCodeHash);
    if (!code) {
        return errorResponse("login code not found", "LOGIN_CODE_NOT_FOUND", 404);
    }

    const now = new Date();
    if (code.expiresAt < now) {
        return errorResponse("login code expired", "LOGIN_CODE_EXPIRED", 400);
    }

    if (code.status !== "pending") {
        return errorResponse("login code is not pending", "LOGIN_CODE_INVALID_STATE", 400);
    }

    const session = await createSession(req.userId);
    if (!session) {
        return errorResponse("failed to create session", "SESSION_ERROR", 500);
    }

    const updated = await approveCliLoginCode(code.id, req.userId, session.id);
    if (!updated) {
        return errorResponse("failed to approve login code", "LOGIN_CODE_APPROVAL_FAILED", 400);
    }

    return Response.json({ success: true });
}
