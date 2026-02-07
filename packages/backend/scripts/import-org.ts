import "dotenv/config";
import { readFile } from "node:fs/promises";
import {
    Issue,
    IssueAssignee,
    IssueComment,
    Organisation,
    OrganisationMember,
    Project,
    Sprint,
    TimedSession,
    User,
} from "@sprint/shared";
import { and, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { z } from "zod";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
}

const db = drizzle({
    connection: {
        connectionString: DATABASE_URL,
    },
});

const timestampLikeSchema = z.union([z.string(), z.date()]);
const optionalTimestampLikeSchema = z.union([z.string(), z.date(), z.null(), z.undefined()]);

const importSchema = z
    .object({
        organisation: z
            .object({
                id: z.number(),
                name: z.string(),
                slug: z.string(),
                description: z.string().nullable().optional(),
                iconURL: z.string().nullable().optional(),
                statuses: z.record(z.string()),
                issueTypes: z.record(z.object({ icon: z.string(), color: z.string() })),
                features: z.record(z.boolean()),
                createdAt: optionalTimestampLikeSchema,
                updatedAt: optionalTimestampLikeSchema,
            })
            .passthrough(),
        members: z.array(
            z
                .object({
                    id: z.number(),
                    organisationId: z.number(),
                    userId: z.number(),
                    role: z.string(),
                    createdAt: optionalTimestampLikeSchema,
                })
                .passthrough(),
        ),
        projects: z.array(
            z
                .object({
                    id: z.number(),
                    key: z.string(),
                    name: z.string(),
                    organisationId: z.number(),
                    creatorId: z.number(),
                })
                .passthrough(),
        ),
        sprints: z.array(
            z
                .object({
                    id: z.number(),
                    projectId: z.number(),
                    name: z.string(),
                    color: z.string(),
                    startDate: timestampLikeSchema,
                    endDate: timestampLikeSchema,
                    createdAt: optionalTimestampLikeSchema,
                })
                .passthrough(),
        ),
        issues: z.array(
            z
                .object({
                    id: z.number(),
                    projectId: z.number(),
                    number: z.number(),
                    type: z.string(),
                    status: z.string(),
                    title: z.string(),
                    description: z.string(),
                    creatorId: z.number(),
                    sprintId: z.number().nullable().optional(),
                })
                .passthrough(),
        ),
        issueAssignees: z.array(
            z
                .object({
                    id: z.number(),
                    issueId: z.number(),
                    userId: z.number(),
                    assignedAt: optionalTimestampLikeSchema,
                })
                .passthrough(),
        ),
        issueComments: z.array(
            z
                .object({
                    id: z.number(),
                    issueId: z.number(),
                    userId: z.number(),
                    body: z.string(),
                    createdAt: optionalTimestampLikeSchema,
                    updatedAt: optionalTimestampLikeSchema,
                })
                .passthrough(),
        ),
        timedSessions: z.array(
            z
                .object({
                    id: z.number(),
                    issueId: z.number().nullable().optional(),
                    userId: z.number(),
                    timestamps: z.array(timestampLikeSchema),
                    endedAt: optionalTimestampLikeSchema,
                    createdAt: optionalTimestampLikeSchema,
                })
                .passthrough(),
        ),
    })
    .passthrough();

function toDate(value: unknown, fieldName: string) {
    if (value === null || value === undefined) {
        throw new Error(`${fieldName} is required`);
    }

    if (value instanceof Date) {
        return value;
    }

    const parsed = new Date(String(value));
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`${fieldName} is not a valid date`);
    }

    return parsed;
}

function toOptionalDate(value: unknown) {
    if (value === null || value === undefined) {
        return undefined;
    }

    return toDate(value, "date");
}

function toNullableDate(value: unknown) {
    if (value === null || value === undefined) {
        return null;
    }

    return toDate(value, "date");
}

