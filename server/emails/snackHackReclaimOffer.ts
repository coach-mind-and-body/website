/**
 * Snack Hack list → R.E.C.L.A.I.M. offer (2 emails).
 * Brand-safe, high-trust, clear conversion path.
 * Footer/unsubscribe injected by sendMarketingEmail via <!--UNSUB_FOOTER-->.
 */
import { ENV } from "../_core/env";
import { BRAND, PROGRAM, SITE_URL } from "@shared/brand";

const base = (ENV.appPublicUrl || SITE_URL).replace(/\/$/, "");
const LOGO = `${base}/logo-wide.jpg`;
const CTA_JOIN = `${base}/reclaim-invite`;
const CTA_DETAILS = `${base}/reclaim`;

const shell = {
  wrap: `font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);`,
  logoBar: `background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;`,
  hero: `background:linear-gradient(135deg,#fbeee9 0%,#f5dcd3 100%);padding:28px 30px;text-align:center;`,
  h1: `margin:0 0 8px;color:#5a3e28;font-size:22px;font-weight:700;line-height:1.3;`,
  sub: `margin:0;color:#8a7060;font-size:15px;line-height:1.45;`,
  body: `padding:32px 36px 8px;color:#4a4a4a;font-size:16px;line-height:1.65;`,
  cta: `display:inline-block;background:#c9a96e;color:#ffffff;padding:14px 32px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;`,
  box: `background:#f9f5f0;border-left:4px solid #c9a96e;padding:18px 20px;margin:24px 0;border-radius:0 10px 10px 0;`,
  price: `background:#f4f8f4;border:1px solid #d4e4d4;border-radius:12px;padding:20px 22px;margin:24px 0;text-align:center;`,
};

function logoHeader() {
  return `
    <div style="${shell.logoBar}">
      <img src="${LOGO}" alt="${BRAND.name}" style="max-width:180px;height:auto;" />
    </div>`;
}

function signOff() {
  return `
    <p style="margin-top:28px;margin-bottom:8px;">With love,<br/>
    <strong>${BRAND.coachName}</strong><br/>
    <span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach · ${BRAND.name}</span></p>`;
}

function ctaBlock(label: string, href: string = CTA_JOIN) {
  return `
    <div style="text-align:center;margin:28px 0;">
      <a href="${href}" style="${shell.cta}">${label}</a>
    </div>`;
}

/**
 * Email 1 — honor the free tool, name the natural next step, invite to RECLAIM.
 */
export function getSnackHackReclaimOfferEmail1(firstName: string) {
  const name = firstName?.trim() || "friend";
  return {
    subject: `${name}, a gentle next step if evenings still feel hard`,
    preview: "The Snack Hack was a real start. Here's support if you want more.",
    html: `
    <div style="${shell.wrap}">
      ${logoHeader()}
      <div style="${shell.hero}">
        <h1 style="${shell.h1}">You already took a brave first step</h1>
        <p style="${shell.sub}">A short note for women using the Snack Hack</p>
      </div>
      <div style="${shell.body}">
        <p>Hi ${name},</p>
        <p>You downloaded <em>The Midlife Mindset Snack Hack</em> because evenings — the quiet, the fridge, the “just this once” — deserved a better plan than willpower alone.</p>
        <p><strong>That guide is a real tool.</strong> If you’ve used it even once and felt a little more in control, that’s worth celebrating. One paused evening is proof your system can learn something new.</p>
        <p>What I also hear from women every week is this:</p>
        <div style="${shell.box}">
          <p style="margin:0;color:#5a3e28;font-size:15px;line-height:1.6;">
            “The hack helps… and I still want someone in my corner when the hard nights stack up.”
          </p>
        </div>
        <p>That’s not failure. That’s wisdom. A guide can teach the pause. <strong>Private coaching</strong> helps you rewire the patterns underneath — daytime habits, midlife stress, food noise, and the story you tell yourself at 9pm.</p>
        <p>That’s why I created <strong>${PROGRAM.name}</strong> — the ${PROGRAM.fullName}: six private sessions designed for women in this season of life who want structure, accountability, and a plan that fits <em>their</em> body and schedule.</p>
        <p style="margin:0 0 4px;font-weight:700;color:#5a3e28;">Inside R.E.C.L.A.I.M. we work on:</p>
        <ul style="margin:8px 0 0;padding-left:20px;line-height:1.75;color:#4a4a4a;">
          <li>Quieting food noise with tools you can actually use</li>
          <li>Habits and evenings that feel calmer, not stricter</li>
          <li>Midlife-aware support (hormones, energy, identity — not another crash plan)</li>
          <li>Real accountability between sessions so you don’t carry it alone</li>
        </ul>
        ${ctaBlock("Explore R.E.C.L.A.I.M.")}
        <p style="text-align:center;margin:0 0 8px;font-size:14px;color:#6a6a6a;">
          Or read the full program details first:
          <a href="${CTA_DETAILS}" style="color:#c9a96e;font-weight:700;">mindandbodyresetcoach.com/reclaim</a>
        </p>
        <p>If you’re not ready, keep using the Snack Hack. You’re still welcome here. And if a question is sitting on your heart, you can simply reply to this email — I read them.</p>
        ${signOff()}
        <p style="margin-top:20px;padding-top:16px;border-top:1px solid #f0e8e4;font-size:14px;color:#6a6a6a;line-height:1.55;">
          <strong style="color:#5a3e28;">P.S.</strong> You don’t have to choose between “free tips forever” and “figure it out alone.” R.E.C.L.A.I.M. is the supported middle path — 6 weeks, 1:1, clear next steps.
          ${ctaBlock("See if R.E.C.L.A.I.M. is a fit")}
        </p>
      </div>
      <!--UNSUB_FOOTER-->
    </div>`,
  };
}

