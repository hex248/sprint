import type { ApiError } from "@sprint/shared";

export * as issue from "@/lib/server/issue";
export * as issueComment from "@/lib/server/issue-comment";
export * as organisation from "@/lib/server/organisation";
export * as project from "@/lib/server/project";
export * as sprint from "@/lib/server/sprint";
export * as timer from "@/lib/server/timer";
export * as user from "@/lib/server/user";

export async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  const error = await res.json().catch(() => res.text());
  if (typeof error === "string") {
    return error || fallback;
  }
  if (error && typeof error === "object") {
    if ("details" in error && error.details) {
      const messages = Object.values(error.details as Record<string, string[]>).flat();
      if (messages.length > 0) return messages.join(", ");
    }
    if ("error" in error && typeof error.error === "string") {
      return error.error || fallback;
    }
  }
  return fallback;
}

export function parseError(error: ApiError | string | Error): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.details) {
    const messages = Object.values(error.details).flat();
    return messages.join(", ");
  }
  return error.error;
}
