import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { adminPassword, adminSecret } from "./config";

const ADMIN_COOKIE = "tw_admin";
const MEMBER_COOKIE = "tw_who";

function sign(value: string) {
  return createHmac("sha256", adminSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export async function isAdmin() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token || !adminPassword()) return false;
  return safeEqual(token, sign("ok"));
}

export async function loginAdmin(password: string) {
  const expected = adminPassword();
  if (!expected) return { ok: false, error: "Set WEEKLY_PAIRS_ADMIN_PASSWORD in the server environment first." };
  const a = sign(`pw:${password}`);
  const b = sign(`pw:${expected}`);
  if (!safeEqual(a, b)) return { ok: false, error: "That password doesn't match." };
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sign("ok"), {
    httpOnly: true,
    sameSite: "lax",
    path: "/this-week",
    maxAge: 60 * 60 * 24 * 90,
    secure: process.env.NODE_ENV === "production",
  });
  return { ok: true as const };
}

export async function logoutAdmin() {
  const jar = await cookies();
  jar.delete({ name: ADMIN_COOKIE, path: "/this-week" });
}

export async function getMemberToken() {
  const jar = await cookies();
  return jar.get(MEMBER_COOKIE)?.value ?? null;
}

export async function setMemberToken(token: string) {
  const jar = await cookies();
  jar.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/this-week",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearMemberToken() {
  const jar = await cookies();
  jar.delete({ name: MEMBER_COOKIE, path: "/this-week" });
}

export function applyMemberCookie(res: NextResponse, token: string) {
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/this-week",
    maxAge: 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === "production",
  });
}
