import type { SprintRecord } from "@issue/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function create({
    projectId,
    name,
    color,
    startDate,
    endDate,
    onSuccess,
    onError,
}: {
    projectId: number;
    name: string;
    color?: string;
    startDate: Date;
    endDate: Date;
} & ServerQueryInput<SprintRecord>) {
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/sprint/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
            projectId,
            name: name.trim(),
            color,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
        }),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to create sprint (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        if (!data.id) {
            toast.error(`failed to create sprint (${res.status})`);
            onError?.(`failed to create sprint (${res.status})`);
            return;
        }
        onSuccess?.(data, res);
    }
}
