import { TimedSession } from "@issue/shared";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "../client";

export async function createTimedSession(userId: number, issueId: number) {
    const [timedSession] = await db
        .insert(TimedSession)
        .values({ userId, issueId, timestamps: [new Date()] })
        .returning();
    return timedSession;
}

export async function getActiveTimedSession(userId: number, issueId: number) {
    const [timedSession] = await db
        .select()
        .from(TimedSession)
        .where(
            and(
                eq(TimedSession.userId, userId),
                eq(TimedSession.issueId, issueId),
                isNull(TimedSession.endedAt),
            ),
        );
    return timedSession ?? null;
}

export async function getTimedSessionById(id: number) {
    const [timedSession] = await db.select().from(TimedSession).where(eq(TimedSession.id, id));
    return timedSession ?? null;
}

export async function appendTimestamp(timedSessionId: number, currentTimestamps: Date[]) {
    const now = new Date();
    const updatedTimestamps = [...currentTimestamps, now];

    const [updatedTimedSession] = await db
        .update(TimedSession)
        .set({ timestamps: updatedTimestamps })
        .where(eq(TimedSession.id, timedSessionId))
        .returning();

    return updatedTimedSession;
}

export async function endTimedSession(timedSessionId: number, currentTimestamps: Date[]) {
    const now = new Date();
    let finalTimestamps = [...currentTimestamps];

    // if timer is running (odd timestamps), add final timestamp
    if (finalTimestamps.length % 2 === 1) {
        finalTimestamps = [...finalTimestamps, now];
    }

    const [endedTimedSession] = await db
        .update(TimedSession)
        .set({ timestamps: finalTimestamps, endedAt: now })
        .where(eq(TimedSession.id, timedSessionId))
        .returning();

    return endedTimedSession;
}

export async function getUserTimedSessions(userId: number, limit = 50, offset = 0) {
    const timedSessions = await db
        .select()
        .from(TimedSession)
        .where(eq(TimedSession.userId, userId))
        .orderBy(desc(TimedSession.createdAt))
        .limit(limit)
        .offset(offset);
    return timedSessions;
}

export async function getCompletedTimedSessions(userId: number, limit = 50, offset = 0) {
    const timedSessions = await db
        .select()
        .from(TimedSession)
        .where(and(eq(TimedSession.userId, userId), isNotNull(TimedSession.endedAt)))
        .orderBy(desc(TimedSession.createdAt))
        .limit(limit)
        .offset(offset);
    return timedSessions;
}
