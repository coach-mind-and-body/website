/**
 * authRoutes.ts
 * Express routes for email/password and Google OAuth authentication.
 * These complement the existing Manus OAuth flow in server/_core/oauth.ts.
 */
import crypto from "crypto";
import type { Express, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "./_core/env";
import { sendTransactionalEmail } from "./notifications";

// ── Admin email whitelist ─────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  "carter@inseitzmarketing.com",
  "coach@mindandbodyresetcoach.com",
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Derive a stable openId for non-Manus users so the session JWT works unchanged */
function makeOpenId(provider: "email" | "google", identifier: string): string {
  return `${provider}:${identifier}`;
}

async function issueSession(res: Response, req: Request, openId: string, name: string) {
  const sessionToken = await sdk.createSessionToken(openId, {
    name,
    expiresInMs: ONE_YEAR_MS,
  });
  const cookieOptions = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
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

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.openId, data.openId))
    .limit(1);

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
    const updateData: Record<string, unknown> = {
      lastSignedIn: new Date(),
    };
    if (data.name) updateData.name = data.name;
    if (data.passwordHash) updateData.passwordHash = data.passwordHash;
    if (data.googleId) updateData.googleId = data.googleId;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.emailVerifyToken !== undefined) updateData.emailVerifyToken = data.emailVerifyToken;
    if (isAdmin) updateData.role = "admin";
    await db.update(users).set(updateData).where(eq(users.openId, data.openId));
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.openId, data.openId))
    .limit(1);
  return user;
}

