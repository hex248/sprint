import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byOrganisation({
    organisationId,
    onSuccess,
    onError,
}: {
    organisationId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/projects/by-organisation`);
    url.searchParams.set("organisationId", `${organisationId}`);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get projects by organisation (${res.status})`);
    } else {
        const data = await res.json();

        onSuccess?.(data, res);
    }
}
