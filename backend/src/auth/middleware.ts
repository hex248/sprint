import type { BunRequest } from "bun";
import { getSession } from "../db/queries";
import { GLOBAL_RATE_LIMIT, getClientIP, rateLimitResponse, recordRateLimitAttempt } from "./rate-limit";
import { parseCookies, verifyToken } from "./utils";

export type AuthedRequest<T extends BunRequest = BunRequest> = T & {
    userId: number;
    sessionId: number;
    csrfToken: string;
};

type RouteHandler<T extends BunRequest = BunRequest> = (req: T) => Response | Promise<Response>;

type AuthedRouteHandler<T extends BunRequest = BunRequest> = (
    req: AuthedRequest<T>,
) => Response | Promise<Response>;

const extractTokenFromCookie = (req: Request) => {
    const cookies = parseCookies(req.headers.get("Cookie"));
    return cookies.token || null;
};

export const withRateLimit = <T extends BunRequest>(handler: RouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const ip = getClientIP(req);
        const key = `global:ip:${ip}`;
        const attempt = recordRateLimitAttempt(key, GLOBAL_RATE_LIMIT);
        if (!attempt.allowed) {
            return rateLimitResponse(attempt.retryAfterMs);
        }

        return handler(req);
    };
};

export const withAuth = <T extends BunRequest>(handler: AuthedRouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const token = extractTokenFromCookie(req);
        if (!token) {
            return new Response("Unauthorized", { status: 401 });
        }

        try {
            const { sessionId, userId } = verifyToken(token);

            // validate session exists and is not expired
            const session = await getSession(sessionId);
            if (!session || session.expiresAt < new Date()) {
                return new Response("Session expired", { status: 401 });
            }

            if (session.userId !== userId) {
                return new Response("Invalid session", { status: 401 });
            }

            return handler(
                Object.assign(req, {
                    userId,
                    sessionId,
                    csrfToken: session.csrfToken,
                }) as AuthedRequest<T>,
            );
        } catch {
            return new Response("Invalid token", { status: 401 });
        }
    };
};

export const withCSRF = <T extends BunRequest>(handler: AuthedRouteHandler<T>): AuthedRouteHandler<T> => {
    return async (req: AuthedRequest<T>) => {
        // only validate CSRF for methods which modify state
        if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
            const csrfHeader = req.headers.get("X-CSRF-Token");
            if (!csrfHeader || csrfHeader !== req.csrfToken) {
                return new Response("Invalid CSRF token", { status: 403 });
            }
        }
        return handler(req);
    };
};

const CORS_ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:1420")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const CORS_ALLOW_METHODS = process.env.CORS_ALLOW_METHODS ?? "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_ALLOW_HEADERS_DEFAULT =
    process.env.CORS_ALLOW_HEADERS ?? "Content-Type, Authorization, X-CSRF-Token";
const CORS_MAX_AGE = process.env.CORS_MAX_AGE ?? "86400";

const getCorsAllowOrigin = (req: Request) => {
    const requestOrigin = req.headers.get("Origin");
    if (!requestOrigin) {
        return null;
    }

    // when wildcard is configured, reflect the request origin back
    // this allows credentials to work with any origin
    if (CORS_ALLOWED_ORIGINS.includes("*")) {
        return requestOrigin;
    }

    if (CORS_ALLOWED_ORIGINS.includes(requestOrigin)) {
        return requestOrigin;
    }

    return null;
};

const buildCorsHeaders = (req: Request) => {
    const headers = new Headers();

    const allowOrigin = getCorsAllowOrigin(req);
    if (allowOrigin) {
        headers.set("Access-Control-Allow-Origin", allowOrigin);
        headers.set("Access-Control-Allow-Credentials", "true");
        headers.set("Vary", "Origin");
    }

    headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);

    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    headers.set("Access-Control-Allow-Headers", requestedHeaders || CORS_ALLOW_HEADERS_DEFAULT);

    headers.set("Access-Control-Max-Age", CORS_MAX_AGE);

    return headers;
};

export const withCors = <T extends BunRequest>(handler: RouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const corsHeaders = buildCorsHeaders(req);
        const securityHeaders = new Headers();
        securityHeaders.set("X-Content-Type-Options", "nosniff");
        securityHeaders.set("X-Frame-Options", "DENY");
        securityHeaders.set("X-XSS-Protection", "1; mode=block");
        securityHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");

        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const res = await handler(req);
        const wrapped = new Response(res.body, res);

        corsHeaders.forEach((value, key) => {
            wrapped.headers.set(key, value);
        });

        securityHeaders.forEach((value, key) => {
            wrapped.headers.set(key, value);
        });

        return wrapped;
    };
};
