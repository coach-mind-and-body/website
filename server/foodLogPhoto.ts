import { sdk } from "./_core/sdk";
import { storageRead } from "./storage";

/** Private object key saved on a meal. Not a public URL. */
export const FOOD_LOG_PHOTO_KEY = /^food-logs\/(\d+)\/[A-Za-z0-9][A-Za-z0-9._-]{0,180}$/;

export class FoodLogPhotoError extends Error {
  readonly status: 403 | 404;

  constructor(status: 403 | 404) {
    super(status === 403 ? "Forbidden" : "Not found");
    this.name = "FoodLogPhotoError";
    this.status = status;
  }
}

export function authorizeFoodLogPhoto(
  user: { id: number; role: string },
  key: string
): string {
  const match = FOOD_LOG_PHOTO_KEY.exec(key.trim());
  if (!match) throw new FoodLogPhotoError(404);
  const ownerId = Number(match[1]);
  if (user.role === "admin" || ownerId === user.id) return match[0];
  throw new FoodLogPhotoError(403);
}

export async function handleFoodLogPhotoRequest(req: Request): Promise<Response> {
  let user: { id: number; role: string } | null = null;
  try {
    user = await sdk.authenticateNextRequest(req);
  } catch {
    user = null;
  }
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const key = new URL(req.url).searchParams.get("key") ?? "";
  let safeKey: string;
  try {
    safeKey = authorizeFoodLogPhoto(user, key);
  } catch (error) {
    if (error instanceof FoodLogPhotoError) {
      return new Response(error.message, { status: error.status });
    }
    throw error;
  }

  let object: { body: Buffer; contentType: string } | null;
  try {
    object = await storageRead(safeKey);
  } catch (error) {
    console.error("[food-log-photo]", error);
    return new Response("Could not load that photo.", { status: 500 });
  }
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  const contentType = object.contentType.startsWith("image/")
    ? object.contentType
    : "application/octet-stream";

  return new Response(new Uint8Array(object.body), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
