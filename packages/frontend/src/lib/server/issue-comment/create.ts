import type { IssueCommentCreateRequest, IssueCommentRecord } from "@sprint/shared";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import { getErrorMessage } from "..";

export async function create(request: IssueCommentCreateRequest): Promise<IssueCommentRecord> {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${getServerURL()}/issue-comment/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(request),
    credentials: "include",
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `failed to create comment (${res.status})`);
    throw new Error(message);
  }

  const data = (await res.json()) as IssueCommentRecord;
  if (!data.id) {
    throw new Error(`failed to create comment (${res.status})`);
  }

  return data;
}
