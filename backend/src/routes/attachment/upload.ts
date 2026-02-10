import { randomUUID } from "node:crypto";
import { ATTACHMENT_ALLOWED_IMAGE_TYPES, ATTACHMENT_MAX_FILE_SIZE } from "@sprint/shared";
import sharp from "sharp";
import type { AuthedRequest } from "../../auth/middleware";
import { createAttachment, getOrganisationById, getOrganisationMemberRole } from "../../db/queries";
import { getS3PublicUrl, uploadToS3 } from "../../s3";

const TARGET_MAX_DIMENSION = 1920;

type SupportedMimeType = (typeof ATTACHMENT_ALLOWED_IMAGE_TYPES)[number];

function isAllowedMimeType(mimeType: string): mimeType is SupportedMimeType {
    return (ATTACHMENT_ALLOWED_IMAGE_TYPES as readonly string[]).includes(mimeType);
}

async function processImage(file: File) {
    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const isGif = file.type === "image/gif";

    const pipeline = isGif ? sharp(inputBuffer, { animated: true }) : sharp(inputBuffer);
    const resized = pipeline.resize({
        width: TARGET_MAX_DIMENSION,
        height: TARGET_MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
    });

    const outputBuffer = isGif
        ? await resized.gif().toBuffer()
        : await resized.webp({ quality: 82 }).toBuffer();
    const metadata = await sharp(outputBuffer, isGif ? { animated: true } : undefined).metadata();

    return {
        outputBuffer,
        width: metadata.width ?? null,
        height: metadata.height ?? null,
        outputMimeType: (isGif ? "image/gif" : "image/webp") as SupportedMimeType,
        extension: isGif ? "gif" : "webp",
    };
}

export default async function attachmentUpload(req: AuthedRequest) {
    if (req.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const organisationIdStr = formData.get("organisationId") as string | null;

    if (!file) {
        return new Response("file is required", { status: 400 });
    }

    if (!organisationIdStr) {
        return new Response("organisationId is required", { status: 400 });
    }

    const organisationId = Number.parseInt(organisationIdStr, 10);
    if (Number.isNaN(organisationId) || organisationId <= 0) {
        return new Response("organisationId must be a positive integer", { status: 400 });
    }

    const organisation = await getOrganisationById(organisationId);
    if (!organisation) {
        return new Response("organisation not found", { status: 404 });
    }

    const member = await getOrganisationMemberRole(organisationId, req.userId);
    if (!member) {
        return new Response("forbidden", { status: 403 });
    }

    if (file.size > ATTACHMENT_MAX_FILE_SIZE) {
        return new Response("file size exceeds 5MB limit", { status: 400 });
    }

    if (!isAllowedMimeType(file.type)) {
        return new Response("invalid file type. allowed types: png, jpg, jpeg, webp, gif", { status: 400 });
    }

    try {
        const { outputBuffer, width, height, outputMimeType, extension } = await processImage(file);
        const key = `attachments/${organisationId}/${randomUUID()}.${extension}`;
        await uploadToS3(key, outputBuffer, outputMimeType);

        const attachment = await createAttachment({
            organisationId,
            uploaderId: req.userId,
            s3Key: key,
            url: getS3PublicUrl(key),
            mimeType: outputMimeType,
            sizeBytes: outputBuffer.length,
            width,
            height,
        });

        return Response.json({ attachment });
    } catch (error) {
        console.error("failed to upload attachment:", error);
        return new Response("failed to upload attachment", { status: 500 });
    }
}
