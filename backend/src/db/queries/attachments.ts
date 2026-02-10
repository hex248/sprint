import { type ATTACHMENT_ALLOWED_IMAGE_TYPES, Attachment, IssueComment } from "@sprint/shared";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "../client";

export async function createAttachment(input: {
    organisationId: number;
    uploaderId: number;
    s3Key: string;
    url: string;
    mimeType: (typeof ATTACHMENT_ALLOWED_IMAGE_TYPES)[number];
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
}) {
    const [attachment] = await db
        .insert(Attachment)
        .values({
            organisationId: input.organisationId,
            uploaderId: input.uploaderId,
            s3Key: input.s3Key,
            url: input.url,
            mimeType: input.mimeType,
            sizeBytes: input.sizeBytes,
            width: input.width ?? null,
            height: input.height ?? null,
        })
        .returning();

    return attachment;
}

export async function getAttachableAttachments(
    attachmentIds: number[],
    organisationId: number,
    uploaderId: number,
) {
    if (attachmentIds.length === 0) {
        return [];
    }

    return await db
        .select()
        .from(Attachment)
        .where(
            and(
                inArray(Attachment.id, attachmentIds),
                eq(Attachment.organisationId, organisationId),
                eq(Attachment.uploaderId, uploaderId),
                isNull(Attachment.issueId),
                isNull(Attachment.issueCommentId),
            ),
        );
}

export async function linkAttachmentsToIssue(issueId: number, attachmentIds: number[]) {
    if (attachmentIds.length === 0) {
        return;
    }

    await db
        .update(Attachment)
        .set({ issueId, issueCommentId: null })
        .where(
            and(
                inArray(Attachment.id, attachmentIds),
                isNull(Attachment.issueId),
                isNull(Attachment.issueCommentId),
            ),
        );
}

export async function linkAttachmentsToIssueComment(issueCommentId: number, attachmentIds: number[]) {
    if (attachmentIds.length === 0) {
        return;
    }

    await db
        .update(Attachment)
        .set({ issueCommentId, issueId: null })
        .where(
            and(
                inArray(Attachment.id, attachmentIds),
                isNull(Attachment.issueId),
                isNull(Attachment.issueCommentId),
            ),
        );
}

export async function getAttachmentsByIssueId(issueId: number) {
    return await db.select().from(Attachment).where(eq(Attachment.issueId, issueId));
}

export async function getIssueAttachmentsByIssueIds(issueIds: number[]) {
    if (issueIds.length === 0) {
        return [];
    }

    return await db
        .select({
            issueId: Attachment.issueId,
            Attachment,
        })
        .from(Attachment)
        .where(and(inArray(Attachment.issueId, issueIds), isNull(Attachment.issueCommentId)));
}

export async function getIssueCommentAttachmentsByIssueCommentIds(issueCommentIds: number[]) {
    if (issueCommentIds.length === 0) {
        return [];
    }

    return await db
        .select({
            issueCommentId: Attachment.issueCommentId,
            Attachment,
        })
        .from(Attachment)
        .where(and(inArray(Attachment.issueCommentId, issueCommentIds), isNull(Attachment.issueId)));
}

export async function getAttachmentsByIssueCommentId(issueCommentId: number) {
    return await db.select().from(Attachment).where(eq(Attachment.issueCommentId, issueCommentId));
}

export async function getAttachmentsByIds(attachmentIds: number[]) {
    if (attachmentIds.length === 0) {
        return [];
    }

    return await db.select().from(Attachment).where(inArray(Attachment.id, attachmentIds));
}

export async function getIssueCommentAttachmentIdsByIssueId(issueId: number) {
    const rows = await db
        .select({ id: Attachment.id })
        .from(Attachment)
        .innerJoin(IssueComment, eq(Attachment.issueCommentId, IssueComment.id))
        .where(and(eq(IssueComment.issueId, issueId), isNull(Attachment.issueId)));

    return rows.map((row) => row.id);
}

export async function deleteAttachmentsByIds(attachmentIds: number[]) {
    if (attachmentIds.length === 0) {
        return;
    }

    await db.delete(Attachment).where(inArray(Attachment.id, attachmentIds));
}
