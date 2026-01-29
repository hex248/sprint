import { OrgUpdateRequestSchema } from "@sprint/shared";
import type { AuthedRequest } from "../../auth/middleware";
import {
    getOrganisationById,
    getOrganisationMemberRole,
    getSubscriptionByUserId,
    updateOrganisation,
} from "../../db/queries";
import { errorResponse, parseJsonBody } from "../../validation";

export default async function organisationUpdate(req: AuthedRequest) {
    const parsed = await parseJsonBody(req, OrgUpdateRequestSchema);
    if ("error" in parsed) return parsed.error;

    const { id, name, description, slug, iconURL, statuses, features, issueTypes } = parsed.data;

    const existingOrganisation = await getOrganisationById(id);
    if (!existingOrganisation) {
        return errorResponse(`organisation with id ${id} does not exist`, "ORG_NOT_FOUND", 404);
    }

    const requesterMember = await getOrganisationMemberRole(id, req.userId);
    if (!requesterMember) {
        return errorResponse("you are not a member of this organisation", "NOT_MEMBER", 403);
    }
    if (requesterMember.role !== "owner" && requesterMember.role !== "admin") {
        return errorResponse("only owners and admins can edit organisations", "PERMISSION_DENIED", 403);
    }

    // block free users from updating features
    if (features !== undefined) {
        const subscription = await getSubscriptionByUserId(req.userId);
        const isPro = subscription?.status === "active";
        if (!isPro) {
            return errorResponse(
                "Feature toggling is only available on Pro. Upgrade to customize features.",
                "FEATURE_TOGGLE_PRO_ONLY",
                403,
            );
        }
    }

    if (!name && !description && !slug && !statuses && !features && !issueTypes && iconURL === undefined) {
        return errorResponse(
            "at least one of name, description, slug, iconURL, statuses, issueTypes, or features must be provided",
            "NO_UPDATES",
            400,
        );
    }

    const organisation = await updateOrganisation(id, {
        name,
        description,
        slug,
        iconURL,
        statuses,
        features,
        issueTypes,
    });

    return Response.json(organisation);
}
