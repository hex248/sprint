import { S3Client } from "bun";

const s3Endpoint = process.env.S3_ENDPOINT;
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
const s3BucketName = process.env.S3_BUCKET_NAME;
const s3PublicUrl = process.env.S3_PUBLIC_URL;

if (!s3Endpoint || !s3AccessKeyId || !s3SecretAccessKey || !s3BucketName) {
    throw new Error("missing required S3 environment variables");
}

export const s3Client = new S3Client({
    endpoint: s3Endpoint,
    bucket: s3BucketName,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
});

export const bucketName = s3BucketName;
export { s3Endpoint, s3PublicUrl };

export async function uploadToS3(key: string, data: Buffer, mimeType: string) {
    const s3File = s3Client.file(key);
    await s3File.write(data, { type: mimeType });
}

export async function deleteFromS3(key: string) {
    const s3File = s3Client.file(key);
    await s3File.delete();
}

export function getS3PublicUrl(key: string) {
    const publicUrlBase = s3PublicUrl || s3Endpoint;
    return `${publicUrlBase}/${key}`;
}
