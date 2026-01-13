import type { TimerState } from "@issue/shared";
import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function getInactive({
    issueId,
    onSuccess,
    onError,
}: {
    issueId: number;
} & ServerQueryInput<TimerState[]>) {
    const url = new URL(`${getServerURL()}/timer/get-inactive`);
    url.searchParams.set("issueId", `${issueId}`);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to get timers (${res.status})`;
        onError?.(message);
    } else {
        const data = await res.json();
        onSuccess?.(data || [], res);
    }
}
