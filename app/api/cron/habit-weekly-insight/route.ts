import { NextRequest, NextResponse } from "next/server";
import { processWeeklyInsightEmails } from "@/server/habitWeeklyInsightEmail";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const q = req.nextUrl.searchParams.get("secret");
  const force = req.nextUrl.searchParams.get("force") === "1";

  if (process.env.NODE_ENV === "production") {
    if (!secret || (auth !== `Bearer ${secret}` && q !== secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processWeeklyInsightEmails({ force });
  return NextResponse.json(result);
}
