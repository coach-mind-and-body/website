import { beforeEach, describe, expect, it, vi } from "vitest";

const env = vi.hoisted(() => ({
  r2AccessKeyId: "public-key",
  r2SecretAccessKey: "public-secret",
  r2Endpoint: "https://public-account.r2.cloudflarestorage.com",
  r2BucketName: "mindbodyreset-assets",
  r2PublicUrl: "https://cdn.example",
  r2PrivateAccessKeyId: "private-key",
  r2PrivateSecretAccessKey: "private-secret",
  r2PrivateEndpoint: "https://157bf958971c3940b41155bd64ab8930.r2.cloudflarestorage.com",
  r2PrivateBucket: "mbr-private-uploads",
}));

const send = vi.hoisted(() => vi.fn());
const S3Client = vi.hoisted(() => vi.fn(() => ({ send })));
const PutObjectCommand = vi.hoisted(() => vi.fn((input: unknown) => ({ input })));
const GetObjectCommand = vi.hoisted(() => vi.fn((input: unknown) => ({ input })));

vi.mock("./_core/env", () => ({ ENV: env }));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
}));
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi.fn(async () => "https://signed.example/object"),
}));

import { privateStoragePut, privateStorageRead, storagePut } from "./storage";

const privateEndpoint = "https://157bf958971c3940b41155bd64ab8930.r2.cloudflarestorage.com";

describe("private food-log bucket", () => {
  beforeEach(() => {
    env.r2PrivateAccessKeyId = "private-key";
    env.r2PrivateSecretAccessKey = "private-secret";
    env.r2PrivateEndpoint = privateEndpoint;
    env.r2PrivateBucket = "mbr-private-uploads";
    env.r2Endpoint = "https://public-account.r2.cloudflarestorage.com";
    send.mockReset();
    send.mockResolvedValue({});
    S3Client.mockClear();
    PutObjectCommand.mockClear();
    GetObjectCommand.mockClear();
  });

  it("writes food-log photos with the private token and bucket", async () => {
    const stored = await privateStoragePut("food-logs/4/page.jpg", Buffer.from("photo"), "image/jpeg");
    expect(stored).toEqual({ key: "food-logs/4/page.jpg" });
    expect(S3Client).toHaveBeenCalledWith({
      region: "auto",
      endpoint: privateEndpoint,
      credentials: {
        accessKeyId: "private-key",
        secretAccessKey: "private-secret",
      },
    });
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "mbr-private-uploads",
        Key: "food-logs/4/page.jpg",
        ContentType: "image/jpeg",
      })
    );
  });

  it("reads food-log photos from the private bucket", async () => {
    send.mockResolvedValue({
      Body: { transformToByteArray: async () => new Uint8Array([9, 8, 7]) },
      ContentType: "image/jpeg",
    });
    const object = await privateStorageRead("food-logs/4/page.jpg");
    expect(object?.contentType).toBe("image/jpeg");
    expect(object?.body).toEqual(Buffer.from([9, 8, 7]));
    expect(GetObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "mbr-private-uploads",
        Key: "food-logs/4/page.jpg",
      })
    );
  });

  it("uses R2_ENDPOINT when the private endpoint is not set", async () => {
    env.r2PrivateEndpoint = "";
    await privateStoragePut("food-logs/4/page.jpg", Buffer.from("photo"), "image/jpeg");
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://public-account.r2.cloudflarestorage.com",
        credentials: {
          accessKeyId: "private-key",
          secretAccessKey: "private-secret",
        },
      })
    );
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({ Bucket: "mbr-private-uploads" })
    );
  });

  it("skips the photo when the private token is missing and does not touch R2", async () => {
    env.r2PrivateAccessKeyId = "";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(privateStoragePut("food-logs/4/page.jpg", Buffer.from("photo"), "image/jpeg")).resolves.toBeNull();
    await expect(privateStorageRead("food-logs/4/page.jpg")).resolves.toBeNull();
    expect(S3Client).not.toHaveBeenCalled();
    expect(warn.mock.calls.flat().join(" ")).toContain("R2_PRIVATE_ACCESS_KEY_ID");
    warn.mockRestore();
  });

  it("keeps site images on the public bucket", async () => {
    await storagePut("blog/cover.jpg", Buffer.from("cover"), "image/jpeg");
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://public-account.r2.cloudflarestorage.com",
        credentials: {
          accessKeyId: "public-key",
          secretAccessKey: "public-secret",
        },
      })
    );
    expect(PutObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "mindbodyreset-assets",
        Key: "blog/cover.jpg",
      })
    );
  });
});
