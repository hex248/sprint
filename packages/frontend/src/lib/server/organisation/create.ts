import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function create({
    name,
    slug,
    userId,
    description,
    onSuccess,
    onError,
}: {
    name: string;
    slug: string;
    userId: number;
    description: string;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/organisation/create`);
    url.searchParams.set("name", name.trim());
    url.searchParams.set("slug", slug.trim());
    url.searchParams.set("userId", `${userId}`);
    if (description.trim() !== "") url.searchParams.set("description", description.trim());

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
