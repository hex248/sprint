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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

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

                await createSubscription({
                    userId,
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: stripeSubscription.id,
                    stripeSubscriptionItemId: stripeSubscription.items.data[0].id,
                    stripePriceId: session.metadata?.priceId || "",
                    status: stripeSubscription.status,
                    quantity: parseInt(session.metadata?.quantity || "1", 10),
                    currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
                    currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
                    trialEnd: stripeSubscription.trial_end
                        ? new Date(stripeSubscription.trial_end * 1000)
                        : undefined,
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
                const currentPeriodStart = (subscription as any).current_period_start
                    ? new Date((subscription as any).current_period_start * 1000)
                    : undefined;
                const currentPeriodEnd = (subscription as any).current_period_end
                    ? new Date((subscription as any).current_period_end * 1000)
                    : undefined;

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

                if (!(invoice as any).subscription) break;

                const localSub = await getSubscriptionByStripeId((invoice as any).subscription as string);
                if (!localSub) break;

                await createPayment({
                    subscriptionId: localSub.id,
                    stripePaymentIntentId: (invoice as any).payment_intent as string,
                    amount: invoice.amount_paid,
                    currency: invoice.currency,
                    status: "succeeded",
                });

                console.log(`payment recorded for subscription ${(invoice as any).subscription}`);
                break;
            }

            case "invoice.payment_failed": {
                const invoice = event.data.object as Stripe.Invoice;

                if (!(invoice as any).subscription) break;

                const localSub = await getSubscriptionByStripeId((invoice as any).subscription as string);
                if (!localSub) break;

                await updateSubscription(localSub.id, { status: "past_due" });

                console.log(`payment failed for subscription ${(invoice as any).subscription}`);
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
