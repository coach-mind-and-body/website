import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";

const YOUTUBE_RSS = "https://www.youtube.com/feeds/videos.xml?playlist_id=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";
let ytCache: { thumbnail: string; description: string; title: string; url: string; fetchedAt: number } | null = null;

async function fetchLatestYouTubeEpisode() {
  const now = Date.now();
  if (ytCache && now - ytCache.fetchedAt < 30 * 60 * 1000) return ytCache;

  const res = await fetch(YOUTUBE_RSS);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const entry = parsed?.feed?.entry;
  const latest = Array.isArray(entry) ? entry[0] : entry;

  const thumbnail = latest?.["media:group"]?.["media:thumbnail"]?.["$"]?.url ?? "";
  const description = latest?.["media:group"]?.["media:description"] ?? "";
  const title = latest?.title ?? "";
  const url = latest?.link?.["$"]?.href ?? latest?.link ?? "";

  ytCache = { thumbnail, description, title, url, fetchedAt: now };
  return ytCache;
}

export async function GET(req: Request, { params }: { params: Promise<{ action: string }> }) {
  const resolvedParams = await params;
  try {
    const ep = await fetchLatestYouTubeEpisode();
    
    if (resolvedParams.action === 'thumbnail') {
      if (ep.thumbnail) return NextResponse.redirect(ep.thumbnail);
      return new NextResponse("No thumbnail found", { status: 404 });
    }
    if (resolvedParams.action === 'description') {
      return new NextResponse(ep.description || "No description available.", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    if (resolvedParams.action === 'latest') {
      return NextResponse.json(ep);
    }
    
    return new NextResponse("Not found", { status: 404 });
  } catch (err) {
    console.error("[YouTube API] error:", err);
    return new NextResponse("Error fetching YouTube data", { status: 500 });
  }
}
