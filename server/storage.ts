import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  if (!ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Endpoint) {
    throw new Error("Missing R2 credentials in environment variables.");
  }

  return new S3Client({
    region: "auto",
    endpoint: ENV.r2Endpoint,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const s3 = getS3Client();
  const key = normalizeKey(relKey);

  const command = new PutObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
    Body: typeof data === "string" ? Buffer.from(data, 'utf-8') : data,
    ContentType: contentType,
  });

  await s3.send(command);

  // Use the public R2 domain if configured, otherwise fallback to signed URL
  if (ENV.r2PublicUrl) {
    const publicUrl = ENV.r2PublicUrl.endsWith('/') ? ENV.r2PublicUrl.slice(0, -1) : ENV.r2PublicUrl;
    return { key, url: `${publicUrl}/${key}` };
  } else {
    // Generate a signed URL if we don't have a public one (usually good for 7 days)
    const getCommand = new GetObjectCommand({
      Bucket: ENV.r2BucketName,
      Key: key,
    });
    const url = await getSignedUrl(s3, getCommand, { expiresIn: 604800 });
    return { key, url };
  }
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);
  
  if (ENV.r2PublicUrl) {
    const publicUrl = ENV.r2PublicUrl.endsWith('/') ? ENV.r2PublicUrl.slice(0, -1) : ENV.r2PublicUrl;
    return { key, url: `${publicUrl}/${key}` };
  }
  
  const s3 = getS3Client();
  const command = new GetObjectCommand({
    Bucket: ENV.r2BucketName,
    Key: key,
  });
  
  const url = await getSignedUrl(s3, command, { expiresIn: 604800 });
  return { key, url };
}
