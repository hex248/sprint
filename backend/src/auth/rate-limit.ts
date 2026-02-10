type RateLimitConfig = {
    windowMs: number;
    max: number;
    backoffBaseMs?: number;
    backoffMaxMs?: number;
};

type RateLimitState = {
    count: number;
    windowStart: number;
    blockedUntil?: number;
};

type RateLimitResult = {
    allowed: boolean;
    retryAfterMs?: number;
};

const rateLimitStore = new Map<string, RateLimitState>();

export const LOGIN_RATE_LIMIT: RateLimitConfig = {
    windowMs: 15 * 60 * 1000,
    max: 5,
    backoffBaseMs: 60 * 1000,
    backoffMaxMs: 15 * 60 * 1000,
};

export const GLOBAL_RATE_LIMIT: RateLimitConfig = {
    windowMs: 60 * 1000,
    max: 300,
};

export const REGISTER_RATE_LIMIT: RateLimitConfig = {
    windowMs: 60 * 60 * 1000,
    max: 3,
};

export const getClientIP = (req: Request) => {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() || "unknown";
    }
    return req.headers.get("x-real-ip") ?? "unknown";
};

const getRetryAfter = (state: RateLimitState, now: number, config: RateLimitConfig) => {
    if (state.blockedUntil && state.blockedUntil > now) {
        return state.blockedUntil - now;
    }
    const windowEndsAt = state.windowStart + config.windowMs;
    return windowEndsAt > now ? windowEndsAt - now : 0;
};

export const checkRateLimit = (key: string, config: RateLimitConfig): RateLimitResult => {
    const now = Date.now();
    const state = rateLimitStore.get(key);
    if (!state) {
        return { allowed: true };
    }

    if (now - state.windowStart > config.windowMs) {
        rateLimitStore.delete(key);
        return { allowed: true };
    }

    if (state.blockedUntil && state.blockedUntil > now) {
        return { allowed: false, retryAfterMs: state.blockedUntil - now };
    }

    if (state.count >= config.max) {
        return { allowed: false, retryAfterMs: getRetryAfter(state, now, config) };
    }

    return { allowed: true };
};

export const recordRateLimitAttempt = (key: string, config: RateLimitConfig): RateLimitResult => {
    const now = Date.now();
    const existing = rateLimitStore.get(key);
    const state: RateLimitState = existing
        ? { ...existing }
        : {
              count: 0,
              windowStart: now,
          };

    if (now - state.windowStart > config.windowMs) {
        state.count = 0;
        state.windowStart = now;
        state.blockedUntil = undefined;
    }

    state.count += 1;

    if (state.count >= config.max) {
        if (config.backoffBaseMs) {
            const overage = state.count - config.max;
            const delay = Math.min(
                config.backoffMaxMs ?? config.backoffBaseMs,
                config.backoffBaseMs * 2 ** Math.max(0, overage),
            );
            state.blockedUntil = now + delay;
        } else {
            state.blockedUntil = state.windowStart + config.windowMs;
        }
    }

    rateLimitStore.set(key, state);

    if (state.blockedUntil && state.blockedUntil > now) {
        return { allowed: false, retryAfterMs: state.blockedUntil - now };
    }

    return { allowed: true };
};

export const resetRateLimit = (key: string) => {
    rateLimitStore.delete(key);
};

export const rateLimitResponse = (retryAfterMs?: number) => {
    const headers = new Headers();
    if (retryAfterMs && retryAfterMs > 0) {
        headers.set("Retry-After", Math.ceil(retryAfterMs / 1000).toString());
    }
    return Response.json(
        { error: "too many requests", code: "RATE_LIMITED" },
        {
            status: 429,
            headers,
        },
    );
};
