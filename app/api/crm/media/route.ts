import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const mediaUrl = req.nextUrl.searchParams.get("url");
  if (!mediaUrl) return new NextResponse("Missing URL parameter", { status: 400 });

  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      return new NextResponse("Twilio credentials missing", { status: 500 });
    }

    const authHeader = 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64');
    
    // Fetch directly using the web platform API available in Next.js
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (!response.ok) {
      throw new Error(`Twilio returned ${response.status}`);
    }

    // Force inline rendering so browsers can play videos and show PDFs natively
    const headers = new Headers(response.headers);
    if (headers.has('content-disposition')) {
      const cd = headers.get('content-disposition') || '';
      headers.set('content-disposition', cd.replace('attachment', 'inline'));
    }

    return new NextResponse(response.body, {
      status: response.status,
      headers
    });
  } catch (error) {
    console.error("Media proxy error:", error);
    return new NextResponse("Failed to proxy media", { status: 500 });
  }
}
