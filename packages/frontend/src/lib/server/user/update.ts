import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update({
    id,
    name,
    password,
    avatarURL,
    onSuccess,
    onError,
}: {
    id: number;
    name: string;
    password: string;
    avatarURL: string | null;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/user/update`);
    url.searchParams.set("id", `${id}`);
    url.searchParams.set("name", name.trim());
    url.searchParams.set("password", password.trim());
    url.searchParams.set("avatarURL", avatarURL || "null");

    const csrfToken = getCsrfToken();
    const headers: HeadersInit = {};
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(url.toString(), {
        headers,
        credentials: "include",
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
