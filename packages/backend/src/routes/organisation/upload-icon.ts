import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { AuthedRequest } from "../../auth/middleware";
import { getOrganisationById, getOrganisationMemberRole, updateOrganisation } from "../../db/queries";
import { s3Client, s3Endpoint, s3PublicUrl } from "../../s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const TARGET_SIZE = 256;

export default async function uploadOrganisationIcon(req: AuthedRequest) {
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
        return new Response("you are not a member of this organisation", { status: 403 });
    }
    if (member.role !== "owner" && member.role !== "admin") {
        return new Response("only owners and admins can upload organisation icons", { status: 403 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return new Response("file size exceeds 5MB limit", { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
        return new Response("invalid file type. Allowed types: png, jpg, jpeg, webp, gif", {
            status: 400,
        });
    }

    const isGIF = file.type === "image/gif";
    const outputExtension = isGIF ? "gif" : "png";
    const outputMimeType = isGIF ? "image/gif" : "image/png";

    let resizedBuffer: Buffer;
    try {
        const inputBuffer = Buffer.from(await file.arrayBuffer());

        if (isGIF) {
            resizedBuffer = await sharp(inputBuffer, { animated: true })
                .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover" })
                .gif()
                .toBuffer();
        } else {
            resizedBuffer = await sharp(inputBuffer)
                .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover" })
                .png()
                .toBuffer();
        }
    } catch (error) {
        console.error("failed to resize image:", error);
        return new Response("failed to process image", { status: 500 });
    }

    const uuid = randomUUID();
    const key = `org-icons/${uuid}.${outputExtension}`;
    const publicUrlBase = s3PublicUrl || s3Endpoint;
    const publicUrl = `${publicUrlBase}/${key}`;

    try {
        const s3File = s3Client.file(key);
        await s3File.write(resizedBuffer, { type: outputMimeType });
    } catch (error) {
        console.error("failed to upload to S3:", error);
        return new Response("failed to upload image", { status: 500 });
    }

    await updateOrganisation(organisationId, { iconURL: publicUrl });

    return Response.json({ iconURL: publicUrl });
}
