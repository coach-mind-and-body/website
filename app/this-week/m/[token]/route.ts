import { NextResponse } from "next/server";
import { applyMemberCookie } from "@/lib/weekly-pairs/auth";
import { memberByToken } from "@/lib/weekly-pairs/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const member = await memberByToken(token);
  const url = new URL(request.url);
  if (!member || !member.active) {
    return NextResponse.redirect(new URL("/this-week", url.origin));
  }
  const res = NextResponse.redirect(new URL("/this-week/me", url.origin));
  applyMemberCookie(res, member.token);
  return res;
}
