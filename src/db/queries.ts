import { eq, sql, and } from "drizzle-orm";
import { db } from "./client";
import { Issue, Project, User } from "./schema";

// user related
export async function createUser(name: string, username: string) {
    const [user] = await db.insert(User).values({ name, username }).returning();
    return user;
}

export async function getUserByUsername(username: string) {
    const [user] = await db.select().from(User).where(eq(User.username, username));
    return user;
}

// project related

export async function createProject(blob: string, name: string, owner: typeof User.$inferSelect) {
    const [project] = await db
        .insert(Project)
        .values({
            blob,
            name,
            ownerId: owner.id,
        })
        .returning();
    if (!project) {
        throw new Error(`failed to create project ${name} with blob ${blob} for owner ${owner.username}`);
    }
    return project;
}

export async function getProjectByID(projectId: number) {
    const [project] = await db.select().from(Project).where(eq(Project.id, projectId));
    return project;
}

export async function getProjectByBlob(projectBlob: string) {
    const [project] = await db.select().from(Project).where(eq(Project.blob, projectBlob));
    return project;
}

// issue related
export async function createIssue(projectId: number, title: string, description: string) {
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
            })
            .returning();

        return newIssue;
    });
}

export async function deleteIssue(projectId: number, number: number) {
    return await db.delete(Issue).where(and(eq(Issue.projectId, projectId), eq(Issue.number, number)));
}

export async function updateIssue(id: number, updates: { title?: string; description?: string }) {
    return await db.update(Issue).set(updates).where(eq(Issue.id, id)).returning();
}

export async function getIssuesByProject(projectId: number) {
    return await db.select().from(Issue).where(eq(Issue.projectId, projectId));
}

export async function getIssueByNumber(projectId: number, number: number) {
    const [issue] = await db
        .select()
        .from(Issue)
        .where(and(eq(Issue.projectId, projectId), eq(Issue.number, number)));
    return issue;
}
