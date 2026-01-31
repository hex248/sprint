import { ChatRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import { getUserById } from "../../db/queries";
import { errorResponse, parseQueryParams } from "../../validation";
import { buildContext, SYSTEM_PROMPT } from "./context-builders";
import { callAI } from "./opencode";

export default async function aiChat(req: AuthedRequest) {
    const url = new URL(req.url);
    const parsed = parseQueryParams(url, ChatRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { orgId, projectId, message, model } = parsed.data;

    const user = await getUserById(req.userId);
    if (!user) {
        return errorResponse("user not found", "USER_NOT_FOUND", 404);
    }

    const context = await buildContext(orgId, projectId, user);

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${context}\n\n<user_query>${message}</user_query>`;
    const response = await callAI(fullPrompt, model);

    return Response.json(response);
}
