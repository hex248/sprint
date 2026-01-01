import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import type { BunRequest } from "bun";
import { bucketName, s3Client, s3Endpoint, s3PublicUrl } from "../../s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "gif"];

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

    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
        return new Response("invalid file extension", { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uuid = randomUUID();
    const key = `avatars/${uuid}.${fileExtension}`;
    const publicUrlBase = s3PublicUrl || s3Endpoint;
    const publicUrl = `${publicUrlBase}/${key}`;

    try {
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: key,
                Body: buffer,
                ContentType: file.type,
            }),
        );
    } catch (error) {
        console.error("failed to upload to S3:", error);
        return new Response("failed to upload image", { status: 500 });
    }

    return Response.json({ avatarURL: publicUrl });
}
