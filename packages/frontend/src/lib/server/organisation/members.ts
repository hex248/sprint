import type { OrganisationMemberResponse } from "@issue/shared";
import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function members({
    organisationId,
    onSuccess,
    onError,
}: {
    organisationId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/organisation/members`);
    url.searchParams.set("organisationId", `${organisationId}`);

    const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get members (${res.status})`);
    } else {
        const data = (await res.json()) as OrganisationMemberResponse[];
        onSuccess?.(data, res);
    }
}
