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
import { eq, inArray } from "drizzle-orm";
import { db } from "../client";
import type { exportOrganisation } from "./export";

type ExportedOrganisationData = NonNullable<Awaited<ReturnType<typeof exportOrganisation>>>;

function toDate(value: string | Date) {
    return value instanceof Date ? value : new Date(value);
}

function toDateOrNull(value: string | Date | null) {
    if (value == null) return null;
    return value instanceof Date ? value : new Date(value);
}

async function getUniqueImportedSlug(baseSlug: string) {
    const slugBase = `${baseSlug}-import`;
    let candidate = slugBase;
    let counter = 2;

    while (true) {
        const existing = await db
            .select({ id: Organisation.id })
            .from(Organisation)
            .where(eq(Organisation.slug, candidate))
            .limit(1);
        if (!existing[0]) return candidate;

        candidate = `${slugBase}-${counter}`;
        counter += 1;
    }
}

export async function importOrganisation(importData: ExportedOrganisationData, importingUserId: number) {
    const importedSlug = await getUniqueImportedSlug(importData.organisation.slug);

    const [organisation] = await db
        .insert(Organisation)
        .values({
            name: importData.organisation.name,
            description: importData.organisation.description,
            slug: importedSlug,
            iconURL: importData.organisation.iconURL,
            statuses: importData.organisation.statuses,
            issueTypes: importData.organisation.issueTypes,
            features: importData.organisation.features,
        })
        .returning();

    if (!organisation) return null;

    const organisationId = organisation.id;

    await db.transaction(async (tx) => {
        const importedUserIds = new Set<number>();
        importedUserIds.add(importingUserId);
        for (const project of importData.projects) importedUserIds.add(project.creatorId);
        for (const issue of importData.issues) importedUserIds.add(issue.creatorId);
        for (const assignee of importData.issueAssignees) importedUserIds.add(assignee.userId);
        for (const comment of importData.issueComments) importedUserIds.add(comment.userId);
        for (const timedSession of importData.timedSessions) importedUserIds.add(timedSession.userId);

        const candidateUserIds = Array.from(importedUserIds);
        const existingUsers =
            candidateUserIds.length > 0
                ? await tx.select({ id: User.id }).from(User).where(inArray(User.id, candidateUserIds))
                : [];
        const existingUserIdSet = new Set(existingUsers.map((user) => user.id));

        const resolveUserId = (userId: number) => (existingUserIdSet.has(userId) ? userId : importingUserId);

        await tx.insert(OrganisationMember).values({
            organisationId,
            userId: importingUserId,
            role: "owner",
        });

        const projectIdMap = new Map<number, number>();
        for (const project of importData.projects) {
            const [insertedProject] = await tx
                .insert(Project)
                .values({
                    key: project.key,
                    name: project.name,
                    organisationId,
                    creatorId: resolveUserId(project.creatorId),
                })
                .returning({ id: Project.id });

            if (insertedProject) {
                projectIdMap.set(project.id, insertedProject.id);
            }
        }

        const sprintIdMap = new Map<number, number>();
        for (const sprint of importData.sprints) {
            const mappedProjectId = projectIdMap.get(sprint.projectId);
            if (!mappedProjectId) continue;

            const [insertedSprint] = await tx
                .insert(Sprint)
                .values({
                    projectId: mappedProjectId,
                    name: sprint.name,
                    color: sprint.color,
                    startDate: toDate(sprint.startDate),
                    endDate: toDate(sprint.endDate),
                    open: sprint.open,
                    handOffs: sprint.handOffs,
                })
                .returning({ id: Sprint.id });

            if (insertedSprint) {
                sprintIdMap.set(sprint.id, insertedSprint.id);
            }
        }

        const issueIdMap = new Map<number, number>();
        for (const issue of importData.issues) {
            const mappedProjectId = projectIdMap.get(issue.projectId);
            if (!mappedProjectId) continue;

            const [insertedIssue] = await tx
                .insert(Issue)
                .values({
                    projectId: mappedProjectId,
                    number: issue.number,
                    type: issue.type,
                    status: issue.status,
                    title: issue.title,
                    description: issue.description,
                    creatorId: resolveUserId(issue.creatorId),
                    sprintId: issue.sprintId ? (sprintIdMap.get(issue.sprintId) ?? null) : null,
                })
                .returning({ id: Issue.id });

            if (insertedIssue) {
                issueIdMap.set(issue.id, insertedIssue.id);
            }
        }

        if (importData.issueAssignees.length > 0) {
            const assigneesToInsert = importData.issueAssignees
                .map((assignee) => ({
                    issueId: issueIdMap.get(assignee.issueId),
                    userId: resolveUserId(assignee.userId),
                }))
                .filter(
                    (assignee): assignee is { issueId: number; userId: number } => assignee.issueId != null,
                );

            if (assigneesToInsert.length > 0) {
                const uniqueAssignees = new Map<string, { issueId: number; userId: number }>();
                for (const assignee of assigneesToInsert) {
                    const key = `${assignee.issueId}:${assignee.userId}`;
                    if (!uniqueAssignees.has(key)) {
                        uniqueAssignees.set(key, assignee);
                    }
                }

                if (uniqueAssignees.size > 0) {
                    await tx.insert(IssueAssignee).values(Array.from(uniqueAssignees.values()));
                }
            }
        }

        if (importData.issueComments.length > 0) {
            const commentsToInsert = importData.issueComments
                .map((comment) => ({
                    issueId: issueIdMap.get(comment.issueId),
                    userId: resolveUserId(comment.userId),
                    body: comment.body,
                }))
                .filter(
                    (comment): comment is { issueId: number; userId: number; body: string } =>
                        comment.issueId != null,
                );

            if (commentsToInsert.length > 0) {
                await tx.insert(IssueComment).values(commentsToInsert);
            }
        }

        if (importData.timedSessions.length > 0) {
            const timedSessionsToInsert = importData.timedSessions.map((timedSession) => ({
                userId: resolveUserId(timedSession.userId),
                issueId: timedSession.issueId ? (issueIdMap.get(timedSession.issueId) ?? null) : null,
                timestamps: timedSession.timestamps.map(toDate),
                endedAt: toDateOrNull(timedSession.endedAt),
            }));

            await tx.insert(TimedSession).values(timedSessionsToInsert);
        }
    });

    return organisation;
}
