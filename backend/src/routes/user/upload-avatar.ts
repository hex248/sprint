import { randomUUID } from "node:crypto";
import type { BunRequest } from "bun";
import sharp from "sharp";
// import { getSubscriptionByUserId } from "../../db/queries";
import { s3Client, s3Endpoint, s3PublicUrl } from "../../s3";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const TARGET_SIZE = 256;
const EXTENSION_TO_MIME: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
};

function resolveMimeType(file: File): string | null {
    const rawType = file.type.trim().toLowerCase();
    if (ALLOWED_TYPES.includes(rawType)) {
        return rawType;
    }

    // some deployed proxies/browsers strip image mime type to octet-stream
    if (rawType === "image/jpg") {
        return "image/jpeg";
    }

    if (rawType === "" || rawType === "application/octet-stream") {
        const extension = file.name.split(".").pop()?.trim().toLowerCase();
        if (extension && EXTENSION_TO_MIME[extension]) {
            return EXTENSION_TO_MIME[extension];
        }
    }

    return null;
}

async function isAnimatedGIF(buffer: Buffer): Promise<boolean> {
    try {
        const metadata = await sharp(buffer).metadata();
        return metadata.pages !== undefined && metadata.pages > 1;
    } catch {
        return false;
    }
}

export default async function uploadAvatar(req: BunRequest) {
    if (req.method !== "POST") {
        return new Response("method not allowed", { status: 405 });
    }

    let formData: Awaited<ReturnType<typeof req.formData>>;
    try {
        formData = await req.formData();
    } catch {
        return Response.json({ error: "invalid form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;

    if (!file) {
        return Response.json({ error: "file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
        return Response.json({ error: "file size exceeds 5MB limit" }, { status: 400 });
    }

    const mimeType = resolveMimeType(file);
    if (!mimeType) {
        return Response.json(
            { error: "invalid file type. allowed types: png, jpg, jpeg, webp, gif" },
            { status: 400 },
        );
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());

    // check if user is pro
    // const subscription = await getSubscriptionByUserId(req.userId);
    // const isPro = subscription?.status === "active";

    // block animated avatars for free users
    // if (!isPro && file.type === "image/gif") {
    //     const animated = await isAnimatedGIF(inputBuffer);
    //     if (animated) {
    //         return new Response(
    //             JSON.stringify({
    //                 error: "Animated avatars are only available on Pro. Upgrade to upload animated avatars.",
    //             }),
    //             { status: 403, headers: { "Content-Type": "application/json" } },
    //         );
    //     }
    // }

    const isGIF = mimeType === "image/gif";
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
