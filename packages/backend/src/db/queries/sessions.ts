import { Session } from "@sprint/shared";
import { eq, lt } from "drizzle-orm";
import { db } from "../client";

const generateCsrfToken = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export async function createSession(userId: number) {
    const csrfToken = generateCsrfToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const [session] = await db.insert(Session).values({ userId, csrfToken, expiresAt }).returning();
    return session;
}

export async function getSession(sessionId: number) {
    const [session] = await db.select().from(Session).where(eq(Session.id, sessionId));
    return session;
}

export async function deleteSession(sessionId: number) {
    await db.delete(Session).where(eq(Session.id, sessionId));
}

export async function deleteUserSessions(userId: number) {
    await db.delete(Session).where(eq(Session.userId, userId));
}

export async function cleanupExpiredSessions() {
    const result = await db.delete(Session).where(lt(Session.expiresAt, new Date()));
    return result.rowCount ?? 0;
}
