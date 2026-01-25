import type { IssuesReplaceTypeRequest, ReplaceTypeResponse } from "@sprint/shared";
import { getCsrfToken, getServerURL } from "@/lib/utils";
import { getErrorMessage } from "..";

export async function replaceType(request: IssuesReplaceTypeRequest): Promise<ReplaceTypeResponse> {
  const csrfToken = getCsrfToken();

  const res = await fetch(`${getServerURL()}/issues/replace-type`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    },
    body: JSON.stringify(request),
    credentials: "include",
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `failed to replace type (${res.status})`);
    throw new Error(message);
  }

  return res.json();
}
