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

/** Read a public-bucket object, such as a library worksheet, so it can be turned into a form. */
export async function storageRead(
  relKey: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const key = normalizeKey(relKey);
  const s3 = getS3Client();
  try {
    const result = await s3.send(new GetObjectCommand({ Bucket: ENV.r2BucketName, Key: key }));
    if (!result.Body) return null;
    const bytes = await result.Body.transformToByteArray();
    return {
      body: Buffer.from(bytes),
      contentType: result.ContentType || "application/octet-stream",
    };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
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

function privateEndpoint(): string {
  return (ENV.r2PrivateEndpoint || ENV.r2Endpoint).trim();
}

/** True when the private food-log bucket can be used. Never falls back to the public bucket. */
export function privateFoodLogStorageReady(): boolean {
  return Boolean(ENV.r2PrivateAccessKeyId && ENV.r2PrivateSecretAccessKey && privateEndpoint());
}

function getPrivateS3Client() {
  if (!privateFoodLogStorageReady()) {
    throw new Error("Private R2 storage is not configured.");
  }
  return new S3Client({
    region: "auto",
    endpoint: privateEndpoint(),
    credentials: {
      accessKeyId: ENV.r2PrivateAccessKeyId,
      secretAccessKey: ENV.r2PrivateSecretAccessKey,
    },
  });
}

const PRIVATE_STORAGE_HINT =
  "Set R2_PRIVATE_ACCESS_KEY_ID, R2_PRIVATE_SECRET_ACCESS_KEY, and R2_PRIVATE_ENDPOINT (or R2_ENDPOINT). R2_PRIVATE_BUCKET defaults to mbr-private-uploads.";

/** Upload a food-log photo to the private bucket. Returns null when it is not configured. */
export async function privateStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string } | null> {
  if (!privateFoodLogStorageReady()) {
    console.warn(`[written-food-log] Private photo storage is not configured. ${PRIVATE_STORAGE_HINT} Skipping the page photo.`);
    return null;
  }
  const s3 = getPrivateS3Client();
  const key = normalizeKey(relKey);
  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.r2PrivateBucket,
      Key: key,
      Body: typeof data === "string" ? Buffer.from(data, "utf-8") : data,
      ContentType: contentType,
    })
  );
  return { key };
}

/** Read a food-log photo from the private bucket. Does not use the public bucket or a public URL. */
export async function privateStorageRead(
  relKey: string
): Promise<{ body: Buffer; contentType: string } | null> {
  if (!privateFoodLogStorageReady()) {
    console.warn(`[food-log-photo] Private photo storage is not configured. ${PRIVATE_STORAGE_HINT}`);
    return null;
  }
  const key = normalizeKey(relKey);
  const s3 = getPrivateS3Client();
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: ENV.r2PrivateBucket,
        Key: key,
      })
    );
    if (!result.Body) return null;
    const bytes = await result.Body.transformToByteArray();
    return {
      body: Buffer.from(bytes),
      contentType: result.ContentType || "application/octet-stream",
    };
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "";
    if (name === "NoSuchKey" || name === "NotFound") return null;
    throw error;
  }
}
