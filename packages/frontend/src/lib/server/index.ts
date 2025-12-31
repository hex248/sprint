export * as issue from "./issue";
export * as organisation from "./organisation";
export * as project from "./project";

export type ServerQueryInput = {
    onSuccess?: (data: unknown, res: Response) => void;
    onError?: (error: unknown) => void;
};
