import type { BunRequest } from "bun";

type LogLevel = "info" | "warn" | "error";

interface RequestLog {
    timestamp: Date;
    level: LogLevel;
    method: string;
    url: string;
    status: number;
    duration: number;
    userId?: number;
}

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

const shouldLog = (level: LogLevel): boolean => {
    const levels: LogLevel[] = ["info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(LOG_LEVEL);
};

const COLORS = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
};

const getStatusColor = (status: number): string => {
    if (status >= 500) return COLORS.red;
    if (status >= 400) return COLORS.yellow;
    if (status >= 300) return COLORS.cyan;
    return COLORS.green;
};

const getMethodColor = (method: string): string => {
    switch (method) {
        case "GET":
            return COLORS.green;
        case "POST":
            return COLORS.cyan;
        case "PUT":
        case "PATCH":
            return COLORS.yellow;
        case "DELETE":
            return COLORS.red;
        default:
            return COLORS.reset;
    }
};

const formatTimestamp = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
};

const formatLog = (log: RequestLog): string => {
    const timestamp = `${COLORS.dim}${formatTimestamp(log.timestamp)}${COLORS.reset}`;
    const method = `${getMethodColor(log.method)}${log.method}${COLORS.reset}`;
    const url = log.url;
    const status = `${getStatusColor(log.status)}${log.status}${COLORS.reset}`;
    const duration = `${COLORS.dim}${log.duration}ms${COLORS.reset}`;
    const user = log.userId ? ` ${COLORS.magenta}user:${log.userId}${COLORS.reset}` : "";

    return `${timestamp} ${method} ${url} ${status} ${duration}${user}`;
};

const writeLog = (log: RequestLog) => {
    if (!shouldLog(log.level)) return;
    console.log(formatLog(log));
};

const getLogLevel = (status: number): LogLevel => {
    if (status >= 500) return "error";
    if (status >= 400) return "warn";
    return "info";
};

type RouteHandler<T extends BunRequest = BunRequest> = (req: T) => Response | Promise<Response>;

export const withLogging = <T extends BunRequest>(handler: RouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const start = performance.now();
        const url = new URL(req.url);

        try {
            const res = await handler(req);
            const duration = Math.round(performance.now() - start);

            const log: RequestLog = {
                timestamp: new Date(),
                level: getLogLevel(res.status),
                method: req.method,
                url: url.pathname,
                status: res.status,
                duration,
            };

            writeLog(log);
            return res;
        } catch (error) {
            const duration = Math.round(performance.now() - start);

            const log: RequestLog = {
                timestamp: new Date(),
                level: "error",
                method: req.method,
                url: url.pathname,
                status: 500,
                duration,
            };

            writeLog(log);
            throw error;
        }
    };
};

export const withAuthedLogging = <T extends BunRequest>(handler: RouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const start = performance.now();
        const url = new URL(req.url);

        try {
            const res = await handler(req);
            const duration = Math.round(performance.now() - start);

            const log: RequestLog = {
                timestamp: new Date(),
                level: getLogLevel(res.status),
                method: req.method,
                url: url.pathname,
                status: res.status,
                duration,
                userId: (req as { userId?: number }).userId,
            };

            writeLog(log);
            return res;
        } catch (error) {
            const duration = Math.round(performance.now() - start);

            const log: RequestLog = {
                timestamp: new Date(),
                level: "error",
                method: req.method,
                url: url.pathname,
                status: 500,
                duration,
                userId: (req as { userId?: number }).userId,
            };

            writeLog(log);
            throw error;
        }
    };
};
