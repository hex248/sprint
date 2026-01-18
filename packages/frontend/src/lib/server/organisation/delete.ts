import type { SuccessResponse } from "@sprint/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function remove({
    organisationId,
    onSuccess,
    onError,
}: {
    organisationId: number;
} & ServerQueryInput<SuccessResponse>) {
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/organisation/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({ id: organisationId }),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string"
                ? error
                : error.error || `failed to delete organisation (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
