import { NextRequest, NextResponse } from "next/server";
import { processEmailSequences } from "@/server/sequences";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");

  if (secret && auth !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await processEmailSequences();
  return NextResponse.json(result);
}