import type { UserRecord, UserUpdateRequest } from "@issue/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update(request: UserUpdateRequest & ServerQueryInput<UserRecord>) {
    const { onSuccess, onError, ...body } = request;
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/user/update`, {
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
            typeof error === "string" ? error : error.error || `failed to update user (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        if (!data.id) {
            toast.error(`failed to update user (${res.status})`);
            onError?.(`failed to update user (${res.status})`);
            return;
        }
        onSuccess?.(data, res);
    }
}
