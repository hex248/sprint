import type { AuthedRequest } from "../../auth/middleware";
import { getCachedFreeModels } from "./opencode";

// GET /ai/models - returns cached free models
export default function aiModels(_req: AuthedRequest) {
    const models = getCachedFreeModels();
    return Response.json(models);
}