// ── Register all auth routes ──────────────────────────────────────────────────
export function registerAuthRoutes(app: Express) {

  // POST /api/auth/signup
  app.post("/api/auth/signup", async (req: Request, res: Response) => {
    try {
      const { name, email, password } = req.body as {
        name?: string;
        email?: string;
        password?: string;
      };

      if (!email || !password || !name) {
        res.status(400).json({ error: "Name, email, and password are required" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const openId = makeOpenId("email", normalizedEmail);

      const db = await getDb();
      if (!db) { res.status(500).json({ error: "Database not available" }); return; }

      // Check if email already registered
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (existing.length > 0) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const emailVerifyToken = generateToken();

      const user = await upsertLocalUser({
        openId,
        name: name.trim(),
        email: normalizedEmail,
        loginMethod: "email",
        passwordHash,
        emailVerified: false,
        emailVerifyToken,
      });

      // Send verification email (non-blocking)
      sendTransactionalEmail({
        to: normalizedEmail,
        toName: name.trim(),
        subject: "Verify your email — Mind & Body Reset",
        htmlBody: `
          <p>Hi ${name},</p>
          <p>Welcome to Mind & Body Reset! Please verify your email address:</p>
          <p><a href="${req.headers.origin}/api/auth/verify-email?token=${emailVerifyToken}">Verify Email</a></p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        `,
      }).catch(err => console.error("[Auth] Verification email failed:", err));

      await issueSession(res, req, user.openId, user.name || name);
      res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
      });
    } catch (err) {
      console.error("[Auth] Signup error", err);
      res.status(500).json({ error: "Signup failed" });
    }
  });

  // POST /api/auth/login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body as { email?: string; password?: string };

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "Database not available" }); return; }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Promote to admin if on whitelist
      const updateData: Record<string, unknown> = { lastSignedIn: new Date() };
      if (ADMIN_EMAILS.includes(normalizedEmail) && user.role !== "admin") {
        updateData.role = "admin";
      }
      await db.update(users).set(updateData).where(eq(users.id, user.id));

      await issueSession(res, req, user.openId, user.name || "");
      res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
      console.error("[Auth] Login error", err);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // GET /api/auth/verify-email
  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) { res.status(400).send("Invalid verification link"); return; }

      const db = await getDb();
      if (!db) { res.status(500).send("Database not available"); return; }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.emailVerifyToken, token))
        .limit(1);

      if (!user) { res.status(400).send("Invalid or expired verification link"); return; }

      await db
        .update(users)
        .set({ emailVerified: true, emailVerifyToken: null })
        .where(eq(users.id, user.id));

      res.redirect("/?verified=1");
    } catch (err) {
      console.error("[Auth] Email verification error", err);
      res.status(500).send("Verification failed");
    }
  });

  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body as { email?: string };
      if (!email) { res.status(400).json({ error: "Email is required" }); return; }

      const normalizedEmail = email.toLowerCase().trim();
      const db = await getDb();
      if (!db) { res.status(500).json({ error: "Database not available" }); return; }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        res.json({ success: true });
        return;
      }

      const resetToken = generateToken();
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db
        .update(users)
        .set({ passwordResetToken: resetToken, passwordResetExpiry: expiry })
        .where(eq(users.id, user.id));

      sendTransactionalEmail({
        to: normalizedEmail,
        toName: user.name || "there",
        subject: "Reset your password — Mind & Body Reset",
        htmlBody: `
          <p>Hi ${user.name || "there"},</p>
          <p>We received a request to reset your password. Click the link below:</p>
          <p><a href="${req.headers.origin}/reset-password?token=${resetToken}">Reset Password</a></p>
          <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        `,
      }).catch(err => console.error("[Auth] Reset email failed:", err));

      res.json({ success: true });
    } catch (err) {
      console.error("[Auth] Forgot password error", err);
      res.status(500).json({ error: "Failed to send reset email" });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body as { token?: string; password?: string };

      if (!token || !password) {
        res.status(400).json({ error: "Token and password are required" });
        return;
      }
      if (password.length < 8) {
        res.status(400).json({ error: "Password must be at least 8 characters" });
        return;
      }

      const db = await getDb();
      if (!db) { res.status(500).json({ error: "Database not available" }); return; }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (!user || !user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
        res.status(400).json({ error: "Invalid or expired reset link" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await db
        .update(users)
        .set({ passwordHash, passwordResetToken: null, passwordResetExpiry: null })
        .where(eq(users.id, user.id));

      await issueSession(res, req, user.openId, user.name || "");
      res.json({ success: true });
    } catch (err) {
      console.error("[Auth] Reset password error", err);
      res.status(500).json({ error: "Password reset failed" });
    }
  });

  // ── Google OAuth ──────────────────────────────────────────────────────────────

  // Helper to get the public-facing origin reliably (works behind Manus proxy)
  // Prefers APP_PUBLIC_URL env var (stable domain) over dynamic request headers
  function getPublicOrigin(req: Request): string {
    if (ENV.appPublicUrl) {
      console.log("[Auth/Google] Using APP_PUBLIC_URL:", ENV.appPublicUrl);
      return ENV.appPublicUrl;
    }
    // Fallback for local dev where APP_PUBLIC_URL is not set
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
    const origin = `${proto}://${host}`;
    console.log("[Auth/Google] Fallback origin from headers:", origin);
    return origin;
  }

  // GET /api/auth/google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    // Always use APP_PUBLIC_URL (the custom domain) for redirect_uri — this must match
    // exactly what is registered in the Google OAuth app console.
    const origin = getPublicOrigin(req);
    const redirectUri = `${origin}/api/auth/google/callback`;
    console.log("[Auth/Google] Redirect URI:", redirectUri);
    const state = Buffer.from(JSON.stringify({ redirectUri })).toString("base64url");

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.googleClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "select_account");

    res.redirect(url.toString());
  });

  // GET /api/auth/google/callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      const stateParam = req.query.state as string;

      if (!code) { res.redirect("/?error=google_auth_failed"); return; }

      // The redirect_uri for token exchange MUST exactly match what was sent in the
      // initial /api/auth/google redirect — always use APP_PUBLIC_URL (custom domain).
      const origin = getPublicOrigin(req);
      let redirectUri = `${origin}/api/auth/google/callback`;
      let postLoginRedirect = "/admin";
      try {
        const stateData = JSON.parse(Buffer.from(stateParam, "base64url").toString());
        if (stateData.redirectUri) redirectUri = stateData.redirectUri;
        if (stateData.postLoginRedirect) postLoginRedirect = stateData.postLoginRedirect;
      } catch (_) {}

      console.log("[Auth/Google] Callback - using redirectUri for token exchange:", redirectUri);

      // Exchange code for tokens
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
      if (!tokenData.access_token) {
        console.error("[Auth] Google token exchange failed", tokenData);
        res.redirect("/?error=google_auth_failed");
        return;
      }

      // Get user info from Google
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const googleUser = await userInfoRes.json() as {
        sub?: string;
        email?: string;
        name?: string;
        email_verified?: boolean;
      };

      if (!googleUser.sub || !googleUser.email) {
        res.redirect("/?error=google_auth_failed");
        return;
      }

      const openId = makeOpenId("google", googleUser.sub);
      const user = await upsertLocalUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email,
        loginMethod: "google",
        googleId: googleUser.sub,
        emailVerified: googleUser.email_verified ?? true,
      });

      await issueSession(res, req, user.openId, user.name || googleUser.name || "");
      res.redirect(postLoginRedirect);
    } catch (err) {
      console.error("[Auth] Google callback error", err);
      res.redirect("/?error=google_auth_failed");
    }
  });
}
