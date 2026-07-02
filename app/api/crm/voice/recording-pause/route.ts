import { NextRequest, NextResponse } from "next/server";
import { handleVoiceRecordingPause } from "@/server/crm/voiceHandlers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await handleVoiceRecordingPause(body);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.error === "Not configured" ? 503 : 500 });
    }
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Voice Recording Pause Error]:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
