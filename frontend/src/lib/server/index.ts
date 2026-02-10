import type { ApiError } from "@sprint/shared";

export { apiClient } from "@/lib/api-client";

export function parseError(error: ApiError | string | Error): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error.details) {
    const messages = Object.values(error.details).flat();
    return messages.join(", ");
  }
  return error.error;
}
