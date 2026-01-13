import type { IssueRecord } from "@issue/shared";
import { toast } from "sonner";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import type { ServerQueryInput } from "..";

export async function update({
    issueId,
    title,
    description,
    sprintId,
    assigneeId,
    status,
    onSuccess,
    onError,
}: {
    issueId: number;
    title?: string;
    description?: string;
    sprintId?: number | null;
    assigneeId?: number | null;
    status?: string;
} & ServerQueryInput<IssueRecord>) {
    const csrfToken = getCsrfToken();

    const res = await fetch(`${getServerURL()}/issue/update`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
        },
        body: JSON.stringify({
            id: issueId,
            title,
            description,
            sprintId,
            assigneeId,
            status,
        }),
        credentials: "include",
    });

    if (!res.ok) {
        const error = await res.json().catch(() => res.text());
        const message =
            typeof error === "string" ? error : error.error || `failed to update issue (${res.status})`;
        toast.error(message);
        onError?.(error);
    } else {
        const data = await res.json();
        onSuccess?.(data, res);
    }
}
