import type { IssueCreateRequest, IssueRecord } from "@sprint/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function create(request: IssueCreateRequest & ServerQueryInput<IssueRecord>) {
    const { onSuccess, onError, ...body } = request;
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/issue/create`, {
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
            typeof error === "string" ? error : error.error || `failed to create issue (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        if (!data.id) {
            toast.error(`failed to create issue (${res.status})`);
            onError?.(`failed to create issue (${res.status})`);
            return;
        }
        onSuccess?.(data, res);
    }
}
