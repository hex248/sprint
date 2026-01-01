import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function addMember({
    organisationId,
    userId,
    role = "member",
    onSuccess,
    onError,
}: {
    organisationId: number;
    userId: number;
    role?: string;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/organisation/add-member`);
    url.searchParams.set("organisationId", `${organisationId}`);
    url.searchParams.set("userId", `${userId}`);
    url.searchParams.set("role", role);

    const res = await fetch(url.toString(), {
        method: "POST",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to add member (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
