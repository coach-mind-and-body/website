import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { getDb } from "../../../../server/db";
import { users } from "../../../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "../../../../server/_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "../../../../server/_core/env";
import { sendTransactionalEmail } from "../../../../server/notifications";
import { cookies } from "next/headers";

const ADMIN_EMAILS = [
  "carter@inseitzmarketing.com",
  "coach@mindandbodyresetcoach.com",
];

function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

function makeOpenId(provider: "email" | "google", identifier: string): string {
  return `${provider}:${identifier}`;
}

async function issueSession(openId: string, name: string) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  
  (await cookies()).set({
    name: COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    secure: ENV.appPublicUrl?.startsWith("https://") ?? false,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR_MS / 1000
  });
}

async function upsertLocalUser(data: {
  openId: string;
  name: string | null;
  email: string;
  loginMethod: string;
  passwordHash?: string;
  googleId?: string;
  emailVerified?: boolean;
  emailVerifyToken?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(users).where(eq(users.openId, data.openId)).limit(1);
  const isAdmin = ADMIN_EMAILS.includes(data.email);

  if (existing.length === 0) {
    await db.insert(users).values({
      openId: data.openId,
      name: data.name,
      email: data.email,
      loginMethod: data.loginMethod,
      passwordHash: data.passwordHash,
      googleId: data.googleId,
      emailVerified: data.emailVerified ?? false,
      emailVerifyToken: data.emailVerifyToken ?? null,
      role: isAdmin ? "admin" : "user",
      lastSignedIn: new Date(),
    });
  } else {
    const updateData: Record<string, unknown> = { lastSignedIn: new Date() };
    if (data.name) updateData.name = data.name;
    if (data.passwordHash) updateData.passwordHash = data.passwordHash;
    if (data.googleId) updateData.googleId = data.googleId;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.emailVerifyToken !== undefined) updateData.emailVerifyToken = data.emailVerifyToken;
    if (isAdmin) updateData.role = "admin";
    await db.update(users).set(updateData).where(eq(users.openId, data.openId));
  }

  const [user] = await db.select().from(users).where(eq(users.openId, data.openId)).limit(1);
  return user;
}

function getPublicOrigin(req: Request): string {
  if (ENV.appPublicUrl) return ENV.appPublicUrl;
  const url = new URL(req.url);
  const proto = req.headers.get("x-forwarded-proto") || url.protocol.replace(':', '');
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || url.host;
  return `${proto}://${host}`;
}

