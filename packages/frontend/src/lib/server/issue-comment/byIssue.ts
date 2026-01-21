import type { IssueCommentResponse } from "@sprint/shared";
import { getServerURL } from "@/lib/utils";
import { getErrorMessage } from "..";

export async function byIssue(issueId: number): Promise<IssueCommentResponse[]> {
  const url = new URL(`${getServerURL()}/issue-comments/by-issue`);
  url.searchParams.set("issueId", `${issueId}`);

  const res = await fetch(url.toString(), {
    credentials: "include",
  });

  if (!res.ok) {
    const message = await getErrorMessage(res, `failed to get issue comments (${res.status})`);
    throw new Error(message);
  }

  return res.json();
}
