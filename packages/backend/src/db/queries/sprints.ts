import { Issue, Sprint } from "@sprint/shared";
import { and, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { db } from "../client";

export class CloseSprintError extends Error {
    code: string;
    status: number;

    constructor(message: string, code: string, status: number) {
        super(message);
        this.name = "CloseSprintError";
        this.code = code;
        this.status = status;
    }
}

export type CloseSprintResult = {
    sprint: typeof Sprint.$inferSelect;
    movedIssueCount: number;
    matchedIssueCount: number;
    handOffSprintId: number | null;
};

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
        eq(Sprint.open, true),
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

export async function closeSprintWithHandOff(
    sprintId: number,
    statusesToHandOff: string[],
    handOffSprintId?: number | null,
): Promise<CloseSprintResult> {
    return await db.transaction(async (tx) => {
        const [sourceSprint] = await tx.select().from(Sprint).where(eq(Sprint.id, sprintId));
        if (!sourceSprint) {
            throw new CloseSprintError(`sprint with id ${sprintId} does not exist`, "SPRINT_NOT_FOUND", 404);
        }

        if (!sourceSprint.open) {
            throw new CloseSprintError("sprint is already closed", "SPRINT_ALREADY_CLOSED", 409);
        }

        const normalisedStatuses = Array.from(
            new Set(statusesToHandOff.map((status) => status.trim()).filter(Boolean)),
        );
        let matchedIssueCount = 0;

        if (normalisedStatuses.length > 0) {
            const [countResult] = await tx
                .select({ count: sql<number>`count(*)::int` })
                .from(Issue)
                .where(and(eq(Issue.sprintId, sprintId), inArray(Issue.status, normalisedStatuses)));

            matchedIssueCount = countResult?.count ?? 0;
        }

        let movedIssueCount = 0;
        let resolvedHandOffSprintId: number | null = null;

        if (matchedIssueCount > 0) {
            if (!handOffSprintId) {
                throw new CloseSprintError(
                    "handoff sprint is required when matching issues exist",
                    "HANDOFF_TARGET_REQUIRED",
                    400,
                );
            }

            if (handOffSprintId === sprintId) {
                throw new CloseSprintError(
                    "handoff sprint cannot be the sprint being closed",
                    "INVALID_HANDOFF_TARGET",
                    400,
                );
            }

            const [targetSprint] = await tx.select().from(Sprint).where(eq(Sprint.id, handOffSprintId));

            if (!targetSprint || targetSprint.projectId !== sourceSprint.projectId) {
                throw new CloseSprintError(
                    "handoff sprint must belong to the same project",
                    "INVALID_HANDOFF_TARGET",
                    400,
                );
            }

            if (!targetSprint.open) {
                throw new CloseSprintError("handoff sprint must be open", "HANDOFF_TARGET_CLOSED", 400);
            }

            const updateResult = await tx
                .update(Issue)
                .set({ sprintId: handOffSprintId })
                .where(and(eq(Issue.sprintId, sprintId), inArray(Issue.status, normalisedStatuses)));
            movedIssueCount = updateResult.rowCount ?? 0;

            await tx
                .update(Sprint)
                .set({
                    handOffs: sql`CASE
                        WHEN array_position(${Sprint.handOffs}, ${sprintId}) IS NULL
                        THEN array_append(${Sprint.handOffs}, ${sprintId})
                        ELSE ${Sprint.handOffs}
                    END`,
                })
                .where(eq(Sprint.id, handOffSprintId));

            resolvedHandOffSprintId = handOffSprintId;
        }

        const [updatedSourceSprint] = await tx
            .update(Sprint)
            .set({ open: false })
            .where(eq(Sprint.id, sprintId))
            .returning();

        if (!updatedSourceSprint) {
            throw new CloseSprintError("failed to close sprint", "SPRINT_CLOSE_FAILED", 400);
        }

        return {
            sprint: updatedSourceSprint,
            movedIssueCount,
            matchedIssueCount,
            handOffSprintId: resolvedHandOffSprintId,
        };
    });
}
