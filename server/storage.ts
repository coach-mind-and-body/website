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

/** Read an object with the private R2 credentials. Does not build a public URL. */
export async function storageRead(
  relKey: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const key = normalizeKey(relKey);
  const s3 = getS3Client();
  try {
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: ENV.r2BucketName,
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

function privateBucket() {
  const hasPrivate = Boolean(
    ENV.r2PrivateAccessKeyId &&
      ENV.r2PrivateSecretAccessKey &&
      ENV.r2PrivateEndpoint &&
      ENV.r2PrivateBucketName
  );
  return {
    accessKeyId: hasPrivate ? ENV.r2PrivateAccessKeyId : ENV.r2AccessKeyId,
    secretAccessKey: hasPrivate ? ENV.r2PrivateSecretAccessKey : ENV.r2SecretAccessKey,
    endpoint: hasPrivate ? ENV.r2PrivateEndpoint : ENV.r2Endpoint,
    bucket: hasPrivate ? ENV.r2PrivateBucketName : ENV.r2BucketName,
  };
}

function privateClient() {
  const cfg = privateBucket();
  if (!cfg.accessKeyId || !cfg.secretAccessKey || !cfg.endpoint || !cfg.bucket) {
    throw new Error("Missing R2 credentials in environment variables.");
  }
  return {
    bucket: cfg.bucket,
    client: new S3Client({
      region: "auto",
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    }),
  };
}

/** Store an object in the private bucket. Returns the key only — never a public URL. */
export async function privateStoragePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string }> {
  const { client, bucket } = privateClient();
  const key = normalizeKey(relKey);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: typeof data === "string" ? Buffer.from(data, "utf-8") : data,
      ContentType: contentType,
    })
  );
  return { key };
}

/** Read an object from the private bucket. */
export async function privateStorageRead(
  relKey: string
): Promise<{ body: Buffer; contentType: string } | null> {
  const { client, bucket } = privateClient();
  const key = normalizeKey(relKey);
  try {
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
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
