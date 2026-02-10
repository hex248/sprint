import { Issue, IssueComment, type IssueCommentResponseRecord, Project, User } from "@sprint/shared";
import { asc, eq } from "drizzle-orm";
import { db } from "../client";

export async function createIssueComment(issueId: number, userId: number, body: string) {
    const [comment] = await db
        .insert(IssueComment)
        .values({
            issueId,
            userId,
            body,
        })
        .returning();
    return comment;
}

export async function deleteIssueComment(id: number) {
    return await db.delete(IssueComment).where(eq(IssueComment.id, id));
}

export async function getIssueCommentById(id: number) {
    const [comment] = await db.select().from(IssueComment).where(eq(IssueComment.id, id));
    return comment;
}

export async function getIssueCommentsByIssueId(issueId: number): Promise<IssueCommentResponseRecord[]> {
    const comments = await db
        .select({
            Comment: IssueComment,
            User: User,
        })
        .from(IssueComment)
        .where(eq(IssueComment.issueId, issueId))
        .innerJoin(User, eq(IssueComment.userId, User.id))
        .orderBy(asc(IssueComment.createdAt));

    return comments;
}

export async function getIssueOrganisationId(issueId: number) {
    const [result] = await db
        .select({ organisationId: Project.organisationId })
        .from(Issue)
        .innerJoin(Project, eq(Issue.projectId, Project.id))
        .where(eq(Issue.id, issueId));

    return result?.organisationId ?? null;
}
