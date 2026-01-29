import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { AuthedRequest } from "../../auth/middleware";
import { getSubscriptionByUserId } from "../../db/queries";
import { s3Client, s3Endpoint, s3PublicUrl } from "../../s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const TARGET_SIZE = 256;

async function isAnimatedGIF(buffer: Buffer): Promise<boolean> {
    try {
        const metadata = await sharp(buffer).metadata();
        return metadata.pages !== undefined && metadata.pages > 1;
    } catch {
        return false;
    }
}

export default async function uploadAvatar(req: AuthedRequest) {
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

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // check if user is pro
    const subscription = await getSubscriptionByUserId(req.userId);
    const isPro = subscription?.status === "active";

    // block animated avatars for free users
    if (!isPro && file.type === "image/gif") {
        const animated = await isAnimatedGIF(inputBuffer);
        if (animated) {
            return new Response(
                JSON.stringify({
                    error: "Animated avatars are only available on Pro. Upgrade to upload animated avatars.",
                }),
                { status: 403, headers: { "Content-Type": "application/json" } },
            );
        }
    }

    const isGIF = file.type === "image/gif";
    const outputExtension = isGIF ? "gif" : "png";
    const outputMimeType = isGIF ? "image/gif" : "image/png";

    let resizedBuffer: Buffer;
    try {
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
