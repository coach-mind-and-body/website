import { NextRequest, NextResponse } from "next/server";
import { parseTwilioFormData } from "@/server/twilio/parseBody";
import { handleVoiceRespond } from "@/server/crm/voiceHandlers";

export async function POST(req: NextRequest) {
  try {
    const formData = await parseTwilioFormData(req);
    const xml = await handleVoiceRespond(formData);
    return new NextResponse(xml, { 
      headers: { "Content-Type": "text/xml; charset=utf-8" } 
    });
  } catch (err: any) {
    console.error("[Voice Route Error]:", err);
    return new NextResponse("<Response><Say>An application error occurred.</Say></Response>", { 
      status: 500, 
      headers: { "Content-Type": "text/xml; charset=utf-8" } 
    });
  }
}
