import { type AuthedRequest, withAuth, withCors, withCSRF } from "../../auth/middleware";
import { getOrganisationMembers, getOrganisationsByUserId } from "../../db/queries/organisations";
import { getUserById } from "../../db/queries/users";
import { STRIPE_PRICE_ANNUAL, STRIPE_PRICE_MONTHLY, stripe } from "../../stripe/client";
import { errorResponse } from "../../validation";

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:1420";

async function handler(req: AuthedRequest) {
    if (req.method !== "POST") {
        return errorResponse("method not allowed", "METHOD_NOT_ALLOWED", 405);
    }

    try {
        const body = await req.json();
        const { billingPeriod } = body as { billingPeriod: "monthly" | "annual" | undefined };

        if (!billingPeriod) {
            return errorResponse("missing required fields", "VALIDATION_ERROR", 400);
        }

        const { userId } = req;
        const user = await getUserById(userId);

        if (!user) {
            return errorResponse("user not found", "NOT_FOUND", 404);
        }

        // calculate seat quantity across all owned organisations
        const organisations = await getOrganisationsByUserId(userId);
        const ownedOrgs = organisations.filter((o) => o.OrganisationMember.role === "owner");

        let totalMembers = 0;
        for (const org of ownedOrgs) {
            const members = await getOrganisationMembers(org.Organisation.id);
            totalMembers += members.length;
        }

        const quantity = Math.max(1, totalMembers - 5);
        const priceId = billingPeriod === "annual" ? STRIPE_PRICE_ANNUAL : STRIPE_PRICE_MONTHLY;

        // use the user's email from the database
        const customerEmail = user.email;

        const session = await stripe.checkout.sessions.create({
            customer_email: customerEmail,
            line_items: [
                {
                    price: priceId,
                    quantity: quantity,
                },
            ],
            mode: "subscription",
            success_url: `${BASE_URL}/plans?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${BASE_URL}/plans?canceled=true`,
            subscription_data: {
                metadata: {
                    userId: userId.toString(),
                },
            },
            metadata: {
                userId: userId.toString(),
                priceId: priceId,
                quantity: quantity.toString(),
            },
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("checkout session error:", error);
        return errorResponse("failed to create checkout session", "CHECKOUT_ERROR", 500);
    }
}

export default withCors(withAuth(withCSRF(handler)));
