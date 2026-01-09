import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function get({
    issueId,
    onSuccess,
    onError,
}: {
    issueId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/timer/get`);
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
        onError?.(error || `failed to get timer (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
