import { cronTick } from "@/lib/weekly-pairs/cron";
import { cronSecret } from "@/lib/weekly-pairs/config";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = cronSecret();
  const url = new URL(request.url);
  const given =
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    url.searchParams.get("secret") ||
    "";
  if (!secret || given !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const result = await cronTick();
  return NextResponse.json(result);
}

export const POST = GET;
