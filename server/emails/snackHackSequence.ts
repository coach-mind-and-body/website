import { ENV } from "../_core/env";
import { BRAND } from "@shared/brand";

const baseStyle = `font-family:'Nunito Sans',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);`;
const headerStyle = `background:linear-gradient(135deg,#fbeee9 0%,#f5dcd3 100%);padding:30px;text-align:center;`;
const contentStyle = `padding:36px 40px;color:#4a4a4a;font-size:16px;line-height:1.6;`;
const h1Style = `margin:0 0 8px;color:#8a7060;font-size:24px;font-weight:700;`;
const ctaStyle = `display:inline-block;background:#c9a96e;color:white;padding:14px 36px;border-radius:9999px;text-decoration:none;font-size:16px;font-weight:700;`;

/** Day 2 follow-up */
export const getSnackHackDay2Email = (firstName: string) => ({
  subject: "Did you try the Snack Hack yet?",
  html: `
    <div style="${baseStyle}">
      <div style="background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;">
        <img src="${ENV.appPublicUrl}/logo-wide.jpg" alt="${BRAND.name}" style="max-width:180px;height:auto;" />
      </div>
      <div style="${headerStyle}">
        <h1 style="${h1Style}">A quick check-in, ${firstName}</h1>
        <p style="margin:0;color:#8a7060;font-size:15px;">How did last night go?</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>It's been a couple of days since you downloaded <em>The Midlife Mindset Snack Hack</em> — I wanted to check in.</p>
        <p>Most women tell me the hardest part isn't <em>knowing</em> what to do… it's remembering to do it when 9pm hits and the fridge starts calling your name.</p>
        <p>If you haven't opened the guide yet, here's your link again:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${ENV.appPublicUrl}/late-night-snack-hack.pdf" style="${ctaStyle}">Open the Snack Hack Guide</a>
        </div>
        <p>If you <em>have</em> tried it — even once — that's a massive win. One evening where you pause instead of panic-eat is proof your nervous system can learn a new pattern.</p>
        <p>If evenings still feel like a battle, you don't have to figure it out alone. I offer a free 30-minute discovery call — no pressure, just clarity:</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${ENV.appPublicUrl}/book" style="${ctaStyle}">Book Your Free Discovery Call</a>
        </div>
        <p>Also, don't forget to use your free habit tracker. Tracking your daily wins takes just 30 seconds and keeps you accountable:</p>
        <p style="text-align:center;margin:24px 0;">
          <a href="${ENV.appPublicUrl}/habit-tracker" style="color:#c9a96e;font-weight:700;text-decoration:underline;">Open Your Free Habit Tracker</a>
        </p>
        <p>Or just reply to this email and tell me — what's the hardest part of your evenings right now? I read every message.</p>
        <p style="margin-top:32px;">With love,<br/><strong>${BRAND.coachName}</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | ${BRAND.name}</span></p>
      </div>
    </div>
  `,
});

/** Day 4 follow-up */
export const getSnackHackDay4Email = (firstName: string) => ({
  subject: "The willpower myth (and what to do instead)",
  html: `
    <div style="${baseStyle}">
      <div style="background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;">
        <img src="${ENV.appPublicUrl}/logo-wide.jpg" alt="${BRAND.name}" style="max-width:180px;height:auto;" />
      </div>
      <div style="${headerStyle}">
        <h1 style="${h1Style}">It's not your fault, ${firstName}</h1>
        <p style="margin:0;color:#8a7060;font-size:15px;">Why trying harder doesn't work</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>I hear this from women every single day: <em>"I do so well all day, and then at night I just lose all my willpower."</em></p>
        <p>I want you to hear this loud and clear: <strong>It is not a willpower problem.</strong></p>
        <p>When you hit your 40s and 50s, your hormones shift dramatically. Cortisol spikes, insulin resistance changes, and your body actively fights you to seek out comfort in the form of sugar and carbs at night to soothe a stressed nervous system.</p>
        <p>You cannot "willpower" your way out of biology.</p>
        <p>The Snack Hack guide I sent you is the first step to interrupting that pattern. But to truly rewire your body's response, we have to look at the root cause of the food noise.</p>
        <p>If you're exhausted from fighting your own body every evening, let's talk. I offer a free 30-minute Discovery Call to help women just like you map out a personalized plan.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${ENV.appPublicUrl}/book" style="${ctaStyle}">Book Your Free Call</a>
        </div>
        <p style="margin-top:32px;">With love,<br/><strong>${BRAND.coachName}</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | ${BRAND.name}</span></p>
      </div>
    </div>
  `,
});

