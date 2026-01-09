import { randomUUID } from "node:crypto";
import type { BunRequest } from "bun";
import sharp from "sharp";
import { s3Client, s3Endpoint, s3PublicUrl } from "../../s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const TARGET_SIZE = 256;

export default async function uploadAvatar(req: BunRequest) {
    if (req.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return new Response("file is required", { status: 400 });
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
    const key = `avatars/${uuid}.${outputExtension}`;
    const publicUrlBase = s3PublicUrl || s3Endpoint;
    const publicUrl = `${publicUrlBase}/${key}`;

    try {
        const s3File = s3Client.file(key);
        await s3File.write(resizedBuffer, { type: outputMimeType });
    } catch (error) {
        console.error("failed to upload to S3:", error);
        return new Response("failed to upload image", { status: 500 });
    }

    return Response.json({ avatarURL: publicUrl });
}
