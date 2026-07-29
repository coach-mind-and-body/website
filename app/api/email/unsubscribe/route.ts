import { NextResponse } from "next/server";
import {
  markEmailOptedOut,
  verifyUnsubscribeToken,
} from "@/server/emailMarketing";

function htmlPage(title: string, body: string, ok: boolean) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: 'Nunito Sans', system-ui, sans-serif; background: #fdfbf7; color: #4a4a4a; margin: 0; padding: 40px 20px; }
    .card { max-width: 440px; margin: 40px auto; background: #fff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center; }
    h1 { font-size: 1.35rem; color: #3a5a3a; margin: 0 0 12px; }
    p { font-size: 15px; line-height: 1.55; margin: 0 0 16px; }
    a { color: #c9a96e; font-weight: 600; }
    .badge { display: inline-block; width: 48px; height: 48px; border-radius: 50%; line-height: 48px; font-size: 22px; margin-bottom: 16px; background: ${ok ? "#e8f5e9" : "#fce8e6"}; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${ok ? "✓" : "!"}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <p><a href="https://mindandbodyresetcoach.com">Back to the website</a></p>
  </div>
</body>
</html>`;
}

async function handleToken(token: string | null): Promise<{ ok: boolean; title: string; body: string }> {
  if (!token) {
    return {
      ok: false,
      title: "Missing link",
      body: "This unsubscribe link is incomplete. Use the Unsubscribe link in a recent email from us.",
    };
  }
  const verified = verifyUnsubscribeToken(token);
  if ("error" in verified) {
    return { ok: false, title: "Link not valid", body: verified.error };
  }
  const result = await markEmailOptedOut(verified.email);
  return {
    ok: result.success,
    title: result.success ? "You're unsubscribed" : "Something went wrong",
    body: result.message,
  };
}

/** One-click unsubscribe (Gmail/Yahoo RFC 8058) + browser GET confirmation page. */
export async function POST(req: Request) {
  const url = new URL(req.url);
  let token = url.searchParams.get("token");
  if (!token) {
    try {
      const form = await req.formData();
      const listUnsub = form.get("List-Unsubscribe");
      if (typeof listUnsub === "string" && listUnsub.includes("token=")) {
        token = new URL(listUnsub.replace(/^<|>$/g, "")).searchParams.get("token");
      }
    } catch {
      // empty body is fine
    }
  }
  // RFC 8058: POST to same URL as List-Unsubscribe; token stays on query string
  if (!token) token = url.searchParams.get("token");
  const result = await handleToken(token);
  if (!result.ok) {
    return new NextResponse(null, { status: 400 });
  }
  return new NextResponse(null, { status: 200 });
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  const result = await handleToken(token);
  return new NextResponse(htmlPage(result.title, result.body, result.ok), {
    status: result.ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
