/**
 * Branded HTML shell for admin-composed newsletters.
 * Matches existing marketing emails (logo bar, soft hero, Nunito Sans, gold CTA).
 * Footer/unsubscribe injected by sendMarketingEmail via <!--UNSUB_FOOTER-->.
 */
import { ENV } from "../_core/env";
import { BRAND, SITE_URL } from "@shared/brand";
import { escapeHtml } from "../../lib/htmlEscape";

const base = (ENV.appPublicUrl || SITE_URL).replace(/\/$/, "");
const LOGO = `${base}/logo-wide.jpg`;

export const DEFAULT_GREETING = "Hi {{firstName}},";
export const DEFAULT_SIGN_OFF_CLOSING = "With love,";
export const DEFAULT_SIGN_OFF_NAME = BRAND.coachName;
export const DEFAULT_SIGN_OFF_TITLE = `Certified Life & Health Coach · ${BRAND.name}`;

const shell = {
  wrap: `font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);`,
  logoBar: `background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;`,
  hero: `background:linear-gradient(135deg,#fbeee9 0%,#f5dcd3 100%);padding:28px 30px;text-align:center;`,
  h1: `margin:0 0 8px;color:#5a3e28;font-size:22px;font-weight:700;line-height:1.3;`,
  sub: `margin:0;color:#8a7060;font-size:15px;line-height:1.45;`,
  body: `padding:32px 36px 8px;color:#4a4a4a;font-size:16px;line-height:1.65;`,
  cta: `display:inline-block;background:#c9a96e;color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;`,
  contentStyles: `
    .nl-content p { margin:0 0 16px; color:#4a4a4a; font-size:16px; line-height:1.65; }
    .nl-content h1, .nl-content h2, .nl-content h3 { color:#5a3e28; font-weight:700; line-height:1.3; margin:24px 0 12px; }
    .nl-content h1 { font-size:22px; }
    .nl-content h2 { font-size:20px; border-bottom:2px solid #e8ddd0; padding-bottom:8px; }
    .nl-content h3 { font-size:18px; }
    .nl-content a { color:#c9a96e; font-weight:700; text-decoration:underline; }
    .nl-content ul, .nl-content ol { margin:8px 0 16px; padding-left:22px; line-height:1.75; }
    .nl-content li { margin-bottom:6px; }
    .nl-content img { max-width:100% !important; height:auto !important; border-radius:10px; display:block; margin:16px auto; }
    .nl-content blockquote { background:#f9f5f0; border-left:4px solid #c9a96e; padding:14px 18px; margin:20px 0; border-radius:0 10px 10px 0; color:#5a3e28; }
    .nl-content hr { border:none; border-top:1px solid #f0e8e4; margin:24px 0; }
    .nl-content table { width:100%; border-collapse:collapse; margin:16px 0; }
    .nl-content th, .nl-content td { border:1px solid #e8ddd0; padding:8px 10px; text-align:left; font-size:14px; }
    .nl-content th { background:#f9f5f0; color:#5a3e28; }
    .nl-content iframe, .nl-content video { max-width:100%; }
  `,
};

export type NewsletterShellInput = {
  firstName?: string;
  previewText?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  /** e.g. "Hi {{firstName}}," or "Hello friend," — empty string hides greeting */
  greetingTemplate?: string | null;
  signOffClosing?: string | null;
  signOffName?: string | null;
  signOffTitle?: string | null;
  bodyHtml: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  previewMode?: boolean;
};

function youtubeIdFromUrl(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
  );
  return m?.[1] ?? null;
}

