import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byUser({
    userId,
    onSuccess,
    onError,
}: {
    userId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/organisations/by-user`);
    url.searchParams.set("userId", `${userId}`);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get organisations (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