/** Day 7 follow-up */
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
        <p>You've had the Snack Hack guide for a week now. If you're still wrestling with evening cravings, food noise, or that voice that says <em>"just this once"</em>... I want you to know that true, lasting change usually needs a person in your corner.</p>
        <p>A PDF is a tool. But accountability is what actually creates transformation.</p>
        <p>I want to personally invite you to a <strong>free 30-minute discovery call</strong>. We'll talk about what's really going on for you — no high-pressure sales tactics, just an honest conversation about your goals and whether 1-on-1 coaching could help.</p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${ENV.appPublicUrl}/book" style="${ctaStyle}">Book Your Free Discovery Call</a>
        </div>
        <p>If you're tired of starting over every Monday, let's get on a call.</p>
        <p style="margin-top:32px;">With love,<br/><strong>${BRAND.coachName}</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | ${BRAND.name}</span></p>
      </div>
    </div>
  `,
});

/** Day 10 follow-up */
export const getSnackHackDay10Email = (firstName: string) => ({
  subject: "The permanent solution to evening cravings",
  html: `
    <div style="${baseStyle}">
      <div style="background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;">
        <img src="${ENV.appPublicUrl}/logo-wide.jpg" alt="${BRAND.name}" style="max-width:180px;height:auto;" />
      </div>
      <div style="${headerStyle}">
        <h1 style="${h1Style}">Introducing R.E.C.L.A.I.M.</h1>
        <p style="margin:0;color:#8a7060;font-size:15px;">Rewire your mind and reset your body</p>
      </div>
      <div style="${contentStyle}">
        <p>Hi ${firstName},</p>
        <p>Over the last 10 days, we've talked about the willpower myth, the biology of cravings, and how to start breaking the late-night snacking cycle.</p>
        <p>But if you are ready to completely rewrite your relationship with food, silence the "food noise" for good, and finally feel comfortable in your own skin again... it's time to take the next step.</p>
        <p>I created the <strong>R.E.C.L.A.I.M. Program</strong> specifically for women like you. It is a comprehensive 6-week journey where we work together 1-on-1 to reset your habits from the ground up.</p>
        <div style="background:#f9f5f0;border-left:4px solid #c9a96e;padding:20px;margin:24px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#5a3e28;">What you get in R.E.C.L.A.I.M:</p>
          <ul style="margin:0;padding-left:20px;line-height:1.6;">
            <li>6 weeks of intensive 1-on-1 coaching with me</li>
            <li>Customized hormone and habit strategies</li>
            <li>Access to the exclusive Reclaim Hub with weekly modules</li>
            <li>Direct accountability so you never fall off track</li>
          </ul>
        </div>
        <p>If you are ready to stop fighting yourself and start living, I would be honored to guide you.</p>
        <div style="text-align:center;margin:28px 0 12px;">
          <a href="${ENV.appPublicUrl}/book" style="${ctaStyle}">Book a Free Discovery Call First</a>
        </div>
        <p style="text-align:center;margin:0 0 28px;">
          <a href="${ENV.appPublicUrl}/reclaim" style="color:#c9a96e;font-weight:700;text-decoration:underline;">Or learn more about R.E.C.L.A.I.M.</a>
        </p>
        <p style="margin-top:32px;">With love,<br/><strong>${BRAND.coachName}</strong><br/><span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach | ${BRAND.name}</span></p>
      </div>
    </div>
  `,
});

export const SNACK_HACK_EMAILS = [
  getSnackHackDay2Email,
  getSnackHackDay4Email,
  getSnackHackDay7Email,
  getSnackHackDay10Email
];

/** Days after signup when each follow-up email should send. */
export const SNACK_HACK_DAY_OFFSETS = [2, 4, 7, 10] as const;