export async function POST(req: Request, { params }: { params: Promise<{ action: string[] }> }) {
  const resolvedParams = await params;
  const actionPath = resolvedParams.action.join('/');

  if (actionPath === 'signup') {
    try {
      const { name, email, password } = await req.json();
      if (!email || !password || !name) return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
      if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

      const normalizedEmail = email.toLowerCase().trim();
      const openId = makeOpenId("email", normalizedEmail);
      const db = await getDb();
      if (!db) return NextResponse.json({ error: "Database not available" }, { status: 500 });

      const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, normalizedEmail)).limit(1);
      if (existing.length > 0) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

      const passwordHash = await bcrypt.hash(password, 12);
      const emailVerifyToken = generateToken();
      const user = await upsertLocalUser({
        openId, name: name.trim(), email: normalizedEmail, loginMethod: "email",
        passwordHash, emailVerified: false, emailVerifyToken,
      });

      const origin = getPublicOrigin(req);
      sendTransactionalEmail({
        to: normalizedEmail,
        toName: name.trim(),
        subject: "Verify your email — Mind & Body Reset Coaches",
        htmlBody: `<p>Hi ${name},</p><p>Welcome to Mind & Body Reset Coaches! Please verify your email address:</p><p><a href="${origin}/api/auth/verify-email?token=${emailVerifyToken}">Verify Email</a></p>`,
      }).catch(err => console.error("[Auth] Verification email failed:", err));

      await issueSession(user.openId, user.name || name);
      return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified } });
    } catch (err) {
      console.error("[Auth] Signup error", err);
      return NextResponse.json({ error: "Signup failed" }, { status: 500 });
    }
  }

  if (actionPath === 'login') {
    try {
      const { email, password } = await req.json();
      if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

      const normalizedEmail = email.toLowerCase().trim();
      const db = await getDb();
      if (!db) return NextResponse.json({ error: "Database not available" }, { status: 500 });

      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
      if (!user || !user.passwordHash) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

      const updateData: Record<string, unknown> = { lastSignedIn: new Date() };
      if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== "admin") updateData.role = "admin";
      await db.update(users).set(updateData).where(eq(users.id, user.id));

      await issueSession(user.openId, user.name || "");
      return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error("[Auth] Login error", err);
      return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
  }

  if (actionPath === 'forgot-password') {
    try {
      const { email } = await req.json();
      if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

      const normalizedEmail = email.toLowerCase().trim();
      const db = await getDb();
      if (!db) return NextResponse.json({ error: "Database not available" }, { status: 500 });

      const [user] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
      if (!user || !user.passwordHash) return NextResponse.json({ success: true });

      const resetToken = generateToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000);

      await db.update(users).set({ passwordResetToken: resetToken, passwordResetExpiry: expiry }).where(eq(users.id, user.id));

      const origin = getPublicOrigin(req);
      sendTransactionalEmail({
        to: normalizedEmail,
        toName: user.name || "there",
        subject: "Reset your password — Mind & Body Reset Coaches",
        htmlBody: `<p>Hi ${user.name || "there"},</p><p>We received a request to reset your password. Click the link below:</p><p><a href="${origin}/reset-password?token=${resetToken}">Reset Password</a></p>`,
      }).catch(err => console.error("[Auth] Reset email failed:", err));

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[Auth] Forgot password error", err);
      return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
    }
  }

  if (actionPath === 'reset-password') {
    try {
      const { token, password } = await req.json();
      if (!token || !password) return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
      if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

      const db = await getDb();
      if (!db) return NextResponse.json({ error: "Database not available" }, { status: 500 });

      const [user] = await db.select().from(users).where(eq(users.passwordResetToken, token)).limit(1);
      if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await db.update(users).set({ passwordHash, passwordResetToken: null, passwordResetExpiry: null }).where(eq(users.id, user.id));

      await issueSession(user.openId, user.name || "");
      return NextResponse.json({ success: true });
    } catch (err) {
      console.error("[Auth] Reset password error", err);
      return NextResponse.json({ error: "Password reset failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string[] }> }) {
  const resolvedParams = await params;
  const actionPath = resolvedParams.action.join('/');
  const url = new URL(req.url);

  if (actionPath === 'verify-email') {
    try {
      const token = url.searchParams.get("token");
      if (!token) return new NextResponse("Invalid verification link", { status: 400 });

      const db = await getDb();
      if (!db) return new NextResponse("Database not available", { status: 500 });

      const [user] = await db.select().from(users).where(eq(users.emailVerifyToken, token)).limit(1);
      if (!user) return new NextResponse("Invalid or expired verification link", { status: 400 });

      await db.update(users).set({ emailVerified: true, emailVerifyToken: null }).where(eq(users.id, user.id));
      return NextResponse.redirect(new URL("/?verified=1", getPublicOrigin(req)));
    } catch (err) {
      console.error("[Auth] Email verification error", err);
      return new NextResponse("Verification failed", { status: 500 });
    }
  }

  if (actionPath === 'google') {
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/api/auth/google/callback`;
    // Optional post-login path (e.g. /habit-tracker) — same-site relative only
    const rawReturn =
      url.searchParams.get("returnTo") || url.searchParams.get("redirect") || "";
    let postLoginRedirect: string | undefined;
    if (
      rawReturn.startsWith("/") &&
      !rawReturn.startsWith("//") &&
      !rawReturn.includes("://")
    ) {
      postLoginRedirect = rawReturn;
    }
    const state = Buffer.from(
      JSON.stringify({ redirectUri, postLoginRedirect })
    ).toString("base64url");

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", ENV.googleClientId || '');
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "select_account");

    return NextResponse.redirect(authUrl.toString());
  }

  if (actionPath === 'google/callback') {
    try {
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");

      const origin = getPublicOrigin(req);
      const fallbackUrl = new URL("/?error=google_auth_failed", origin);
      if (!code) return NextResponse.redirect(fallbackUrl);

      let redirectUri = `${origin}/api/auth/google/callback`;
      let statePostLoginRedirect = undefined;
      try {
        const stateData = JSON.parse(Buffer.from(stateParam || '', "base64url").toString());
        if (stateData.redirectUri) redirectUri = stateData.redirectUri;
        if (stateData.postLoginRedirect) statePostLoginRedirect = stateData.postLoginRedirect;
      } catch (_) {}

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
      if (!tokenData.access_token) return NextResponse.redirect(fallbackUrl);

      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userInfoRes.json();

      if (!googleUser.sub || !googleUser.email) return NextResponse.redirect(fallbackUrl);

      const openId = makeOpenId("google", googleUser.sub);
      const user = await upsertLocalUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email,
        loginMethod: "google",
        googleId: googleUser.sub,
        emailVerified: googleUser.email_verified ?? true,
      });

      let postLoginRedirect =
        (typeof statePostLoginRedirect === "string" &&
        statePostLoginRedirect.startsWith("/") &&
        !statePostLoginRedirect.startsWith("//")
          ? statePostLoginRedirect
          : null) || (user.role === "admin" ? "/admin" : "/portal");
      if (user.role === "admin") postLoginRedirect = "/admin";
      await issueSession(user.openId, user.name || googleUser.name || "");

      const resUrl = new URL(postLoginRedirect, origin);
      return NextResponse.redirect(resUrl);
    } catch (err) {
      console.error("[Auth] Google callback error", err);
      return NextResponse.redirect(new URL("/?error=google_auth_failed", getPublicOrigin(req)));
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
