export * as issue from "@/lib/server/issue";
export * as organisation from "@/lib/server/organisation";
export * as project from "@/lib/server/project";
export * as timer from "@/lib/server/timer";
export * as user from "@/lib/server/user";

export type ServerQueryInput = {
    onSuccess?: (data: any, res: Response) => void;
    onError?: (error: string) => void;
};
