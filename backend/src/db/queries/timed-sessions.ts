import { Issue, OrganisationMember, Project, TimedSession } from "@sprint/shared";
import { and, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "../client"; // Import OrganisationMember and gte, inArray for the new query

export async function getOrganisationMemberTimedSessions(organisationId: number, fromDate?: Date) {
    // First get all member user IDs for the organisation
    const members = await db
        .select({ userId: OrganisationMember.userId })
        .from(OrganisationMember)
        .where(eq(OrganisationMember.organisationId, organisationId));

    const userIds = members.map((m) => m.userId);

    if (userIds.length === 0) {
        return [];
    }

    // Build the where clause
    const conditions = [inArray(TimedSession.userId, userIds)];
    if (fromDate) {
        conditions.push(gte(TimedSession.createdAt, fromDate));
    }

    const timedSessions = await db
        .select({
            id: TimedSession.id,
            userId: TimedSession.userId,
            issueId: TimedSession.issueId,
            timestamps: TimedSession.timestamps,
            endedAt: TimedSession.endedAt,
            createdAt: TimedSession.createdAt,
            issueNumber: Issue.number,
            projectKey: Project.key,
        })
        .from(TimedSession)
        .innerJoin(Issue, eq(TimedSession.issueId, Issue.id))
        .innerJoin(Project, eq(Issue.projectId, Project.id))
        .where(and(...conditions))
        .orderBy(desc(TimedSession.createdAt));

    return timedSessions;
}

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

export async function getInactiveTimedSessions(issueId: number) {
    const timedSessions = await db
        .select()
        .from(TimedSession)
        .where(and(eq(TimedSession.issueId, issueId), isNotNull(TimedSession.endedAt)))
        .orderBy(desc(TimedSession.createdAt));
    return timedSessions ?? null;
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

export async function getActiveTimedSessionsWithIssue(userId: number) {
    const timedSessions = await db
        .select({
            id: TimedSession.id,
            userId: TimedSession.userId,
            issueId: TimedSession.issueId,
            timestamps: TimedSession.timestamps,
            endedAt: TimedSession.endedAt,
            createdAt: TimedSession.createdAt,
            issueNumber: Issue.number,
            projectKey: Project.key,
        })
        .from(TimedSession)
        .innerJoin(Issue, eq(TimedSession.issueId, Issue.id))
        .innerJoin(Project, eq(Issue.projectId, Project.id))
        .where(and(eq(TimedSession.userId, userId), isNull(TimedSession.endedAt)))
        .orderBy(desc(TimedSession.createdAt));
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

// global timer queries (issueId = null)

export async function createGlobalTimedSession(userId: number) {
    const [timedSession] = await db
        .insert(TimedSession)
        .values({ userId, issueId: null, timestamps: [new Date()] })
        .returning();
    return timedSession;
}

export async function getActiveGlobalTimedSession(userId: number) {
    const [timedSession] = await db
        .select()
        .from(TimedSession)
        .where(
            and(eq(TimedSession.userId, userId), isNull(TimedSession.issueId), isNull(TimedSession.endedAt)),
        );
    return timedSession ?? null;
}

export async function endAllActiveIssueTimers(userId: number) {
    const now = new Date();
    // find all active issue timers (issueId not null, endedAt null)
    const activeSessions = await db
        .select()
        .from(TimedSession)
        .where(
            and(
                eq(TimedSession.userId, userId),
                isNotNull(TimedSession.issueId),
                isNull(TimedSession.endedAt),
            ),
        );

    for (const session of activeSessions) {
        let finalTimestamps = [...(session.timestamps || [])];
        // if running (odd timestamps), add final timestamp
        if (finalTimestamps.length % 2 === 1) {
            finalTimestamps = [...finalTimestamps, now];
        }
        await db
            .update(TimedSession)
            .set({ timestamps: finalTimestamps, endedAt: now })
            .where(eq(TimedSession.id, session.id));
    }
}

export async function endActiveGlobalTimer(userId: number) {
    const now = new Date();
    const session = await getActiveGlobalTimedSession(userId);
    if (!session) return null;

    let finalTimestamps = [...(session.timestamps || [])];
    if (finalTimestamps.length % 2 === 1) {
        finalTimestamps = [...finalTimestamps, now];
    }

    const [ended] = await db
        .update(TimedSession)
        .set({ timestamps: finalTimestamps, endedAt: now })
        .where(eq(TimedSession.id, session.id))
        .returning();

    return ended;
}

export async function getActiveTimedSessionsWithIssueIncludingGlobal(userId: number) {
    // get issue-linked sessions
    const issueSessions = await db
        .select({
            id: TimedSession.id,
            userId: TimedSession.userId,
            issueId: TimedSession.issueId,
            timestamps: TimedSession.timestamps,
            endedAt: TimedSession.endedAt,
            createdAt: TimedSession.createdAt,
            issueNumber: Issue.number,
            projectKey: Project.key,
        })
        .from(TimedSession)
        .innerJoin(Issue, eq(TimedSession.issueId, Issue.id))
        .innerJoin(Project, eq(Issue.projectId, Project.id))
        .where(and(eq(TimedSession.userId, userId), isNull(TimedSession.endedAt)))
        .orderBy(desc(TimedSession.createdAt));

    // get global sessions (issueId null)
    const globalSessions = await db
        .select({
            id: TimedSession.id,
            userId: TimedSession.userId,
            issueId: TimedSession.issueId,
            timestamps: TimedSession.timestamps,
            endedAt: TimedSession.endedAt,
            createdAt: TimedSession.createdAt,
        })
        .from(TimedSession)
        .where(
            and(eq(TimedSession.userId, userId), isNull(TimedSession.issueId), isNull(TimedSession.endedAt)),
        )
        .orderBy(desc(TimedSession.createdAt));

    // map global sessions to match shape
    const mappedGlobal = globalSessions.map((s) => ({
        ...s,
        issueNumber: null as number | null,
        projectKey: null as string | null,
    }));

    return [...mappedGlobal, ...issueSessions];
}

export async function getInactiveGlobalTimedSessions(userId: number) {
    const timedSessions = await db
        .select()
        .from(TimedSession)
        .where(
            and(
                eq(TimedSession.userId, userId),
                isNull(TimedSession.issueId),
                isNotNull(TimedSession.endedAt),
            ),
        )
        .orderBy(desc(TimedSession.createdAt));
    return timedSessions;
}
