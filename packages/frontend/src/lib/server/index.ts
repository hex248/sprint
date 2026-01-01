export * as issue from "./issue";
export * as organisation from "./organisation";
export * as project from "./project";

export type ServerQueryInput = {
    onSuccess?: (data: any, res: Response) => void;
    onError?: (error: string) => void;
};
