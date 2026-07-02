import { NextRequest, NextResponse } from "next/server";
import { parseTwilioFormData } from "@/server/twilio/parseBody";
import { handleMessagingStatus } from "@/server/crm/smsHandlers";

export async function POST(req: NextRequest) {
  try {
    const formData = await parseTwilioFormData(req);
    await handleMessagingStatus(formData);
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[Messaging Status Error]:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
