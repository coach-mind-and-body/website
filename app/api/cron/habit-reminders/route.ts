import { NextRequest, NextResponse } from "next/server";
import { processHabitReminders } from "@/server/habitReminders";

/**
 * Daily habit push reminders.
 * Schedule (e.g. Railway / external cron) for ~8:00 PM America/Denver:
 *   GET /api/cron/habit-reminders
 *   Authorization: Bearer $CRON_SECRET
 *   (or ?secret=$CRON_SECRET)
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const querySecret = req.nextUrl.searchParams.get("secret");
  const isProd = process.env.NODE_ENV === "production";

  if (isProd) {
    if (!secret) {
      return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
    }
    if (auth !== `Bearer ${secret}` && querySecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (secret && auth !== `Bearer ${secret}` && querySecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const result = await processHabitReminders({ force });
  return NextResponse.json(result);
}
