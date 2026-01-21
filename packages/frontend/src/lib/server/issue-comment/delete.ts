import type { IssueCommentDeleteRequest, SuccessResponse } from "@sprint/shared";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import { getErrorMessage } from "..";

export async function remove(request: IssueCommentDeleteRequest): Promise<SuccessResponse> {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${getServerURL()}/issue-comment/delete`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(request),
    credentials: "include",
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `failed to delete comment (${res.status})`);
    throw new Error(message);
  }

  return res.json();
}
