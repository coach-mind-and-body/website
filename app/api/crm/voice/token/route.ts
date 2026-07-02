import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

export async function GET(req: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY || process.env.TWILIO_API_KEY_SID;
  const apiSecret = process.env.TWILIO_API_SECRET || process.env.TWILIO_API_KEY_SECRET;
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

  if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
    console.warn("[Voice Token] Missing Twilio credentials — browser calling not yet configured");
    return NextResponse.json({ error: "Voice calling not yet configured", configured: false });
  }

  try {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    // Unified identity: 'crm-agent' (combining 'carter-admin' from voice.ts and 'crm-agent' from crm.ts)
    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: "crm-agent",
      ttl: 3600, // 1 hour
    });
    
    token.addGrant(voiceGrant);
    
    return NextResponse.json({ token: token.toJwt(), configured: true });
  } catch (error: any) {
    console.error("Twilio Voice Token Error:", error);
    return NextResponse.json({ error: "Failed to generate voice token" }, { status: 500 });
  }
}
