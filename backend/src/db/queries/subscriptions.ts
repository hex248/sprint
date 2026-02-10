import { Payment, Subscription } from "@sprint/shared";
import { eq } from "drizzle-orm";
import { db } from "../client";

export async function createSubscription(data: {
    userId: number;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    stripeSubscriptionItemId: string;
    stripePriceId: string;
    status: string;
    quantity: number;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
}) {
    const [subscription] = await db
        .insert(Subscription)
        .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        .returning();
    return subscription;
}

export async function getSubscriptionByUserId(userId: number) {
    const [subscription] = await db.select().from(Subscription).where(eq(Subscription.userId, userId));
    return subscription;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
    const [subscription] = await db
        .select()
        .from(Subscription)
        .where(eq(Subscription.stripeSubscriptionId, stripeSubscriptionId));
    return subscription;
}

export async function updateSubscription(
    id: number,
    updates: Partial<{
        status: string;
        stripePriceId: string;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        cancelAtPeriodEnd: boolean;
        trialEnd: Date;
        quantity: number;
    }>,
) {
    const [subscription] = await db
        .update(Subscription)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(eq(Subscription.id, id))
        .returning();
    return subscription;
}

export async function createPayment(data: {
    subscriptionId: number;
    stripePaymentIntentId: string;
    amount: number;
    currency: string;
    status: string;
}) {
    const [payment] = await db.insert(Payment).values(data).returning();
    return payment;
}

export async function deleteSubscription(id: number) {
    await db.delete(Subscription).where(eq(Subscription.id, id));
}
