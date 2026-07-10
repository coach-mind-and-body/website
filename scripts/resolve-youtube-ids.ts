import "dotenv/config";

const PLAYLIST_ID = "PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";

async function main() {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
  const xml = await (await fetch(feedUrl)).text();
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = entryRegex.exec(xml)) !== null) {
    const entry = m[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim() ?? "";
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() ?? "";
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() ?? "";
    const desc = entry.match(/<media:description>([^<]*)<\/media:description>/)?.[1]?.trim()?.slice(0, 80) ?? "";
    // verify with oembed
    let oembedTitle = "";
    try {
      const oe = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent("https://www.youtube.com/watch?v=" + videoId)}&format=json`);
      if (oe.ok) {
        const j = await oe.json();
        oembedTitle = j.title;
      }
    } catch {}
    console.log(JSON.stringify({ videoId, rssTitle: title, oembedTitle, published: published.slice(0,10), desc }));
  }
}
main();
