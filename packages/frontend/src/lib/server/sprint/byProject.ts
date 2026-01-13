import type { SprintRecord } from "@issue/shared";
import { getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function byProject({
    projectId,
    onSuccess,
    onError,
}: {
    projectId: number;
} & ServerQueryInput<SprintRecord[]>) {
    const url = new URL(`${getServerURL()}/sprints/by-project`);
    url.searchParams.set("projectId", `${projectId}`);

    const res = await fetch(url.toString(), {
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to get sprints (${res.status})`);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
