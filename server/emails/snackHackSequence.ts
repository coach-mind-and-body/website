import { ENV } from "../_core/env";
import { BRAND, GOOGLE_CALENDAR } from "@shared/brand";

const baseStyle = `font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);`;
const headerStyle = `background:linear-gradient(135deg,#fbeee9 0%,#f5dcd3 100%);padding:30px;text-align:center;`;
const contentStyle = `padding:36px 40px;color:#4a4a4a;font-size:16px;line-height:1.6;`;
const h1Style = `margin:0 0 8px;color:#8a7060;font-size:24px;font-weight:700;`;
const ctaStyle = `display:inline-block;background:#c9a96e;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;`;

/** Day 3 follow-up — sent 3 days after signup (welcome email is sent immediately on signup). */
export const getSnackHackDay3Email = (firstName: string) => ({
  subject: "Did you try the Snack Hack yet?",
  html: `
    <div style="${baseStyle}">
      <div style="background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;">
        <img src="${ENV.appPublicUrl}/logo-wide.jpg" alt="${BRAND.name}" style="max-width:180px;height:auto;" />
      </div>
      <div style="${headerStyle}">
        <h1 style="${h1Style}">A quick check-in, ${firstName}</h1>
        <p style="margin:0;color:#8a7060;font-size:15px;">How's your first week going?</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>It's been a few days since you downloaded <em>The Midlife Mindset Snack Hack</em> — I wanted to check in.</p>
        <p>Most women tell me the hardest part isn't <em>knowing</em> what to do… it's remembering to do it when 9pm hits and the fridge starts calling your name.</p>
        <p>If you haven't opened the guide yet, here's your link again:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${ENV.appPublicUrl}/late-night-snack-hack.pdf" style="${ctaStyle}">Open the Snack Hack Guide</a>
        </div>
        <p>And if you <em>have</em> tried it — even once — that's a win. Small shifts compound. One evening where you pause instead of panic-eat is proof your nervous system can learn a new pattern.</p>
        <p>Have you started tracking your habits yet? It takes 30 seconds a day and makes the invisible visible:</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${ENV.appPublicUrl}/habit-tracker" style="color:#c9a96e;font-weight:700;text-decoration:underline;">Open Your Free Habit Tracker</a>
        </p>
        <p>Reply to this email and tell me — what's the hardest part of your evenings right now? I read every message.</p>
        <p style="margin-top:32px;">With love,<br/><strong>${BRAND.coachName}</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | ${BRAND.name}</span></p>
      </div>
    </div>
  `,
});

/** Day 7 follow-up — book a discovery call. */
export const getSnackHackDay7Email = (firstName: string) => ({
  subject: "Ready for real accountability? Let's chat",
  html: `
    <div style="${baseStyle}">
      <div style="background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;">
        <img src="${ENV.appPublicUrl}/logo-wide.jpg" alt="${BRAND.name}" style="max-width:180px;height:auto;" />
      </div>
      <div style="${headerStyle}">
        <h1 style="${h1Style}">${firstName}, you don't have to do this alone</h1>
        <p style="margin:0;color:#8a7060;font-size:15px;">A free 30-minute conversation — no pressure</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>You've had the Snack Hack guide for about a week now. If you're still wrestling with evening cravings, food noise, or that voice that says <em>"just this once"</em> — please hear me: this is not a willpower problem.</p>
        <p>It's a pattern your body learned to cope with stress, hormones, and the sheer exhaustion of midlife. A PDF can start the shift. But real, lasting change usually needs a person in your corner.</p>
        <p>I'd love to offer you a <strong>free 30-minute discovery call</strong>. We'll talk about what's really going on for you — not a sales pitch, just an honest conversation about whether 1-on-1 coaching could help.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${GOOGLE_CALENDAR.discoveryCall}" style="${ctaStyle}">Book Your Free Call</a>
        </div>
        <p>Not ready for a call? That's okay too. Keep using the guide and habit tracker — and know that when you <em>are</em> ready, I'm here.</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${ENV.appPublicUrl}/contact" style="color:#c9a96e;font-weight:700;text-decoration:underline;">Or send me a message here</a>
        </p>
        <p style="margin-top:32px;">With love,<br/><strong>${BRAND.coachName}</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | ${BRAND.name}</span></p>
      </div>
    </div>
  `,
});

export const SNACK_HACK_EMAILS = [getSnackHackDay3Email, getSnackHackDay7Email];

/** Days after signup when each follow-up email should send (welcome is immediate, not in this list). */
export const SNACK_HACK_DAY_OFFSETS = [3, 7] as const;