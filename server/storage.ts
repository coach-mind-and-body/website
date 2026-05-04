import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from './_core/env';

function getS3Client() {
  if (!ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Endpoint) {
    throw new Error(
      "R2 credentials missing: set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_ENDPOINT"
    );
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
  const key = normalizeKey(relKey);
  const bucket = ENV.r2BucketName;
  
  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }

  const client = getS3Client();

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data as any);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // If a public URL is configured, use it. Otherwise, generate a presigned URL.
  let url = "";
  if (ENV.r2PublicUrl) {
    const baseUrl = ENV.r2PublicUrl.endsWith('/') ? ENV.r2PublicUrl : `${ENV.r2PublicUrl}/`;
    url = `${baseUrl}${key}`;
  } else {
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    url = await getSignedUrl(client, getCommand, { expiresIn: 3600 * 24 * 7 }); // 7 days
  }

  return { key, url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string; }> {
  const key = normalizeKey(relKey);
  const bucket = ENV.r2BucketName;

  if (!bucket) {
    throw new Error("R2_BUCKET_NAME is not configured");
  }
  
  let url = "";
  if (ENV.r2PublicUrl) {
    const baseUrl = ENV.r2PublicUrl.endsWith('/') ? ENV.r2PublicUrl : `${ENV.r2PublicUrl}/`;
    url = `${baseUrl}${key}`;
  } else {
    const client = getS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });
    url = await getSignedUrl(client, command, { expiresIn: 3600 * 24 * 7 }); // 7 days
  }

  return {
    key,
    url,
  };
}
