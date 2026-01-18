import type { SuccessResponse } from "@sprint/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function remove({
    sprintId,
    onSuccess,
    onError,
}: {
    sprintId: number;
} & ServerQueryInput<SuccessResponse>) {
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/sprint/delete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({ id: sprintId }),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to delete sprint (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