export function prepareBodyHtmlForEmail(html: string): string {
  if (!html) return "";
  let out = html;

  out = out.replace(
    /<div[^>]*data-youtube-video[^>]*>[\s\S]*?<iframe[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/iframe>[\s\S]*?<\/div>/gi,
    (_full, src: string) => youtubeThumbnailBlock(src)
  );

  out = out.replace(
    /<iframe[^>]+src=["']([^"']*youtube[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (_full, src: string) => youtubeThumbnailBlock(src)
  );

  out = out.replace(
    /<iframe[^>]+src=["']([^"']*instagram\.com[^"']*)["'][^>]*>[\s\S]*?<\/iframe>/gi,
    (_full, src: string) => {
      const safe = escapeHtml(src);
      return `<div style="text-align:center;margin:20px 0;padding:20px;background:#f9f5f0;border-radius:12px;border:1px solid #f0e8e4;">
        <p style="margin:0 0 10px;color:#5a3e28;font-weight:700;">View on Instagram</p>
        <a href="${safe}" style="display:inline-block;background:#c9a96e;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-weight:700;">Open post →</a>
      </div>`;
    }
  );

  out = out.replace(/<img\b([^>]*)>/gi, (_full, attrs: string) => {
    if (/style\s*=/i.test(attrs)) {
      if (!/max-width/i.test(attrs)) {
        attrs = attrs.replace(
          /style\s*=\s*(["'])(.*?)\1/i,
          (_m, q: string, style: string) =>
            `style=${q}${style};max-width:100%;height:auto;border-radius:10px;${q}`
        );
      }
    } else {
      attrs += ` style="max-width:100%;height:auto;border-radius:10px;display:block;margin:16px auto;"`;
    }
    return `<img${attrs}>`;
  });

  return out;
}

function youtubeThumbnailBlock(src: string): string {
  const id = youtubeIdFromUrl(src);
  if (!id) {
    const safe = escapeHtml(src);
    return `<p style="text-align:center;"><a href="${safe}" style="color:#c9a96e;font-weight:700;">Watch video →</a></p>`;
  }
  const watch = `https://www.youtube.com/watch?v=${id}`;
  const thumb = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return `
    <div style="text-align:center;margin:24px 0;">
      <a href="${watch}" target="_blank" rel="noopener noreferrer" style="display:inline-block;position:relative;text-decoration:none;">
        <img src="${thumb}" alt="Watch video on YouTube" width="560" style="max-width:100%;height:auto;border-radius:12px;display:block;" />
        <span style="display:inline-block;margin-top:10px;background:#c9a96e;color:#fff;padding:10px 22px;border-radius:9999px;font-weight:700;font-size:14px;">▶ Watch video</span>
      </a>
    </div>`;
}

function logoHeader(): string {
  return `
    <div style="${shell.logoBar}">
      <img src="${LOGO}" alt="${escapeHtml(BRAND.name)}" style="max-width:180px;height:auto;" />
    </div>`;
}

function buildSignOff(input: NewsletterShellInput): string {
  const closing = (input.signOffClosing ?? DEFAULT_SIGN_OFF_CLOSING).trim();
  const name = (input.signOffName ?? DEFAULT_SIGN_OFF_NAME).trim();
  const title = (input.signOffTitle ?? DEFAULT_SIGN_OFF_TITLE).trim();
  if (!closing && !name && !title) return "";
  return `
    <p style="margin-top:28px;margin-bottom:8px;">
      ${closing ? `${escapeHtml(closing)}<br/>` : ""}
      ${name ? `<strong>${escapeHtml(name)}</strong>` : ""}
      ${name && title ? `<br/>` : ""}
      ${title ? `<span style="color:#8a9a8a;font-size:13px;">${escapeHtml(title)}</span>` : ""}
    </p>`;
}

function ctaBlock(label: string, href: string): string {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${escapeHtml(href)}" style="${shell.cta}">${escapeHtml(label)}</a>
    </div>`;
}

export function personalizeNewsletterHtml(html: string, firstName: string): string {
  const name = escapeHtml(firstName.trim() || "friend");
  return html
    .replace(/\{\{\s*firstName\s*\}\}/gi, name)
    .replace(/\{\{\s*name\s*\}\}/gi, name);
}

export function personalizeNewsletterText(text: string, firstName: string): string {
  const name = (firstName.trim() || "friend").replace(/[\r\n]/g, "");
  return text
    .replace(/\{\{\s*firstName\s*\}\}/gi, name)
    .replace(/\{\{\s*name\s*\}\}/gi, name);
}

/**
 * Wrap editor body HTML in the branded newsletter shell.
 */
export function buildNewsletterHtml(input: NewsletterShellInput): string {
  const firstName =
    input.firstName?.trim() || (input.previewMode ? "there" : "friend");
  const prepared = prepareBodyHtmlForEmail(input.bodyHtml);
  const body = personalizeNewsletterHtml(prepared, firstName);

  const greetingRaw =
    input.greetingTemplate === null || input.greetingTemplate === undefined
      ? DEFAULT_GREETING
      : input.greetingTemplate;
  const greetingHtml = (() => {
    if (!greetingRaw.trim()) return "";
    const withName = personalizeNewsletterText(greetingRaw.trim(), firstName);
    return `<p>${escapeHtml(withName)}</p>`;
  })();

  const hasHero = !!(input.headline && input.headline.trim());
  const hero = hasHero
    ? `
      <div style="${shell.hero}">
        <h1 style="${shell.h1}">${escapeHtml(input.headline!.trim())}</h1>
        ${
          input.subheadline?.trim()
            ? `<p style="${shell.sub}">${escapeHtml(input.subheadline.trim())}</p>`
            : ""
        }
      </div>`
    : "";

  const cta =
    input.ctaLabel?.trim() && input.ctaUrl?.trim()
      ? ctaBlock(input.ctaLabel.trim(), input.ctaUrl.trim())
      : "";

  const preheader = input.previewText?.trim()
    ? `<div style="display:none;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(input.previewText.trim())}</div>`
    : "";

  return `${preheader}
    <div style="${shell.wrap}">
      <style>${shell.contentStyles}</style>
      ${logoHeader()}
      ${hero}
      <div style="${shell.body}" class="nl-content">
        ${greetingHtml}
        ${body}
        ${cta}
        ${buildSignOff(input)}
      </div>
      <!--UNSUB_FOOTER-->
    </div>`;
}

export function buildNewsletterPreviewDocument(input: NewsletterShellInput): string {
  const inner = buildNewsletterHtml({ ...input, previewMode: true });
  const withFooter = inner.replace(
    "<!--UNSUB_FOOTER-->",
    `<div style="padding:28px 40px 36px;border-top:1px solid #f0e8e4;text-align:center;">
      <p style="margin:0 0 10px;color:#8a9a8a;font-size:12px;line-height:1.5;">
        You're receiving this because you joined our email list at mindandbodyresetcoach.com.
      </p>
      <p style="margin:0;color:#8a9a8a;font-size:12px;">
        <span style="text-decoration:underline;color:#8a7060;">Unsubscribe</span>
        &nbsp;·&nbsp;
        <span style="text-decoration:underline;color:#8a7060;">Privacy</span>
      </p>
      <p style="margin:12px 0 0;color:#b0b8b0;font-size:11px;">
        Mind &amp; Body Reset Coaches · mindandbodyresetcoach.com
      </p>
    </div>`
  );

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>body{margin:0;padding:16px;background:#f5f0eb;}</style>
</head><body>${withFooter}</body></html>`;
}
