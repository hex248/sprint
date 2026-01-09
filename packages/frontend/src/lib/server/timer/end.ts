import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function end({
    issueId,
    onSuccess,
    onError,
}: {
    issueId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/timer/end`);
    url.searchParams.set("issueId", `${issueId}`);

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(url.toString(), {
        method: "POST",
        headers,
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to end timer (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
