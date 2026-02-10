import {
    Attachment,
    Issue,
    IssueComment,
    type IssueCommentResponseRecord,
    Project,
    User,
} from "@sprint/shared";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
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

    const commentIds = comments.map((comment) => comment.Comment.id);
    const attachments =
        commentIds.length > 0
            ? await db
                  .select({
                      issueCommentId: Attachment.issueCommentId,
                      Attachment,
                  })
                  .from(Attachment)
                  .where(and(inArray(Attachment.issueCommentId, commentIds), isNull(Attachment.issueId)))
            : [];

    const attachmentsByCommentId = new Map<number, (typeof attachments)[number]["Attachment"][]>();
    for (const attachmentRow of attachments) {
        const issueCommentId = attachmentRow.issueCommentId;
        if (issueCommentId == null) {
            continue;
        }
        const existing = attachmentsByCommentId.get(issueCommentId) ?? [];
        existing.push(attachmentRow.Attachment);
        attachmentsByCommentId.set(issueCommentId, existing);
    }

    return comments.map((comment) => ({
        ...comment,
        Attachments: attachmentsByCommentId.get(comment.Comment.id) ?? [],
    }));
}

export async function getIssueOrganisationId(issueId: number) {
    const [result] = await db
        .select({ organisationId: Project.organisationId })
        .from(Issue)
        .innerJoin(Project, eq(Issue.projectId, Project.id))
        .where(eq(Issue.id, issueId));

    return result?.organisationId ?? null;
}
