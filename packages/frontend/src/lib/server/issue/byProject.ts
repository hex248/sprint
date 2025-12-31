import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byProject({
    projectId,
    onSuccess,
    onError,
}: {
    projectId: number;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/issues/by-project`);
    url.searchParams.set("projectId", `${projectId}`);

    const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get issues by project (${res.status})`);
    } else {
        const data = await res.json();

        onSuccess?.(data, res);
    }
}
