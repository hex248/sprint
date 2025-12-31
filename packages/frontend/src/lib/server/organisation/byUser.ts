import { getAuthHeaders, getServerURL } from "@/lib/utils";
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
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to create organisation (${res.status})`);
    } else {
        const data = await res.json();
        if (!data.id) {
            onError?.(`failed to create organisation (${res.status})`);
            return;
        }

        onSuccess?.(data, res);
    }
}
