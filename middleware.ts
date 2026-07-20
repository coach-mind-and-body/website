import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const url = request.nextUrl.clone();

  // ── SEO: kill legacy GoDaddy / old-platform crawl junk (GSC "Crawled - not indexed") ──
  // Old category filters served the homepage at 200 with only a query param — thin duplicates.
  if (url.searchParams.has("blogcategory")) {
    url.pathname = "/health-wellness-blog";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }
  // Old Atom feed → current RSS
  if (path === "/f.atom" || path === "/atom.xml" || path === "/feed") {
    url.pathname = "/feed.xml";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // Don't set marketing cookies for crawlers or pure SEO assets — keeps
  // responses cache-friendly and avoids Set-Cookie on every Googlebot hit.
  const ua = request.headers.get("user-agent") ?? "";
  const isBot =
    /bot|crawl|spider|slurp|facebookexternalhit|bingpreview|google-inspectiontool/i.test(
      ua
    );
  const isSeoAsset =
    path === "/robots.txt" ||
    path === "/sitemap.xml" ||
    path === "/feed.xml" ||
    path === "/llms.txt";

  if (isBot || isSeoAsset) {
    return NextResponse.next();
  }

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
