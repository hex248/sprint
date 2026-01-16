import type { TimerState } from "@sprint/shared";
import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function get({
    issueId,
    onSuccess,
    onError,
}: {
    issueId: number;
} & ServerQueryInput<TimerState>) {
    const url = new URL(`${getServerURL()}/timer/get`);
    url.searchParams.set("issueId", `${issueId}`);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to get timer (${res.status})`;
        onError?.(message);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
