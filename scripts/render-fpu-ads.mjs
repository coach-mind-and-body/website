/**
 * Render FPU Fall 2026 HTML ad creatives to PNGs for Meta upload.
 */
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const htmlPath = path.join(root, "content", "marketing", "fpu-fall-2026-ads.html");
const logoPath = path.join(root, "public", "logo-circular.png");
const outDir = path.join(root, "content", "marketing", "fpu-ads");

const shots = [
  { id: "ad-sq-hero", file: "fpu-ad-square-hero.png" },
  { id: "ad-sq-story", file: "fpu-ad-square-story.png" },
  { id: "ad-story", file: "fpu-ad-story-9x16.png" },
];

async function main() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Inject absolute logo path so file:// render works
  let html = fs.readFileSync(htmlPath, "utf8");
  const logoUrl = "file:///" + logoPath.replace(/\\/g, "/");
  html = html.replaceAll("../../public/logo-circular.png", logoUrl);
  const tmpHtml = path.join(outDir, "_render-temp.html");
  fs.writeFileSync(tmpHtml, html, "utf8");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 2400, deviceScaleFactor: 1 });
  const fileUrl = "file:///" + tmpHtml.replace(/\\/g, "/");
  await page.goto(fileUrl, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 800));

  for (const s of shots) {
    const el = await page.$(`#${s.id}`);
    if (!el) throw new Error(`Missing #${s.id}`);
    const box = await el.boundingBox();
    if (!box) throw new Error(`No box for #${s.id}`);
    console.log(s.id, "box", box.width, "x", box.height, "at", box.x, box.y);
    await el.screenshot({
      path: path.join(outDir, s.file),
      type: "png",
      omitBackground: false,
    });
    console.log("Wrote", s.file);
  }
  await browser.close();
  fs.unlinkSync(tmpHtml);
  console.log("Done →", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
