import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { Resend } from "resend";
import { SignJWT, jwtVerify } from "jose";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";

const resend = new Resend(ENV.resendApiKey);

// A separate secret for short-lived magic links
function getMagicLinkSecret() {
  return new TextEncoder().encode(ENV.cookieSecret + "_magic");
}

function getBaseUrl(req: Request) {
  if (process.env.APP_PUBLIC_URL) {
    return process.env.APP_PUBLIC_URL.replace(/\/$/, "");
  }
  let protocol = req.headers["x-forwarded-proto"] || req.protocol;
  if (Array.isArray(protocol)) {
    protocol = protocol[0];
  } else if (typeof protocol === 'string' && protocol.includes(',')) {
    protocol = protocol.split(',')[0].trim();
  }
  return `${protocol}://${req.get("host")}`;
}

export function registerOAuthRoutes(app: Express) {
  // ── Google OAuth ──
  app.get("/api/auth/google/login", (req: Request, res: Response) => {
    const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
    const oauth2Client = new OAuth2Client(ENV.googleClientId, ENV.googleClientSecret, redirectUri);
    
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
      prompt: "consent",
    });
    res.redirect(302, url);
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const code = req.query.code as string;
      if (!code) {
        return res.status(400).send("Missing code");
      }

      const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
      const oauth2Client = new OAuth2Client(ENV.googleClientId, ENV.googleClientSecret, redirectUri);
      
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      const { data } = await oauth2Client.request({ url: "https://www.googleapis.com/oauth2/v2/userinfo" });
      const userInfo = data as any;
      
      if (!userInfo.email) {
        return res.status(400).send("Google account has no email");
      }

      // Check role
      let role: "admin" | "user" = "user";
      if (userInfo.email.toLowerCase() === "coach@mindandbodyresetcoach.com") {
        role = "admin";
      }

      const openId = `google_${userInfo.id}`;
      
      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email,
        loginMethod: "google",
        role,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, role === "admin" ? "/admin" : "/portal");
    } catch (error: any) {
      console.error("[Google OAuth Error]", error);
      res.status(500).send(`Login failed. If you are the admin, please check the server logs. Error details: ${error?.message || error}`);
    }
  });

  // ── Magic Link ──
  app.post("/api/auth/magic-link", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Invalid email" });
      }

      const token = await new SignJWT({ email })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("15m")
        .sign(getMagicLinkSecret());

      const url = `${getBaseUrl(req)}/api/auth/magic-link/verify?token=${token}`;
      
      await resend.emails.send({
        from: "Mind & Body Reset <login@mindandbodyresetcoach.com>",
        to: email,
        subject: "Your Login Link",
        html: `<p>Click here to log in: <a href="${url}">Log In</a></p><p>This link expires in 15 minutes.</p>`,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[Magic Link Send Error]", error);
      res.status(500).json({ error: "Failed to send magic link" });
    }
  });

  app.get("/api/auth/magic-link/verify", async (req: Request, res: Response) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).send("Missing token");
      }

      const { payload } = await jwtVerify(token, getMagicLinkSecret());
      const email = payload.email as string;

      let role: "admin" | "user" = "user";
      if (email.toLowerCase() === "coach@mindandbodyresetcoach.com") {
        role = "admin";
      }

      const openId = `email_${email}`;
      
      await db.upsertUser({
        openId,
        name: email.split("@")[0],
        email,
        loginMethod: "email",
        role,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: email.split("@")[0],
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, role === "admin" ? "/admin" : "/portal");
    } catch (error) {
      console.error("[Magic Link Verify Error]", error);
      res.status(400).send("Invalid or expired magic link. Please request a new one.");
    }
  });
}
