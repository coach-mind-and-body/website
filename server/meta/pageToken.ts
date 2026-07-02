import { getDb } from "../db";
import { appIntegrations } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "../_core/env";

/** Page access token from OAuth integration, with legacy env fallback. */
export async function getMetaPageAccessToken(): Promise<string | null> {
  const db = await getDb();
  if (db) {
    const rows = await db
      .select()
      .from(appIntegrations)
      .where(eq(appIntegrations.provider, "meta"))
      .limit(1);
    if (rows[0]?.accessToken) {
      return rows[0].accessToken;
    }
  }
  return ENV.metaAccessToken || null;
}