/**
 * Email 2 — clear invitation: offer, investment, deposit, join CTA.
 */
export function getSnackHackReclaimOfferEmail2(firstName: string) {
  const name = firstName?.trim() || "friend";
  return {
    subject: `When you're ready: R.E.C.L.A.I.M. (${PROGRAM.depositPrice ? `from $${PROGRAM.depositPrice}` : `$${PROGRAM.fullPrice}`})`,
    preview: `$${PROGRAM.fullPrice} full · or $${PROGRAM.depositPrice} to hold your seat · 6 private sessions`,
    html: `
    <div style="${shell.wrap}">
      ${logoHeader()}
      <div style="${shell.hero}">
        <h1 style="${shell.h1}">${name}, if you want support beyond the guide</h1>
        <p style="${shell.sub}">A clear invitation — no pressure, no games</p>
      </div>
      <div style="${shell.body}">
        <p>Hi ${name},</p>
        <p>I wrote a few days ago about the Snack Hack and the women who want a little more than a PDF in their corner.</p>
        <p>This is the simple version of the next step — so you can decide with a clear head.</p>

        <p style="margin:0 0 6px;font-weight:700;color:#5a3e28;font-size:17px;">What R.E.C.L.A.I.M. is</p>
        <p style="margin-top:0;">A <strong>6-week, 1:1 coaching program</strong> with me for midlife women who want calmer evenings, quieter food noise, and habits that stick — without another extreme plan.</p>

        <div style="${shell.box}">
          <p style="margin:0 0 10px;font-weight:700;color:#5a3e28;">What you receive</p>
          <ul style="margin:0;padding-left:18px;line-height:1.7;color:#4a4a4a;">
            <li><strong>${PROGRAM.sessionCount} private sessions</strong> (${PROGRAM.sessionDurationMins} minutes each)</li>
            <li>Week-by-week focus so you’re never guessing what to work on</li>
            <li>Support for food noise, habits, energy, and the midlife body</li>
            <li>Accountability between sessions + client tools in your hub</li>
          </ul>
        </div>

        <div style="${shell.price}">
          <p style="margin:0 0 8px;font-size:14px;color:#6a6a6a;text-transform:uppercase;letter-spacing:0.04em;font-weight:700;">Investment</p>
          <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#3a5a3a;">$${PROGRAM.fullPrice} paid in full</p>
          <p style="margin:0;font-size:16px;color:#5a3e28;">or <strong>$${PROGRAM.depositPrice}</strong> to secure your spot<br/>
          <span style="font-size:13px;color:#6a6a6a;">(balance of $${PROGRAM.balancePrice} before Session 1)</span></p>
        </div>

        ${ctaBlock("Join R.E.C.L.A.I.M. — choose full or deposit")}

        <p style="text-align:center;font-size:14px;color:#6a6a6a;margin:0 0 20px;">
          Prefer to read first?
          <a href="${CTA_DETAILS}" style="color:#c9a96e;font-weight:700;">Full program details</a>
        </p>

        <p style="margin:0 0 6px;font-weight:700;color:#5a3e28;">This is a beautiful fit if…</p>
        <ul style="margin:0 0 16px;padding-left:20px;line-height:1.7;">
          <li>Nights are harder than days, and you’re tired of white-knuckling</li>
          <li>You’ve collected tips — and you’re ready for guided practice</li>
          <li>You want private support, not a giant group challenge</li>
        </ul>

        <p style="margin:0 0 6px;font-weight:700;color:#5a3e28;">It’s okay to wait if…</p>
        <ul style="margin:0 0 8px;padding-left:20px;line-height:1.7;">
          <li>You want to keep practicing with the Snack Hack for now</li>
          <li>The timing truly isn’t right (health, family, capacity)</li>
        </ul>
        <p>Either way, you belong here. The door to R.E.C.L.A.I.M. stays clear when you’re ready.</p>

        ${ctaBlock("Yes — I’m ready to join")}

        <p style="font-size:14px;color:#6a6a6a;">I keep this program 1:1 on purpose, so each seat is real time on my calendar. When you enroll, we begin the work together — not a replay, not a funnel.</p>

        ${signOff()}
        <p style="margin-top:20px;padding-top:16px;border-top:1px solid #f0e8e4;font-size:14px;color:#6a6a6a;line-height:1.55;">
          <strong style="color:#5a3e28;">P.S.</strong> The Snack Hack was never “less than.” It was the start. R.E.C.L.A.I.M. is for the season when you want a partner for the deeper reset —
          <a href="${CTA_JOIN}" style="color:#c9a96e;font-weight:700;">secure your spot here</a> (full pay or $${PROGRAM.depositPrice} deposit).
        </p>
      </div>
      <!--UNSUB_FOOTER-->
    </div>`,
  };
}

export const SNACK_HACK_RECLAIM_OFFER_EMAILS = [
  getSnackHackReclaimOfferEmail1,
  getSnackHackReclaimOfferEmail2,
] as const;

/** Days after *campaign start* (or enrollment) for each email */
export const SNACK_HACK_RECLAIM_OFFER_DAY_OFFSETS = [0, 3] as const;

export const SNACK_HACK_RECLAIM_OFFER_SEQUENCE_ID = "snack_hack_reclaim_offer";
