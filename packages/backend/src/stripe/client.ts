import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-12-18.acacia",
});

export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY!;
export const STRIPE_PRICE_ANNUAL = process.env.STRIPE_PRICE_ANNUAL!;
