import { getOrganisationMembers, getOrganisationsByUserId } from "../db/queries/organisations";
import { getSubscriptionByUserId, updateSubscription } from "../db/queries/subscriptions";
import { getUserById } from "../db/queries/users";
import { stripe } from "../stripe/client";

export async function updateSeatCount(userId: number) {
    const user = await getUserById(userId);

    // only update if user has active pro subscription
    if (!user || user.plan !== "pro") {
        return;
    }

    const subscription = await getSubscriptionByUserId(userId);
    if (!subscription || subscription.status !== "active") {
        return;
    }

    // calculate total members across all owned organisations
    const organisations = await getOrganisationsByUserId(userId);
    const ownedOrgs = organisations.filter((o) => o.OrganisationMember.role === "owner");

    let totalMembers = 0;
    for (const org of ownedOrgs) {
        const members = await getOrganisationMembers(org.Organisation.id);
        totalMembers += members.length;
    }

    const newQuantity = Math.max(1, totalMembers - 5);

    // skip if quantity hasn't changed
    if (newQuantity === subscription.quantity) {
        return;
    }

    // update stripe
    await stripe.subscriptionItems.update(subscription.stripeSubscriptionItemId!, {
        quantity: newQuantity,
        proration_behavior: "always_invoice",
    });

    // update local record
    await updateSubscription(subscription.id, { quantity: newQuantity });
}
