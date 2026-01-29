import { Issue, Organisation, Project, Sprint, User } from "@sprint/shared";
import { eq, sql } from "drizzle-orm";
import { db } from "../client";

export async function createProject(key: string, name: string, creatorId: number, organisationId: number) {
    const [project] = await db
        .insert(Project)
        .values({
            key,
            name,
            creatorId,
            organisationId,
        })
        .returning();
    return project;
}

export async function updateProject(
    projectId: number,
    updates: { key?: string; name?: string; creatorId?: number; organisationId?: number },
) {
    const [project] = await db.update(Project).set(updates).where(eq(Project.id, projectId)).returning();
    return project;
}

export async function deleteProject(projectId: number) {
    // delete all of the project's issues first
    await db.delete(Issue).where(eq(Issue.projectId, projectId));
    // delete all of the project's sprints
    await db.delete(Sprint).where(eq(Sprint.projectId, projectId));
    // delete actual project
    await db.delete(Project).where(eq(Project.id, projectId));
}

export async function getProjectByID(projectId: number) {
    const [project] = await db.select().from(Project).where(eq(Project.id, projectId));
    return project;
}

export async function getProjectByKey(projectKey: string) {
    const [project] = await db.select().from(Project).where(eq(Project.key, projectKey));
    return project;
}

export async function getProjectsByCreatorID(creatorId: number) {
    const projectsWithCreators = await db
        .select()
        .from(Project)
        .where(eq(Project.creatorId, creatorId))
        .leftJoin(User, eq(Project.creatorId, User.id));
    return projectsWithCreators;
}

export async function getAllProjects() {
    const projects = await db.select().from(Project);
    return projects;
}

export async function getProjectsWithCreators() {
    const projectsWithCreators = await db
        .select()
        .from(Project)
        .leftJoin(User, eq(Project.creatorId, User.id));
    return projectsWithCreators;
}

export async function getProjectWithCreatorByID(projectId: number) {
    const [projectWithCreator] = await db
        .select()
        .from(Project)
        .leftJoin(User, eq(Project.creatorId, User.id))
        .where(eq(Project.id, projectId));
    return projectWithCreator;
}

export async function getProjectsByOrganisationId(organisationId: number) {
    const projects = await db
        .select()
        .from(Project)
        .where(eq(Project.organisationId, organisationId))
        .leftJoin(User, eq(Project.creatorId, User.id))
        .leftJoin(Organisation, eq(Project.organisationId, Organisation.id));
    return projects;
}

export async function getOrganisationProjectCount(organisationId: number): Promise<number> {
    const [result] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(Project)
        .where(eq(Project.organisationId, organisationId));
    return result?.count ?? 0;
}
