import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { googleTokens } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "@/server/_core/env";
import { sdk } from "@/server/_core/sdk";
import { SignJWT, jwtVerify } from "jose";

const oauthStateSecret = () => new TextEncoder().encode(ENV.cookieSecret || "gcal-oauth-fallback");

async function createOAuthState(userId: number) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10m")
    .sign(oauthStateSecret());
}

async function verifyOAuthState(state: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(state, oauthStateSecret());
    const userId = payload.userId;
    return typeof userId === "number" ? userId : null;
  } catch {
    return null;
  }
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

function getRedirectUri(req: Request) {
  if (ENV.isProduction && ENV.appPublicUrl) {
    return `${ENV.appPublicUrl}/api/auth/google-calendar/callback`;
  }
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(':', '');
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  const protocol = ENV.isProduction ? "https" : proto;
  return `${protocol}://${host}/api/auth/google-calendar/callback`;
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string[] }> }) {
  const resolvedParams = await params;
  const action = resolvedParams.action[0];

  if (action === "connect") {
    try {
      const user = await sdk.authenticateNextRequest(req);
      if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

      const redirectUri = getRedirectUri(req);
      const searchParams = new URLSearchParams({
        client_id: ENV.googleClientId || '',
        redirect_uri: redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: await createOAuthState(user.id),
      });
      return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${searchParams}`);
    } catch {
      return NextResponse.json({ error: "Not authenticated" }, { status: 403 });
    }
  }

  if (action === "callback") {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    
    const adminUrl = new URL("/admin", getRedirectUri(req)).origin + "/admin";

    if (error || !code || !state) return NextResponse.redirect(adminUrl + "?gcal=error");

    try {
      const redirectUri = getRedirectUri(req);
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId || '',
          client_secret: ENV.googleClientSecret || '',
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      
      const tokenData = await tokenRes.json();
      if (tokenData.error || !tokenData.access_token) {
        console.error("Google token exchange failed:", tokenData);
        return NextResponse.redirect(adminUrl + "?gcal=error");
      }

      const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const profile = await profileRes.json();

      const userId = await verifyOAuthState(state);
      if (!userId) return NextResponse.redirect(adminUrl + "?gcal=error");

      try {
        const sessionUser = await sdk.authenticateNextRequest(req);
        if (sessionUser && sessionUser.id !== userId) {
          return NextResponse.redirect(adminUrl + "?gcal=error");
        }
      } catch {
        // OAuth callback may arrive before session cookie is set
      }

      const expiresAt = Date.now() + tokenData.expires_in * 1000;

      const db = await getDb();
      if (!db) return NextResponse.redirect(adminUrl + "?gcal=error");

      await db.insert(googleTokens).values({
        userId, accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token,
        expiresAt, email: profile.email ?? null,
      }).onDuplicateKeyUpdate({
        set: {
          accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token,
          expiresAt, email: profile.email ?? null,
        },
      });

      return NextResponse.redirect(adminUrl + "?gcal=connected");
    } catch (err) {
      console.error("Google Calendar callback error:", err);
      return NextResponse.redirect(adminUrl + "?gcal=error");
    }
  }

  return new NextResponse("Not found", { status: 404 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ action: string[] }> }) {
  const resolvedParams = await params;
  if (resolvedParams.action[0] === "disconnect") {
    try {
      const user = await sdk.authenticateNextRequest(req);
      if (!user || user.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
      
      const db = await getDb();
      if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });
      
      await db.delete(googleTokens).where(eq(googleTokens.userId, user.id));
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
    }
  }
  return new NextResponse("Not found", { status: 404 });
}
