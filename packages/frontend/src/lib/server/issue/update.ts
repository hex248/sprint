import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update({
    issueId,
    title,
    description,
    assigneeId,
    onSuccess,
    onError,
}: {
    issueId: number;
    title?: string;
    description?: string;
    assigneeId?: number | null;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/issue/update`);
    url.searchParams.set("id", `${issueId}`);
    if (title !== undefined) url.searchParams.set("title", title);
    if (description !== undefined) url.searchParams.set("description", description);
    if (assigneeId !== undefined) {
        url.searchParams.set("assigneeId", assigneeId === null ? "null" : `${assigneeId}`);
    }

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(url.toString(), {
        headers,
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to update issue (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
