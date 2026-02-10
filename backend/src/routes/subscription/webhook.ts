import type { BunRequest } from "bun";
import type Stripe from "stripe";
import {
    createPayment,
    createSubscription,
    getSubscriptionByStripeId,
    updateSubscription,
} from "../../db/queries/subscriptions";
import { updateUser } from "../../db/queries/users";
import { stripe } from "../../stripe/client";

const webhookSecret = requireEnv("STRIPE_WEBHOOK_SECRET");

function toStripeDate(seconds: number | null | undefined, field: string) {
    if (seconds === null || seconds === undefined) return undefined;
    if (!Number.isFinite(seconds)) {
        console.warn(`invalid ${field} timestamp:`, seconds);
        return undefined;
    }
    return new Date(seconds * 1000);
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
}

export default async function webhook(req: BunRequest) {
    if (req.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
    }

    const payload = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
        return new Response("Missing signature", { status: 400 });
    }

    let event: Stripe.Event;

    try {
        // use async version for Bun compatibility
        event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
    } catch (err) {
        console.error("webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 400 });
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;

                if (session.mode !== "subscription" || !session.subscription) {
                    break;
                }

                const userId = parseInt(session.metadata?.userId || "0", 10);
                if (!userId) {
                    console.error("missing userId in session metadata");
                    break;
                }

                // fetch full subscription to get item id
                const stripeSubscription = await stripe.subscriptions.retrieve(
                    session.subscription as string,
                );
                if (!stripeSubscription) {
                    console.error("failed to retrieve subscription:", session.subscription);
                    break;
                }
                if (!stripeSubscription.items.data[0]) {
                    console.error("subscription has no items:", stripeSubscription.id);
                    break;
                }

                // stripe types use snake_case for these fields
                const sub = stripeSubscription as unknown as {
                    current_period_start: number | null;
                    current_period_end: number | null;
                    trial_end: number | null;
                };

                await createSubscription({
                    userId,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: stripeSubscription.id,
                    stripeSubscriptionItemId: stripeSubscription.items.data[0].id,
                    stripePriceId: session.metadata?.priceId || "",
                    status: stripeSubscription.status,
                    quantity: parseInt(session.metadata?.quantity || "1", 10),
                    currentPeriodStart: toStripeDate(sub.current_period_start, "current_period_start"),
                    currentPeriodEnd: toStripeDate(sub.current_period_end, "current_period_end"),
                    trialEnd: toStripeDate(sub.trial_end, "trial_end"),
                });

                await updateUser(userId, { plan: "pro" });

                console.log(`subscription activated for user ${userId}`);
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                if (!subscription) {
                    console.error("failed to retrieve subscription (customer.subscription.updated)");
                    break;
                }
                if (!subscription.items.data[0]) {
                    console.error("subscription has no items:", subscription.id);
                    break;
                }

                const localSub = await getSubscriptionByStripeId(subscription.id);
                if (!localSub) {
                    console.error("subscription not found:", subscription.id);
                    break;
                }
                // safely convert timestamps to dates
                // stripe types use snake_case for these fields
                const sub = subscription as unknown as {
                    current_period_start: number | null;
                    current_period_end: number | null;
                };
                const currentPeriodStart = toStripeDate(sub.current_period_start, "current_period_start");
                const currentPeriodEnd = toStripeDate(sub.current_period_end, "current_period_end");

                await updateSubscription(localSub.id, {
                    status: subscription.status,
                    ...(currentPeriodStart && { currentPeriodStart }),
                    ...(currentPeriodEnd && { currentPeriodEnd }),
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                    quantity: subscription.items.data[0].quantity || 1,
                });

                console.log(`subscription updated: ${subscription.id}`);
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;

                const localSub = await getSubscriptionByStripeId(subscription.id);
                if (!localSub) break;

                // delete subscription from database
                const { deleteSubscription } = await import("../../db/queries/subscriptions");
                await deleteSubscription(localSub.id);
                await updateUser(localSub.userId, { plan: "free" });

                console.log(`subscription deleted: ${subscription.id}`);
                break;
            }

            case "invoice.payment_succeeded": {
                const invoice = event.data.object as Stripe.Invoice;

                // stripe types use snake_case for these fields
                const inv = invoice as unknown as {
                    subscription: string | null;
                    payment_intent: string | null;
                };

                if (!inv.subscription) break;

                const localSub = await getSubscriptionByStripeId(inv.subscription);
                if (!localSub) break;

                await createPayment({
                    subscriptionId: localSub.id,
                    stripePaymentIntentId: inv.payment_intent || "",
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    status: "succeeded",
                });

                console.log(`payment recorded for subscription ${inv.subscription}`);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;

                // stripe types use snake_case for these fields
                const inv = invoice as unknown as {
                    subscription: string | null;
                };

                if (!inv.subscription) break;

                const localSub = await getSubscriptionByStripeId(inv.subscription);
                if (!localSub) break;

                await updateSubscription(localSub.id, { status: "past_due" });

                console.log(`payment failed for subscription ${inv.subscription}`);
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("webhook processing error:", error);
        return new Response("Webhook handler failed", { status: 500 });
    }
}
