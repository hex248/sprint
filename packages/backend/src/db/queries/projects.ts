import { Issue, Project, User } from "@issue/shared";
import { eq } from "drizzle-orm";
import { db } from "../client";

export async function createProject(blob: string, name: string, ownerId: number) {
    const [project] = await db
        .insert(Project)
        .values({
            blob,
            name,
            ownerId,
        })
        .returning();
    return project;
}

export async function updateProject(
    projectId: number,
    updates: { blob?: string; name?: string; ownerId?: number },
) {
    const [project] = await db.update(Project).set(updates).where(eq(Project.id, projectId)).returning();
    return project;
}

export async function deleteProject(projectId: number) {
    // delete all of the project's issues first
    await db.delete(Issue).where(eq(Issue.projectId, projectId));
    // delete actual project
    await db.delete(Project).where(eq(Project.id, projectId));
}

export async function getProjectByID(projectId: number) {
    const [project] = await db.select().from(Project).where(eq(Project.id, projectId));
    return project;
}

export async function getProjectByBlob(projectBlob: string) {
    const [project] = await db.select().from(Project).where(eq(Project.blob, projectBlob));
    return project;
}

export async function getProjectsByOwnerID(ownerId: number) {
    const projectsWithOwners = await db
        .select()
        .from(Project)
        .where(eq(Project.ownerId, ownerId))
        .leftJoin(User, eq(Project.ownerId, User.id));
    return projectsWithOwners;
}

export async function getAllProjects() {
    const projects = await db.select().from(Project);
    return projects;
}

export async function getProjectsWithOwners() {
    const projectsWithOwners = await db.select().from(Project).leftJoin(User, eq(Project.ownerId, User.id));
    return projectsWithOwners;
}

export async function getProjectWithOwnerByID(projectId: number) {
    const [projectWithOwner] = await db
        .select()
        .from(Project)
        .leftJoin(User, eq(Project.ownerId, User.id))
        .where(eq(Project.id, projectId));
    return projectWithOwner;
}
