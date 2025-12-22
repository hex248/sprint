import type { BunRequest } from "bun";
import { verifyToken } from "./utils";

export type AuthedRequest<T extends BunRequest = BunRequest> = T & { userId: number };

type RouteHandler<T extends BunRequest = BunRequest> = (req: T) => Response | Promise<Response>;

type AuthedRouteHandler<T extends BunRequest = BunRequest> = (
    req: AuthedRequest<T>,
) => Response | Promise<Response>;

const extractBearerToken = (req: Request) => {
    const header = req.headers.get("Authorization");
    if (!header) {
        return null;
    }

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
        return null;
    }

    return token;
};

export const withAuth = <T extends BunRequest>(handler: AuthedRouteHandler<T>): RouteHandler<T> => {
    return async (req: T) => {
        const token = extractBearerToken(req);
        if (!token) {
            return new Response("Unauthorized", { status: 401 });
        }

        try {
            const { userId } = verifyToken(token);
            return handler(Object.assign(req, { userId }) as AuthedRequest<T>);
        } catch {
            return new Response("Invalid token", { status: 401 });
        }
    };
};

