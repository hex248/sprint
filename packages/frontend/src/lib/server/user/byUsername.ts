import type { UserRecord } from "@sprint/shared";
import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byUsername({
    username,
    onSuccess,
    onError,
}: {
    username: string;
} & ServerQueryInput<UserRecord>) {
    const url = new URL(`${getServerURL()}/user/by-username`);
    url.searchParams.set("username", username);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to get user (${res.status})`;
        onError?.(message);
    } else {
        const data = (await res.json()) as UserRecord;
        onSuccess?.(data, res);
    }
}
