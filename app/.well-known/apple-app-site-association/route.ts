import { NextResponse } from "next/server";
import { appleAppSiteAssociation } from "@shared/appLinks";

export const dynamic = "force-static";

/** Served at /.well-known/apple-app-site-association with no redirect and no file extension. */
export function GET() {
  return NextResponse.json(appleAppSiteAssociation(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
