import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update({
    id,
    name,
    password,
    onSuccess,
    onError,
}: {
    id: number;
    name: string;
    password: string;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/user/update`);
    url.searchParams.set("id", `${id}`);
    url.searchParams.set("name", name.trim());
    url.searchParams.set("password", password.trim());

    const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to update user (${res.status})`);
    } else {
        const data = await res.json();
        if (!data.id) {
            onError?.(`failed to update user (${res.status})`);
            return;
        }

        onSuccess?.(data, res);
    }
}
