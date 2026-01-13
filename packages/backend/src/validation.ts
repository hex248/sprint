import type { ApiError } from "@issue/shared";
import type { z } from "zod";

type ZodSchema<T> = z.ZodSchema<T>;
type ZodError = z.ZodError;

export function formatZodError(error: ZodError): ApiError {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
        const path = issue.path.join(".") || "_root";
        if (!details[path]) details[path] = [];
        details[path].push(issue.message);
    }
    return {
        error: "validation failed",
        code: "VALIDATION_ERROR",
        details,
    };
}

export function errorResponse(error: string, code?: string, status = 400): Response {
    const body: ApiError = { error, code };
    return Response.json(body, { status });
}

export async function parseJsonBody<T>(
    req: Request,
    schema: ZodSchema<T>,
): Promise<{ data: T } | { error: Response }> {
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return {
            error: Response.json({ error: "invalid JSON", code: "INVALID_JSON" } satisfies ApiError, {
                status: 400,
            }),
        };
    }

    const result = schema.safeParse(body);
    if (!result.success) {
        return {
            error: Response.json(formatZodError(result.error), { status: 400 }),
        };
    }

    return { data: result.data };
}

export function parseQueryParams<T>(url: URL, schema: ZodSchema<T>): { data: T } | { error: Response } {
    const params = Object.fromEntries(url.searchParams);
    const result = schema.safeParse(params);
    if (!result.success) {
        return {
            error: Response.json(formatZodError(result.error), { status: 400 }),
        };
    }
    return { data: result.data };
}