async function importOrg(filePath: string) {
    const raw = await readFile(filePath, "utf-8");
    const parsedJson = JSON.parse(raw) as unknown;
    const parsed = importSchema.safeParse(parsedJson);

    if (!parsed.success) {
        throw new Error(`invalid export JSON format: ${parsed.error.issues[0]?.message ?? "unknown error"}`);
    }

    const data = parsed.data;

    const referencedUserIds = new Set<number>();
    for (const member of data.members) referencedUserIds.add(member.userId);
    for (const project of data.projects) referencedUserIds.add(project.creatorId);
    for (const issue of data.issues) referencedUserIds.add(issue.creatorId);
    for (const assignee of data.issueAssignees) referencedUserIds.add(assignee.userId);
    for (const comment of data.issueComments) referencedUserIds.add(comment.userId);
    for (const session of data.timedSessions) referencedUserIds.add(session.userId);

    const userIds = [...referencedUserIds];
    const existingUserIds =
        userIds.length > 0
            ? new Set(
                  (await db.select({ id: User.id }).from(User).where(inArray(User.id, userIds))).map(
                      (u) => u.id,
                  ),
              )
            : new Set<number>();

    const missingUserIds = userIds.filter((id) => !existingUserIds.has(id));
    if (missingUserIds.length > 0) {
        throw new Error(
            `cannot import org because these user ids do not exist in this database: ${missingUserIds.join(", ")}`,
        );
    }

    const existingOrg = await db
        .select({ id: Organisation.id })
        .from(Organisation)
        .where(eq(Organisation.slug, data.organisation.slug))
        .limit(1);

    if (existingOrg[0]) {
        throw new Error(`organisation slug already exists: ${data.organisation.slug}`);
    }

    await db.transaction(async (tx) => {
        const importedOrganisation = {
            name: data.organisation.name,
            slug: data.organisation.slug,
            description: data.organisation.description ?? null,
            iconURL: data.organisation.iconURL ?? null,
            statuses: data.organisation.statuses,
            issueTypes: data.organisation.issueTypes,
            features: data.organisation.features,
            createdAt: toOptionalDate(data.organisation.createdAt),
            updatedAt: toOptionalDate(data.organisation.updatedAt),
        };

        const [newOrg] = await tx
            .insert(Organisation)
            .values(importedOrganisation)
            .returning({ id: Organisation.id });
        if (!newOrg) {
            throw new Error("failed to create organisation");
        }

        const oldProjectIdToNewId = new Map<number, number>();
        const oldSprintIdToNewId = new Map<number, number>();
        const oldIssueIdToNewId = new Map<number, number>();

        for (const project of data.projects) {
            const [createdProject] = await tx
                .insert(Project)
                .values({
                    key: project.key,
                    name: project.name,
                    creatorId: project.creatorId,
                    organisationId: newOrg.id,
                })
                .returning({ id: Project.id });

            if (!createdProject) {
                throw new Error(`failed to create project from export project id ${project.id}`);
            }

            oldProjectIdToNewId.set(project.id, createdProject.id);
        }

        for (const sprint of data.sprints) {
            const mappedProjectId = oldProjectIdToNewId.get(sprint.projectId);
            if (!mappedProjectId) {
                throw new Error(`sprint ${sprint.id} references missing project ${sprint.projectId}`);
            }

            const [createdSprint] = await tx
                .insert(Sprint)
                .values({
                    name: sprint.name,
                    color: sprint.color,
                    projectId: mappedProjectId,
                    startDate: toDate(sprint.startDate, `sprint ${sprint.id} startDate`),
                    endDate: toDate(sprint.endDate, `sprint ${sprint.id} endDate`),
                    createdAt: toOptionalDate(sprint.createdAt),
                })
                .returning({ id: Sprint.id });

            if (!createdSprint) {
                throw new Error(`failed to create sprint from export sprint id ${sprint.id}`);
            }

            oldSprintIdToNewId.set(sprint.id, createdSprint.id);
        }

        for (const issue of data.issues) {
            const mappedProjectId = oldProjectIdToNewId.get(issue.projectId);
            if (!mappedProjectId) {
                throw new Error(`issue ${issue.id} references missing project ${issue.projectId}`);
            }

            const mappedSprintId = issue.sprintId ? oldSprintIdToNewId.get(issue.sprintId) : undefined;
            if (issue.sprintId && !mappedSprintId) {
                throw new Error(`issue ${issue.id} references missing sprint ${issue.sprintId}`);
            }

            const [createdIssue] = await tx
                .insert(Issue)
                .values({
                    number: issue.number,
                    type: issue.type,
                    status: issue.status,
                    title: issue.title,
                    description: issue.description,
                    creatorId: issue.creatorId,
                    projectId: mappedProjectId,
                    sprintId: mappedSprintId ?? null,
                })
                .returning({ id: Issue.id });

            if (!createdIssue) {
                throw new Error(`failed to create issue from export issue id ${issue.id}`);
            }

            oldIssueIdToNewId.set(issue.id, createdIssue.id);
        }

        if (data.members.length > 0) {
            await tx.insert(OrganisationMember).values(
                data.members.map((member) => ({
                    userId: member.userId,
                    role: member.role,
                    organisationId: newOrg.id,
                    createdAt: toOptionalDate(member.createdAt),
                })),
            );
        }

        for (const assignee of data.issueAssignees) {
            const mappedIssueId = oldIssueIdToNewId.get(assignee.issueId);
            if (!mappedIssueId) {
                throw new Error(`issue assignee references missing issue ${assignee.issueId}`);
            }

            await tx
                .insert(IssueAssignee)
                .values({
                    userId: assignee.userId,
                    issueId: mappedIssueId,
                    assignedAt: toOptionalDate(assignee.assignedAt),
                })
                .onConflictDoNothing();
        }

        for (const comment of data.issueComments) {
            const mappedIssueId = oldIssueIdToNewId.get(comment.issueId);
            if (!mappedIssueId) {
                throw new Error(`issue comment references missing issue ${comment.issueId}`);
            }

            await tx.insert(IssueComment).values({
                userId: comment.userId,
                body: comment.body,
                issueId: mappedIssueId,
                createdAt: toOptionalDate(comment.createdAt),
                updatedAt: toOptionalDate(comment.updatedAt),
            });
        }

        for (const session of data.timedSessions) {
            let mappedIssueId: number | null | undefined = null;
            if (session.issueId !== null && session.issueId !== undefined) {
                mappedIssueId = oldIssueIdToNewId.get(session.issueId);
                if (!mappedIssueId) {
                    throw new Error(`timed session references missing issue ${session.issueId}`);
                }
            }

            await tx.insert(TimedSession).values({
                userId: session.userId,
                issueId: mappedIssueId,
                timestamps: session.timestamps.map((ts, index) =>
                    toDate(ts, `timed session timestamp ${index}`),
                ),
                endedAt: toNullableDate(session.endedAt),
                createdAt: toOptionalDate(session.createdAt),
            });
        }

        const ownerExists = await tx
            .select({ id: OrganisationMember.id })
            .from(OrganisationMember)
            .where(
                and(eq(OrganisationMember.organisationId, newOrg.id), eq(OrganisationMember.role, "owner")),
            )
            .limit(1);

        if (!ownerExists[0]) {
            throw new Error("imported organisation has no owner member");
        }
    });
}

async function run() {
    const filePath = Bun.argv[2] ?? "org.json";

    try {
        await importOrg(filePath);
        console.log(`organisation import successful from ${filePath}`);
        process.exit(0);
    } catch (error) {
        console.error("organisation import failed:", error);
        process.exit(1);
    }
}

run();
