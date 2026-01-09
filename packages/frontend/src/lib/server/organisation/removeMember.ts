import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function removeMember({
    organisationId,
    userId,
    onSuccess,
    onError,
}: {
    organisationId: number;
    userId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/organisation/remove-member`);
    url.searchParams.set("organisationId", `${organisationId}`);
    url.searchParams.set("userId", `${userId}`);

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
        onError?.(error || `failed to remove member (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
