import { Issue, OrganisationMember, Project, TimedSession } from "@sprint/shared";
import { and, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { db } from "../client"; // Import OrganisationMember and gte, inArray for the new query

export async function getOrganisationMemberTimedSessions(organisationId: number, fromDate?: Date) {
    const members = await db
        .select({ userId: OrganisationMember.userId })
        .from(OrganisationMember)
        .where(eq(OrganisationMember.organisationId, organisationId));

    const userIds = members.map((m) => m.userId);

    if (userIds.length === 0) {
        return [];
    }

    const issueConditions = [
        inArray(TimedSession.userId, userIds),
        eq(Project.organisationId, organisationId),
    ];
    const globalConditions = [
        inArray(TimedSession.userId, userIds),
        eq(TimedSession.organisationId, organisationId),
        isNull(TimedSession.issueId),
    ];
    if (fromDate) {
        issueConditions.push(gte(TimedSession.createdAt, fromDate));
        globalConditions.push(gte(TimedSession.createdAt, fromDate));
    }

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
        .where(and(...issueConditions))
        .orderBy(desc(TimedSession.createdAt));

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
        .where(and(...globalConditions))
        .orderBy(desc(TimedSession.createdAt));

    return [
        ...issueSessions,
        ...globalSessions.map((session) => ({
            ...session,
            issueNumber: null as number | null,
            projectKey: null as string | null,
        })),
    ].sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return rightTime - leftTime;
    });
}

export async function createTimedSession(userId: number, issueId: number, organisationId: number) {
    const [timedSession] = await db
        .insert(TimedSession)
        .values({ userId, organisationId, issueId, timestamps: [new Date()] })
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

export async function getUserTimedSessions(userId: number, organisationId: number, limit = 50, offset = 0) {
    const timedSessions = await db
        .select()
        .from(TimedSession)
        .where(and(eq(TimedSession.userId, userId), eq(TimedSession.organisationId, organisationId)))
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

export async function createGlobalTimedSession(userId: number, organisationId: number) {
    const [timedSession] = await db
        .insert(TimedSession)
        .values({ userId, organisationId, issueId: null, timestamps: [new Date()] })
        .returning();
    return timedSession;
}

export async function getActiveGlobalTimedSession(userId: number, organisationId: number) {
    const [timedSession] = await db
        .select()
        .from(TimedSession)
        .where(
            and(
                eq(TimedSession.userId, userId),
                eq(TimedSession.organisationId, organisationId),
                isNull(TimedSession.issueId),
                isNull(TimedSession.endedAt),
            ),
        );
    return timedSession ?? null;
}

export async function endAllActiveIssueTimers(userId: number, organisationId: number) {
    const now = new Date();
    const activeSessions = await db
        .select({
            id: TimedSession.id,
            timestamps: TimedSession.timestamps,
        })
        .from(TimedSession)
        .innerJoin(Issue, eq(TimedSession.issueId, Issue.id))
        .innerJoin(Project, eq(Issue.projectId, Project.id))
        .where(
            and(
                eq(TimedSession.userId, userId),
                eq(Project.organisationId, organisationId),
                isNull(TimedSession.endedAt),
            ),
        );

    for (const session of activeSessions) {
        let finalTimestamps = [...(session.timestamps || [])];
        if (finalTimestamps.length % 2 === 1) {
            finalTimestamps = [...finalTimestamps, now];
        }
        await db
            .update(TimedSession)
            .set({ timestamps: finalTimestamps, endedAt: now })
            .where(eq(TimedSession.id, session.id));
    }
}

export async function endActiveGlobalTimer(userId: number, organisationId: number) {
    const now = new Date();
    const session = await getActiveGlobalTimedSession(userId, organisationId);
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

export async function getActiveTimedSessionsWithIssueIncludingGlobal(userId: number, organisationId: number) {
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
        .where(
            and(
                eq(TimedSession.userId, userId),
                eq(Project.organisationId, organisationId),
                isNull(TimedSession.endedAt),
            ),
        )
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
            and(
                eq(TimedSession.userId, userId),
                eq(TimedSession.organisationId, organisationId),
                isNull(TimedSession.issueId),
                isNull(TimedSession.endedAt),
            ),
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

export async function getInactiveGlobalTimedSessions(userId: number, organisationId: number) {
    const timedSessions = await db
        .select()
        .from(TimedSession)
        .where(
            and(
                eq(TimedSession.userId, userId),
                eq(TimedSession.organisationId, organisationId),
                isNull(TimedSession.issueId),
                isNotNull(TimedSession.endedAt),
            ),
        )
        .orderBy(desc(TimedSession.createdAt));
    return timedSessions;
}
