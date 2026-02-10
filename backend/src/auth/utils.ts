import bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];
const JWT_ALGORITHM = "HS256" as const;
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

const requireJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is required");
    }
    if (secret.length < 32) {
        throw new Error("JWT_SECRET must be at least 32 characters");
    }
    return secret;
};

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export const generateToken = (sessionId: number, userId: number) => {
    const secret = requireJwtSecret();
    return jwt.sign({ sessionId, userId }, secret, {
        expiresIn: JWT_EXPIRES_IN,
        algorithm: JWT_ALGORITHM,
    });
};

export const verifyToken = (token: string) => {
    const secret = requireJwtSecret();
    return jwt.verify(token, secret, {
        algorithms: [JWT_ALGORITHM],
    }) as { sessionId: number; userId: number };
};

export const buildAuthCookie = (token: string) => {
    return `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${COOKIE_MAX_AGE}`; // it pains me that this is in seconds
};

export const buildClearAuthCookie = () => {
    return "token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0";
};

export const parseCookies = (cookieHeader: string | null): Record<string, string> => {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(";").map((cookie) => {
            const [key, ...rest] = cookie.trim().split("=");
            return [key, rest.join("=")];
        }),
    );
};
