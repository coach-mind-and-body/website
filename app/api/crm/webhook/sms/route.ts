import { NextRequest, NextResponse } from "next/server";
import { parseTwilioFormData } from "@/server/twilio/parseBody";
import { handleInboundSms } from "@/server/crm/smsHandlers";

export async function POST(req: NextRequest) {
  try {
    const formData = await parseTwilioFormData(req);
    const xml = await handleInboundSms(formData);
    return new NextResponse(xml, { 
      headers: { "Content-Type": "text/xml; charset=utf-8" } 
    });
  } catch (err: any) {
    console.error("[SMS Webhook Error]:", err);
    return new NextResponse("<Response></Response>", { 
      status: 500, 
      headers: { "Content-Type": "text/xml; charset=utf-8" } 
    });
  }
}
