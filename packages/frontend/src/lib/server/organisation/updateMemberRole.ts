import type { OrganisationMemberRecord, OrgUpdateMemberRoleRequest } from "@issue/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function updateMemberRole(
    request: OrgUpdateMemberRoleRequest & ServerQueryInput<OrganisationMemberRecord>,
) {
    const { onSuccess, onError, ...body } = request;
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/organisation/update-member-role`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify(body),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to update member role (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
