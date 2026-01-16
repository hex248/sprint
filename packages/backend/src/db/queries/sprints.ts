import { Sprint } from "@sprint/shared";
import { eq } from "drizzle-orm";
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

export async function getSprintsByProject(projectId: number) {
    return await db.select().from(Sprint).where(eq(Sprint.projectId, projectId));
}
