import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function getInactive({
    issueId,
    onSuccess,
    onError,
}: {
    issueId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/timer/get-inactive`);
    url.searchParams.set("issueId", `${issueId}`);

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(url.toString(), {
        headers,
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get timers (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
