import { NextResponse } from "next/server";
import { syncRecentCalendarEvents } from "@/server/googleCalendar";

export async function POST(req: Request) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");

  if (resourceState === "sync") return new NextResponse("OK", { status: 200 });

  console.log(`[GCal Webhook] Notification received: state=${resourceState}, channel=${channelId}`);

  // Run async without awaiting to return 200 OK fast
  syncRecentCalendarEvents().catch(err => console.error("[GCal Webhook] Sync error:", err));

  return new NextResponse("OK", { status: 200 });
}
