import Stripe from "stripe";

const stripeSecretKey = requireEnv("STRIPE_SECRET_KEY");

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-12-15.clover",
});

export const STRIPE_PRICE_MONTHLY = requireEnv("STRIPE_PRICE_MONTHLY");
export const STRIPE_PRICE_ANNUAL = requireEnv("STRIPE_PRICE_ANNUAL");

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is required`);
    }
    return value;
}
