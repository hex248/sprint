import type { SprintRecord } from "@sprint/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update({
    sprintId,
    name,
    color,
    startDate,
    endDate,
    onSuccess,
    onError,
}: {
    sprintId: number;
    name?: string;
    color?: string;
    startDate?: Date;
    endDate?: Date;
} & ServerQueryInput<SprintRecord>) {
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/sprint/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
            id: sprintId,
            name: name?.trim(),
            color,
            startDate: startDate?.toISOString(),
            endDate: endDate?.toISOString(),
        }),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to update sprint (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
