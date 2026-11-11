import { sdk } from "./_core/sdk";
import { formPhotoOwnerId } from "@shared/forms";
import { privateStorageRead } from "./storage";

export class FormPhotoError extends Error {
  readonly status: 403 | 404;

  constructor(status: 403 | 404) {
    super(status === 403 ? "Forbidden" : "Not found");
    this.name = "FormPhotoError";
    this.status = status;
  }
}

export function authorizeFormPhoto(user: { id: number; role: string }, key: string): string {
  const ownerId = formPhotoOwnerId(key);
  if (ownerId == null) throw new FormPhotoError(404);
  if (user.role === "admin" || ownerId === user.id) return key.trim();
  throw new FormPhotoError(403);
}

export async function handleFormPhotoRequest(req: Request): Promise<Response> {
  let user: { id: number; role: string } | null = null;
  try {
    user = await sdk.authenticateNextRequest(req);
  } catch {
    user = null;
  }
  if (!user) return new Response("Unauthorized", { status: 401 });

  const key = new URL(req.url).searchParams.get("key") ?? "";
  let safeKey: string;
  try {
    safeKey = authorizeFormPhoto(user, key);
  } catch (error) {
    if (error instanceof FormPhotoError) return new Response(error.message, { status: error.status });
    throw error;
  }

  let object: { body: Buffer; contentType: string } | null;
  try {
    object = await privateStorageRead(safeKey);
  } catch (error) {
    console.error("[form-photo]", error);
    return new Response("Could not load that photo.", { status: 500 });
  }
  if (!object) return new Response("Not found", { status: 404 });

  const contentType = object.contentType.startsWith("image/") ? object.contentType : "application/octet-stream";
  return new Response(new Uint8Array(object.body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
