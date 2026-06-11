import "dotenv/config";
import { S3Client, ListObjectsV2Command, CopyObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./server/_core/env";

async function run() {
  if (!ENV.r2AccessKeyId || !ENV.r2SecretAccessKey || !ENV.r2Endpoint || !ENV.r2BucketName) {
    console.error("Missing R2 environment variables. Cannot migrate.");
    process.exit(1);
  }

  const s3 = new S3Client({
    region: "auto",
    endpoint: ENV.r2Endpoint,
    credentials: {
      accessKeyId: ENV.r2AccessKeyId,
      secretAccessKey: ENV.r2SecretAccessKey,
    },
  });

  console.log("Listing objects in bucket:", ENV.r2BucketName);
  
  let isTruncated = true;
  let continuationToken: string | undefined = undefined;

  while (isTruncated) {
    const listCommand = new ListObjectsV2Command({
      Bucket: ENV.r2BucketName,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(listCommand);

    if (response.Contents) {
      for (const item of response.Contents) {
        if (!item.Key) continue;
        
        let contentType = "application/octet-stream";
        const ext = item.Key.split('.').pop()?.toLowerCase();
        
        if (ext === "jpg" || ext === "jpeg") contentType = "image/jpeg";
        else if (ext === "png") contentType = "image/png";
        else if (ext === "webp") contentType = "image/webp";
        else if (ext === "gif") contentType = "image/gif";
        else if (ext === "svg") contentType = "image/svg+xml";
        else if (ext === "pdf") contentType = "application/pdf";
        
        // If it's an image or pdf, let's ensure it has the right content type by replacing its metadata
        if (contentType !== "application/octet-stream") {
          console.log(`Fixing ${item.Key} -> ${contentType}`);
          
          try {
            await s3.send(new CopyObjectCommand({
              Bucket: ENV.r2BucketName,
              CopySource: `${ENV.r2BucketName}/${item.Key}`,
              Key: item.Key,
              ContentType: contentType,
              MetadataDirective: "REPLACE",
            }));
            console.log(`[Success] Updated Content-Type for ${item.Key}`);
          } catch (e) {
            console.error(`[Error] Failed to update ${item.Key}`, e);
          }
        }
      }
    }

    isTruncated = response.IsTruncated ?? false;
    continuationToken = response.NextContinuationToken;
  }

  console.log("Finished updating content types.");
}

run().catch(console.error);
