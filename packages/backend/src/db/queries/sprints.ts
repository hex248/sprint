import { Issue, Sprint } from "@sprint/shared";
import { and, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { db } from "../client";

export async function createSprint(
    projectId: number,
    name: string,
    color: string | undefined,
    startDate: Date,
    endDate: Date,
) {
    const [sprint] = await db
        .insert(Sprint)
        .values({
            projectId,
            name,
            ...(color ? { color } : {}),
            startDate,
            endDate,
        })
        .returning();
    return sprint;
}

export async function getSprintById(sprintId: number) {
    const [sprint] = await db.select().from(Sprint).where(eq(Sprint.id, sprintId));
    return sprint;
}

export async function getSprintsByProject(projectId: number) {
    return await db
        .select()
        .from(Sprint)
        .where(eq(Sprint.projectId, projectId))
        .orderBy(desc(Sprint.startDate));
}

export async function hasOverlappingSprints(
    projectId: number,
    startDate: Date,
    endDate: Date,
    excludeSprintId?: number,
) {
    const conditions = [
        eq(Sprint.projectId, projectId),
        lte(Sprint.startDate, endDate),
        gte(Sprint.endDate, startDate),
    ];

    if (excludeSprintId !== undefined) {
        conditions.push(ne(Sprint.id, excludeSprintId));
    }

    const overlapping = await db
        .select({ id: Sprint.id })
        .from(Sprint)
        .where(and(...conditions))
        .limit(1);

    return overlapping.length > 0;
}

export async function updateSprint(
    sprintId: number,
    updates: { name?: string; color?: string; startDate?: Date; endDate?: Date },
) {
    const [sprint] = await db.update(Sprint).set(updates).where(eq(Sprint.id, sprintId)).returning();
    return sprint;
}

export async function deleteSprint(sprintId: number) {
    await db.update(Issue).set({ sprintId: null }).where(eq(Issue.sprintId, sprintId));
    await db.delete(Sprint).where(eq(Sprint.id, sprintId));
}

export async function getProjectSprintCount(projectId: number) {
    const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(Sprint)
        .where(eq(Sprint.projectId, projectId));
    return result[0]?.count ?? 0;
}
