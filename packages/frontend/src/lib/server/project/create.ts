import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function create({
    key,
    name,
    creatorId,
    organisationId,
    onSuccess,
    onError,
}: {
    key: string;
    name: string;
    creatorId: number;
    organisationId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/project/create`);
    url.searchParams.set("key", key.trim());
    url.searchParams.set("name", name.trim());
    url.searchParams.set("creatorId", `${creatorId}`);
    url.searchParams.set("organisationId", `${organisationId}`);

    const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to create project (${res.status})`);
    } else {
        const data = await res.json();
        if (!data.id) {
            onError?.(`failed to create project (${res.status})`);
            return;
        }

        onSuccess?.(data, res);
    }
}
