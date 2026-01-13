import type { OrganisationRecord } from "@issue/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update({
    organisationId,
    name,
    description,
    slug,
    statuses,
    onSuccess,
    onError,
}: {
    organisationId: number;
    name?: string;
    description?: string;
    slug?: string;
    statuses?: Record<string, string>;
} & ServerQueryInput<OrganisationRecord>) {
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/organisation/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
            id: organisationId,
            name,
            description,
            slug,
            statuses,
        }),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string"
                ? error
                : error.error || `failed to update organisation (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
