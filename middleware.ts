import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildPlainDataFromUrl,
  processRequestAndGetCookies,
} from "@/server/metaParamBuilder";

export function middleware(request: NextRequest) {
  const cookies: Record<string, string> = {};
  request.cookies.getAll().forEach((cookie) => {
    cookies[cookie.name] = cookie.value;
  });

  const plainData = buildPlainDataFromUrl(
    request.nextUrl.host,
    request.nextUrl.pathname,
    request.nextUrl.search,
    cookies,
    {
      referer: request.headers.get("referer"),
      xForwardedFor: request.headers.get("x-forwarded-for"),
      protocol: request.nextUrl.protocol,
    }
  );

  const cookiesToSet = processRequestAndGetCookies(plainData);
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
