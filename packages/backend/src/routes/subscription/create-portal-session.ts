import type { BunRequest } from "bun";
import { withAuth, withCors, withCSRF } from "../../auth/middleware";
import { getSubscriptionByUserId } from "../../db/queries/subscriptions";
import { stripe } from "../../stripe/client";
import { errorResponse } from "../../validation";

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:1420";

async function handler(req: BunRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    try {
        const userId = (req as any).userId;
        const subscription = await getSubscriptionByUserId(userId);
        if (!subscription?.stripeCustomerId) {
            return errorResponse("no active subscription found", "NOT_FOUND", 404);
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: subscription.stripeCustomerId,
            return_url: `${BASE_URL}/plans`,
        });

        return new Response(JSON.stringify({ url: portalSession.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("portal session error:", error);
        return errorResponse("failed to create portal session", "PORTAL_ERROR", 500);
    }
}

export default withCors(withAuth(withCSRF(handler)));
