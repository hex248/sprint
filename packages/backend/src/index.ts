import { db, testDB } from "./db/client";
import { User } from "@issue/shared";
import { routes } from "./routes";
import { createDemoData } from "./utils";

const DEV = process.argv.find((arg) => ["--dev", "--developer", "-d"].includes(arg.toLowerCase())) != null;
const PORT = process.argv.find((arg) => arg.toLowerCase().startsWith("--port="))?.split("=")[1] || 0;

type RouteHandler<T extends Request = Request> = (req: T) => Response | Promise<Response>;

const CORS_ALLOWED_ORIGINS = (process.env.CORS_ORIGIN ?? "http://localhost:1420")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const CORS_ALLOW_METHODS = process.env.CORS_ALLOW_METHODS ?? "GET,POST,PUT,PATCH,DELETE,OPTIONS";
const CORS_ALLOW_HEADERS_DEFAULT = process.env.CORS_ALLOW_HEADERS ?? "Content-Type, Authorization";
const CORS_MAX_AGE = process.env.CORS_MAX_AGE ?? "86400";

const getCorsAllowOrigin = (req: Request) => {
    const requestOrigin = req.headers.get("Origin");
    if (!requestOrigin) {
        return "*";
    }

    if (CORS_ALLOWED_ORIGINS.includes("*")) {
        return "*";
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
        if (allowOrigin !== "*") {
            headers.set("Vary", "Origin");
        }
    }

    headers.set("Access-Control-Allow-Methods", CORS_ALLOW_METHODS);

    const requestedHeaders = req.headers.get("Access-Control-Request-Headers");
    headers.set("Access-Control-Allow-Headers", requestedHeaders || CORS_ALLOW_HEADERS_DEFAULT);

    headers.set("Access-Control-Max-Age", CORS_MAX_AGE);

    return headers;
};

const withCors = <T extends Request>(handler: RouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const corsHeaders = buildCorsHeaders(req);

        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        const res = await handler(req);
        const wrapped = new Response(res.body, res);

        corsHeaders.forEach((value, key) => {
            wrapped.headers.set(key, value);
        });

        return wrapped;
    };
};

const main = async () => {
    const server = Bun.serve({
        port: Number(PORT),
        routes: {
            "/": withCors(() => new Response(`title: eussi\ndev-mode: ${DEV}\nport: ${PORT}`)),

            "/issue/create": withCors(routes.issueCreate),
            "/issue/update": withCors(routes.issueUpdate),
            "/issue/delete": withCors(routes.issueDelete),
            "/issues/:projectBlob": withCors(routes.issuesInProject),
            "/issues/all": withCors(routes.issues),

            "/project/create": withCors(routes.projectCreate),
            "/project/update": withCors(routes.projectUpdate),
            "/project/delete": withCors(routes.projectDelete),
        },
    });

    console.log(`eussi (issue server) listening on ${server.url}`);
    await testDB();

    if (DEV) {
        const users = await db.select().from(User);
        if (users.length === 0) {
            console.log("creating demo data...");
            await createDemoData();
            console.log("demo data created");
        }
    }
};

main();
