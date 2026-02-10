import { type AuthedRequest, withAuth, withCors, withCSRF } from "../../auth/middleware";
import { getSubscriptionByUserId, updateSubscription } from "../../db/queries/subscriptions";
import { stripe } from "../../stripe/client";
import { errorResponse } from "../../validation";

async function handler(req: AuthedRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    try {
        const { userId } = req;
        const subscription = await getSubscriptionByUserId(userId);
        if (!subscription?.stripeSubscriptionId) {
            return errorResponse("no active subscription found", "NOT_FOUND", 404);
        }

        const stripeCurrent = (await stripe.subscriptions.retrieve(
            subscription.stripeSubscriptionId,
        )) as unknown as {
            status: string;
            cancel_at_period_end: boolean | null;
            current_period_end: number | null;
        };

        const currentPeriodEnd = stripeCurrent.current_period_end
            ? new Date(stripeCurrent.current_period_end * 1000)
            : undefined;

        if (stripeCurrent.status === "canceled" || stripeCurrent.cancel_at_period_end) {
            const updated = await updateSubscription(subscription.id, {
                status: stripeCurrent.status,
                cancelAtPeriodEnd: stripeCurrent.cancel_at_period_end ?? subscription.cancelAtPeriodEnd,
                ...(currentPeriodEnd && { currentPeriodEnd }),
            });
            return new Response(JSON.stringify({ subscription: updated }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }

        const stripeSubscription = (await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        })) as unknown as {
            status: string;
            cancel_at_period_end: boolean | null;
            current_period_end: number | null;
        };

        const updated = await updateSubscription(subscription.id, {
            status: stripeSubscription.status,
            cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end ?? true,
            currentPeriodEnd: stripeSubscription.current_period_end
                ? new Date(stripeSubscription.current_period_end * 1000)
                : undefined,
        });

        return new Response(JSON.stringify({ subscription: updated }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("subscription cancel error:", error);
        return errorResponse("failed to cancel subscription", "CANCEL_ERROR", 500);
    }
}

export default withCors(withAuth(withCSRF(handler)));
