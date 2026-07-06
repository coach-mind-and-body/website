import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


export function middleware(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; maxAge: number; domain?: string }[] = [];
  const now = Date.now();
  const host = request.headers.get("host") ?? "";
  const domain =
    process.env.NODE_ENV === "production" && host.includes("mindandbodyresetcoach.com")
      ? "mindandbodyresetcoach.com"
      : undefined;
  const maxAge = 60 * 60 * 24 * 90; // 90 days

  // Handle _fbp (Facebook Browser ID)
  let fbp = request.cookies.get("_fbp")?.value;
  if (!fbp) {
    const random = Math.floor(Math.random() * 10000000000);
    fbp = `fb.1.${now}.${random}`;
    cookiesToSet.push({ name: "_fbp", value: fbp, maxAge, domain });
  }

  // Handle _fbc (Facebook Click ID)
  const fbclid = request.nextUrl.searchParams.get("fbclid");
  if (fbclid) {
    const fbc = `fb.1.${now}.${fbclid}`;
    cookiesToSet.push({ name: "_fbc", value: fbc, maxAge, domain });
  }
  const response = NextResponse.next();

  for (const cookie of cookiesToSet) {
    response.cookies.set(cookie.name, cookie.value, {
      maxAge: cookie.maxAge,
      domain: cookie.domain || undefined,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
