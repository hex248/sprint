import type { ApiError } from "@sprint/shared";

export * as issue from "@/lib/server/issue";
export * as organisation from "@/lib/server/organisation";
export * as project from "@/lib/server/project";
export * as sprint from "@/lib/server/sprint";
export * as timer from "@/lib/server/timer";
export * as user from "@/lib/server/user";

export type ServerQueryInput<T = unknown> = {
    onSuccess?: (data: T, res: Response) => void;
    onError?: (error: ApiError | string) => void;
};

export function parseError(error: ApiError | string): string {
    if (typeof error === "string") return error;
    if (error.details) {
        const messages = Object.values(error.details).flat();
        return messages.join(", ");
    }
    return error.error;
}
