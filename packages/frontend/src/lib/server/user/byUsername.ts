import type { UserRecord } from "@issue/shared";
import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byUsername({
    username,
    onSuccess,
    onError,
}: {
    username: string;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/user/by-username`);
    url.searchParams.set("username", username);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get user (${res.status})`);
    } else {
        const data = (await res.json()) as UserRecord;
        onSuccess?.(data, res);
    }
}
