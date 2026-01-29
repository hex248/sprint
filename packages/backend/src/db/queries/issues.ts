import { Issue, IssueAssignee, type IssueResponseRecord, User, type UserRecord } from "@sprint/shared";
import { aliasedTable, and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../client";

export async function createIssue(
    projectId: number,
    title: string,
    description: string,
    creatorId: number,
    sprintId?: number,
    assigneeIds?: number[],
    status?: string,
) {
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
                ...(status && { status }),
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

export async function getIssueWithUsersById(issueId: number): Promise<IssueResponseRecord | null> {
    const Creator = aliasedTable(User, "Creator");

    const [issueWithCreator] = await db
        .select({
            Issue: Issue,
            Creator: Creator,
        })
        .from(Issue)
        .where(eq(Issue.id, issueId))
        .innerJoin(Creator, eq(Issue.creatorId, Creator.id));

    if (!issueWithCreator) return null;

    const assigneesData = await db
        .select({
            User: User,
        })
        .from(IssueAssignee)
        .innerJoin(User, eq(IssueAssignee.userId, User.id))
        .where(eq(IssueAssignee.issueId, issueId));

    return {
        Issue: issueWithCreator.Issue,
        Creator: issueWithCreator.Creator,
        Assignees: assigneesData.map((row) => row.User),
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

export async function getIssuesWithUsersByProject(projectId: number): Promise<IssueResponseRecord[]> {
    const Creator = aliasedTable(User, "Creator");

    const issuesWithCreators = await db
        .select({
            Issue: Issue,
            Creator: Creator,
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
                      User: User,
                  })
                  .from(IssueAssignee)
                  .innerJoin(User, eq(IssueAssignee.userId, User.id))
                  .where(inArray(IssueAssignee.issueId, issueIds))
            : [];

    const assigneesByIssue = new Map<number, UserRecord[]>();
    for (const a of assigneesData) {
        const existing = assigneesByIssue.get(a.issueId) || [];
        existing.push(a.User);
        assigneesByIssue.set(a.issueId, existing);
    }

    return issuesWithCreators.map((row) => ({
        Issue: row.Issue,
        Creator: row.Creator,
        Assignees: assigneesByIssue.get(row.Issue.id) || [],
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
