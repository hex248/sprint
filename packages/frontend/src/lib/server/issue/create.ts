import { getAuthHeaders, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function create({
    projectId,
    title,
    description,
    assigneeId,
    onSuccess,
    onError,
}: {
    projectId: number;
    title: string;
    description: string;
    assigneeId?: number | null;
} & ServerQueryInput) {
    const url = new URL(`${getServerURL()}/issue/create`);
    url.searchParams.set("projectId", `${projectId}`);
    url.searchParams.set("title", title.trim());
    if (description.trim() !== "") url.searchParams.set("description", description.trim());
    if (assigneeId != null) url.searchParams.set("assigneeId", `${assigneeId}`);

    const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const error = await res.text();
        onError?.(error || `failed to create issue (${res.status})`);
    } else {
        const data = await res.json();
        if (!data.id) {
            onError?.(`failed to create issue (${res.status})`);
            return;
        }

        onSuccess?.(data, res);
    }
}
