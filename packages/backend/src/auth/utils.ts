import * as jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"];

const requireJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is required");
    }
    return secret;
};

export const generateToken = (userId: number) => {
    const secret = requireJwtSecret();
    return jwt.sign({ userId }, secret, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string) => {
    const secret = requireJwtSecret();
    return jwt.verify(token, secret) as { userId: number };
};
