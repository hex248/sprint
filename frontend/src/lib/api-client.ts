import type { ApiError } from "@sprint/shared";
import { apiContract } from "@sprint/shared";
import type { AppRoute, AppRouter } from "@ts-rest/core";
import { checkZodSchema, initClient, isAppRoute } from "@ts-rest/core";
import { getCsrfToken, getServerURL } from "@/lib/utils";

type ApiResult<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

const rawClient = initClient(apiContract, {
  baseUrl: getServerURL(),
  baseHeaders: {
    "X-CSRF-Token": () => getCsrfToken() || "",
  },
  credentials: "include",
  validateResponse: true,
  throwOnUnknownStatus: false,
});

function toErrorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const maybeApiError = error as ApiError;
    if (maybeApiError.details) {
      const messages = Object.values(maybeApiError.details).flat();
      if (messages.length > 0) return messages.join(", ");
    }
    if (typeof maybeApiError.error === "string") return maybeApiError.error;
  }
  return "unexpected error";
}

function validateRequest(route: AppRoute, input?: { body?: unknown; query?: unknown }): string | null {
  if (!input) return null;
  if ("body" in route && route.body && "body" in input) {
    const result = checkZodSchema(input.body, route.body);
    if (!result.success) {
      return result.error.issues.map((issue) => issue.message).join(", ") || "invalid request body";
    }
  }
  if ("query" in route && route.query && "query" in input) {
    const result = checkZodSchema(input.query, route.query);
    if (!result.success) {
      return result.error.issues.map((issue) => issue.message).join(", ") || "invalid query params";
    }
  }
  return null;
}

async function requestResult<T extends { status: number; body: unknown }>(
  responsePromise: Promise<T>,
): Promise<ApiResult<T["body"]>> {
  try {
    const response = await responsePromise;
    if (response.status >= 200 && response.status < 300) {
      return { data: response.body, error: null, status: response.status };
    }
    return { data: null, error: toErrorMessage(response.body), status: response.status };
  } catch (error) {
    return { data: null, error: toErrorMessage(error), status: 0 };
  }
}

type WrappedClient<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<ApiResult<R extends { body: infer B } ? B : unknown>>
    : T[K] extends object
      ? WrappedClient<T[K]>
      : T[K];
};

function wrapClient<TRouter extends AppRouter>(router: TRouter, client: unknown): unknown {
  const entries = Object.entries(router).map(([key, route]) => {
    const value = (client as Record<string, unknown>)[key];
    if (isAppRoute(route) && typeof value === "function") {
      return [
        key,
        async (input?: { body?: unknown; query?: unknown; headers?: Record<string, string> }) => {
          const validationError = validateRequest(route, input);
          if (validationError) {
            return { data: null, error: validationError, status: 0 } as ApiResult<unknown>;
          }
          return requestResult(
            (value as (args?: unknown) => Promise<{ status: number; body: unknown }>)(input),
          );
        },
      ];
    }
    if (route && typeof route === "object" && value && typeof value === "object") {
      return [key, wrapClient(route as AppRouter, value)];
    }
    return [key, value];
  });

  return Object.fromEntries(entries);
}

export const apiClient = wrapClient(apiContract, rawClient) as WrappedClient<typeof rawClient>;
export type { ApiResult };
