import {
    Attachment,
    Issue,
    IssueAssignee,
    type IssueCreateRequest,
    type IssueResponse,
    User,
    type UserResponse,
} from "@sprint/shared";
import { aliasedTable, and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "../client";
import { toPublicUser } from "./users";

type CreateIssueInput = IssueCreateRequest & {
    creatorId: number;
};

export async function createIssue({
    projectId,
    title,
    description,
    creatorId,
    status,
    type,
    sprintId,
    assigneeIds,
    attachmentIds,
}: CreateIssueInput) {
    // prevents two issues with the same unique number
    return await db.transaction(async (tx) => {
        // raw sql for speed
        // most recent issue from project
        const [lastIssue] = await tx
            .select({ max: sql<number>`MAX(${Issue.number})` })
            .from(Issue)
            .where(eq(Issue.projectId, projectId));

        const nextNumber = (lastIssue?.max || 0) + 1;

        const [newIssue] = await tx
            .insert(Issue)
            .values({
                projectId,
                title,
                description,
                number: nextNumber,
                creatorId,
                sprintId,
                status,
                type,
            })
            .returning();

        if (!newIssue) {
            throw new Error("failed to create issue");
        }

        if (assigneeIds && assigneeIds.length > 0) {
            await tx.insert(IssueAssignee).values(
                assigneeIds.map((userId) => ({
                    issueId: newIssue.id,
                    userId,
                })),
            );
        }

        if (attachmentIds && attachmentIds.length > 0) {
            await tx
                .update(Attachment)
                .set({ issueId: newIssue.id, issueCommentId: null })
                .where(
                    and(
                        inArray(Attachment.id, attachmentIds),
                        isNull(Attachment.issueId),
                        isNull(Attachment.issueCommentId),
                    ),
                );
        }

        return newIssue;
    });
}

export async function deleteIssue(id: number) {
    return await db.delete(Issue).where(eq(Issue.id, id));
}

export async function updateIssue(
    id: number,
    updates: {
        title?: string;
        description?: string;
        sprintId?: number | null;
        type?: string;
        status?: string;
    },
) {
    return await db.update(Issue).set(updates).where(eq(Issue.id, id)).returning();
}

export async function setIssueAssignees(issueId: number, userIds: number[]) {
    return await db.transaction(async (tx) => {
        await tx.delete(IssueAssignee).where(eq(IssueAssignee.issueId, issueId));

        if (userIds.length > 0) {
            await tx.insert(IssueAssignee).values(
                userIds.map((userId) => ({
                    issueId,
                    userId,
                })),
            );
        }
    });
}

export async function getIssues() {
    return await db.select().from(Issue);
}

export async function getIssuesByProject(projectId: number) {
    return await db.select().from(Issue).where(eq(Issue.projectId, projectId));
}

export async function getIssueByID(id: number) {
    const [issue] = await db.select().from(Issue).where(eq(Issue.id, id));
    return issue;
}

export async function getIssueWithUsersById(issueId: number): Promise<IssueResponse | null> {
    const Creator = aliasedTable(User, "Creator");

    const [issueWithCreator] = await db
        .select({
            Issue: Issue,
            Creator: {
                id: Creator.id,
                name: Creator.name,
                username: Creator.username,
                avatarURL: Creator.avatarURL,
                iconPreference: Creator.iconPreference,
                plan: Creator.plan,
                preferences: Creator.preferences,
                createdAt: Creator.createdAt,
                updatedAt: Creator.updatedAt,
            },
        })
        .from(Issue)
        .where(eq(Issue.id, issueId))
        .innerJoin(Creator, eq(Issue.creatorId, Creator.id));

    if (!issueWithCreator) return null;

    const assigneesData = await db
        .select({
            User: {
                id: User.id,
                name: User.name,
                username: User.username,
                avatarURL: User.avatarURL,
                iconPreference: User.iconPreference,
                plan: User.plan,
                preferences: User.preferences,
                createdAt: User.createdAt,
                updatedAt: User.updatedAt,
            },
        })
        .from(IssueAssignee)
        .innerJoin(User, eq(IssueAssignee.userId, User.id))
        .where(eq(IssueAssignee.issueId, issueId));

    const attachments = await db
        .select()
        .from(Attachment)
        .where(and(eq(Attachment.issueId, issueId), isNull(Attachment.issueCommentId)));

    return {
        Issue: issueWithCreator.Issue,
        Creator: toPublicUser(issueWithCreator.Creator),
        Assignees: assigneesData.map((row) => toPublicUser(row.User)),
        Attachments: attachments,
    };
}

export async function getIssueByNumber(projectId: number, number: number) {
    const [issue] = await db
        .select()
        .from(Issue)
        .where(and(eq(Issue.projectId, projectId), eq(Issue.number, number)));
    return issue;
}

export async function getIssueStatusCountByOrganisation(organisationId: number, status: string) {
    const { Project } = await import("@sprint/shared");

    const projects = await db
        .select({ id: Project.id })
        .from(Project)
        .where(eq(Project.organisationId, organisationId));
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return { count: 0 };

    const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(Issue)
        .where(and(eq(Issue.status, status), inArray(Issue.projectId, projectIds)));

    return { count: result?.count ?? 0 };
}

export async function replaceIssueStatus(organisationId: number, oldStatus: string, newStatus: string) {
    const { Project } = await import("@sprint/shared");

    // get all project IDs for this organisation
    const projects = await db
        .select({ id: Project.id })
        .from(Project)
        .where(eq(Project.organisationId, organisationId));
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return { updated: 0 };

    // update all issues with oldStatus to newStatus for projects in this organisation
    const result = await db
        .update(Issue)
        .set({ status: newStatus })
        .where(and(eq(Issue.status, oldStatus), inArray(Issue.projectId, projectIds)));

    return { updated: result.rowCount ?? 0 };
}

export async function getIssueTypeCountByOrganisation(organisationId: number, type: string) {
    const { Project } = await import("@sprint/shared");

    const projects = await db
        .select({ id: Project.id })
        .from(Project)
        .where(eq(Project.organisationId, organisationId));
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return { count: 0 };

    const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(Issue)
        .where(and(eq(Issue.type, type), inArray(Issue.projectId, projectIds)));

    return { count: result?.count ?? 0 };
}

export async function replaceIssueType(organisationId: number, oldType: string, newType: string) {
    const { Project } = await import("@sprint/shared");

    const projects = await db
        .select({ id: Project.id })
        .from(Project)
        .where(eq(Project.organisationId, organisationId));
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return { updated: 0 };

    const result = await db
        .update(Issue)
        .set({ type: newType })
        .where(and(eq(Issue.type, oldType), inArray(Issue.projectId, projectIds)));

    return { updated: result.rowCount ?? 0 };
}

export async function getIssuesWithUsersByProject(projectId: number): Promise<IssueResponse[]> {
    const Creator = aliasedTable(User, "Creator");

    const issuesWithCreators = await db
        .select({
            Issue: Issue,
            Creator: {
                id: Creator.id,
                name: Creator.name,
                username: Creator.username,
                avatarURL: Creator.avatarURL,
                iconPreference: Creator.iconPreference,
                plan: Creator.plan,
                preferences: Creator.preferences,
                createdAt: Creator.createdAt,
                updatedAt: Creator.updatedAt,
            },
        })
        .from(Issue)
        .where(eq(Issue.projectId, projectId))
        .innerJoin(Creator, eq(Issue.creatorId, Creator.id));

    const issueIds = issuesWithCreators.map((i) => i.Issue.id);
    const assigneesData =
        issueIds.length > 0
            ? await db
                  .select({
                      issueId: IssueAssignee.issueId,
                      User: {
                          id: User.id,
                          name: User.name,
                          username: User.username,
                          avatarURL: User.avatarURL,
                          iconPreference: User.iconPreference,
                          plan: User.plan,
                          preferences: User.preferences,
                          createdAt: User.createdAt,
                          updatedAt: User.updatedAt,
                      },
                  })
                  .from(IssueAssignee)
                  .innerJoin(User, eq(IssueAssignee.userId, User.id))
                  .where(inArray(IssueAssignee.issueId, issueIds))
            : [];

    const assigneesByIssue = new Map<number, UserResponse[]>();
    for (const a of assigneesData) {
        const existing = assigneesByIssue.get(a.issueId) || [];
        existing.push(toPublicUser(a.User));
        assigneesByIssue.set(a.issueId, existing);
    }

    const attachmentRows =
        issueIds.length > 0
            ? await db
                  .select({ issueId: Attachment.issueId, Attachment })
                  .from(Attachment)
                  .where(and(inArray(Attachment.issueId, issueIds), isNull(Attachment.issueCommentId)))
            : [];

    const attachmentsByIssue = new Map<number, (typeof attachmentRows)[number]["Attachment"][]>();
    for (const row of attachmentRows) {
        if (row.issueId == null) {
            continue;
        }
        const existing = attachmentsByIssue.get(row.issueId) || [];
        existing.push(row.Attachment);
        attachmentsByIssue.set(row.issueId, existing);
    }

    return issuesWithCreators.map((row) => ({
        Issue: row.Issue,
        Creator: toPublicUser(row.Creator),
        Assignees: assigneesByIssue.get(row.Issue.id) || [],
        Attachments: attachmentsByIssue.get(row.Issue.id) || [],
    }));
}

export async function getIssueAssigneeCount(issueId: number): Promise<number> {
    const [result] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(IssueAssignee)
        .where(eq(IssueAssignee.issueId, issueId));
    return result?.count ?? 0;
}

export async function getOrganisationIssueCount(organisationId: number): Promise<number> {
    const { Project } = await import("@sprint/shared");

    const projects = await db
        .select({ id: Project.id })
        .from(Project)
        .where(eq(Project.organisationId, organisationId));
    const projectIds = projects.map((p) => p.id);

    if (projectIds.length === 0) return 0;

    const [result] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(Issue)
        .where(inArray(Issue.projectId, projectIds));

    return result?.count ?? 0;
}

export async function isIssueAssignee(issueId: number, userId: number): Promise<boolean> {
    const [assignee] = await db
        .select({ id: IssueAssignee.id })
        .from(IssueAssignee)
        .where(and(eq(IssueAssignee.issueId, issueId), eq(IssueAssignee.userId, userId)));
    return Boolean(assignee);
}
