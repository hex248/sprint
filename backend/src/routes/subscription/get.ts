import { type AuthedRequest, withAuth, withCors } from "../../auth/middleware";
import { getSubscriptionByUserId } from "../../db/queries/subscriptions";
import { errorResponse } from "../../validation";

async function handler(req: AuthedRequest) {
    if (req.method !== "GET") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    try {
        const { userId } = req;
        const subscription = await getSubscriptionByUserId(userId);

        return new Response(JSON.stringify({ subscription }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("fetch subscription error:", error);
        return errorResponse("failed to fetch subscription", "FETCH_ERROR", 500);
    }
}

export default withCors(withAuth(handler));
