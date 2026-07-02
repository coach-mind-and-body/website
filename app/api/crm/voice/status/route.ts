import { NextRequest, NextResponse } from "next/server";
import { parseTwilioFormData } from "@/server/twilio/parseBody";
import { handleVoiceStatus } from "@/server/crm/voiceHandlers";

export async function POST(req: NextRequest) {
  try {
    const formData = await parseTwilioFormData(req);
    
    // Add parentCallSid from query params
    const parentCallSid = req.nextUrl.searchParams.get("parentCallSid");
    if (parentCallSid) {
      formData.parentCallSid = parentCallSid;
    }

    // Execute in background
    handleVoiceStatus(formData).catch(console.error);

    // Return 200 immediately
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("[Voice Status Error]:", err);
    return new NextResponse("Error", { status: 500 });
  }
}
