import type { OrganisationResponse } from "@issue/shared";
import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byUser({ onSuccess, onError }: ServerQueryInput<OrganisationResponse[]>) {
    const res = await fetch(`${getServerURL()}/organisations/by-user`, {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to get organisations (${res.status})`;
        onError?.(message);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
