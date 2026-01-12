import { Issue, User } from "@issue/shared";
import { aliasedTable, and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../client";

export async function createIssue(
    projectId: number,
    title: string,
    description: string,
    creatorId: number,
    assigneeId?: number,
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

        // 2. create new issue
        const [newIssue] = await tx
            .insert(Issue)
            .values({
                projectId,
                title,
                description,
                number: nextNumber,
                creatorId,
                assigneeId,
                ...(status && { status }),
            })
            .returning();

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
        assigneeId?: number | null;
        status?: string;
    },
) {
    return await db.update(Issue).set(updates).where(eq(Issue.id, id)).returning();
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

export async function getIssueByNumber(projectId: number, number: number) {
    const [issue] = await db
        .select()
        .from(Issue)
        .where(and(eq(Issue.projectId, projectId), eq(Issue.number, number)));
    return issue;
}

export async function getIssueStatusCountByOrganisation(organisationId: number, status: string) {
    const { Project } = await import("@issue/shared");

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
    const { Project } = await import("@issue/shared");

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

export async function getIssuesWithUsersByProject(projectId: number) {
    const Creator = aliasedTable(User, "Creator");
    const Assignee = aliasedTable(User, "Assignee");

    return await db
        .select({
            Issue: Issue,
            Creator: Creator,
            Assignee: Assignee,
        })
        .from(Issue)
        .where(eq(Issue.projectId, projectId))
        .innerJoin(Creator, eq(Issue.creatorId, Creator.id))
        .leftJoin(Assignee, eq(Issue.assigneeId, Assignee.id));
}
