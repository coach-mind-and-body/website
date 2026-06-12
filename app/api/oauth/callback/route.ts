import { NextResponse } from "next/server";
import * as db from "../../../../server/db";
import { sdk } from "../../../../server/_core/sdk";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ENV } from "../../../../server/_core/env";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ error: "code and state are required" }, { status: 400 });
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      return NextResponse.json({ error: "openId missing from user info" }, { status: 400 });
    }

    console.log("[OAuth] User logging in:", { email: userInfo.email, openId: userInfo.openId, name: userInfo.name });

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    console.log("[OAuth] User upserted successfully");

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
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

    const postLoginUrl = "https://mindandbodyresetcoach.com/admin";
    console.log("[OAuth] Redirecting to:", postLoginUrl);
    return NextResponse.redirect(postLoginUrl);
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    return NextResponse.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}
