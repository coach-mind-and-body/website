import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../drizzle/schema";

const auth = vi.hoisted(() => ({
  user: null as User | null,
}));

vi.mock("./_core/sdk", () => ({
  sdk: {
    authenticateNextRequest: vi.fn(async () => {
      if (!auth.user) throw new Error("Invalid session");
      return auth.user;
    }),
  },
}));

vi.mock("./storage", () => ({
  storageRead: vi.fn(async () => ({
    body: Buffer.from("jpeg-bytes"),
    contentType: "image/jpeg",
  })),
}));

import { handleFoodLogPhotoRequest } from "./foodLogPhoto";
import { storageRead } from "./storage";

const photoKey = "food-logs/42/page.jpg";

function request(key = photoKey) {
  return new Request(`https://example.com/api/food-log-photo?key=${encodeURIComponent(key)}`);
}

function user(id: number, role: "user" | "admin"): User {
  return { id, role } as User;
}

describe("private food log photos", () => {
  beforeEach(() => {
    auth.user = null;
    vi.mocked(storageRead).mockClear();
  });

  it("lets the owner view their page", async () => {
    auth.user = user(42, "user");
    const response = await handleFoodLogPhotoRequest(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("jpeg-bytes");
    expect(storageRead).toHaveBeenCalledWith(photoKey);
  });

  it("lets an admin view a client's page", async () => {
    auth.user = user(1, "admin");
    const response = await handleFoodLogPhotoRequest(request());
    expect(response.status).toBe(200);
    expect(storageRead).toHaveBeenCalledWith(photoKey);
  });

  it("refuses another client", async () => {
    auth.user = user(7, "user");
    const response = await handleFoodLogPhotoRequest(request());
    expect(response.status).toBe(403);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it("refuses a signed-out request", async () => {
    auth.user = null;
    const response = await handleFoodLogPhotoRequest(request());
    expect(response.status).toBe(401);
    expect(storageRead).not.toHaveBeenCalled();
  });

  it("does not read a public address or a path outside food logs", async () => {
    auth.user = user(42, "user");
    const publicUrl = await handleFoodLogPhotoRequest(
      request("https://cdn.example/food-logs/42/page.jpg")
    );
    expect(publicUrl.status).toBe(404);

    const otherPrefix = await handleFoodLogPhotoRequest(request("blog/secret.jpg"));
    expect(otherPrefix.status).toBe(404);

    const traversal = await handleFoodLogPhotoRequest(request("food-logs/42/../secret.jpg"));
    expect(traversal.status).toBe(404);
    expect(storageRead).not.toHaveBeenCalled();
  });
});
