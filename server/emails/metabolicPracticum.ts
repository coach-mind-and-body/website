/**
 * Six emails for the free Mindy Pelz practicum spots.
 * Three on Thursday Oct 15, three on Friday Oct 16. Each one stands alone
 * and gets shorter and more direct as 10 PM Friday gets closer.
 * Wrapped by the newsletter shell. Do not schedule until Carter approves.
 */
import { SITE_URL } from "@shared/brand";

export const METABOLIC_FORM_URL = "https://forms.gle/VoN7VsDjN5FTpmj9A";

const PHOTO = {
  session: `${SITE_URL}/photos/lee-anne-table.jpg`,
  desk: `${SITE_URL}/photos/lee-anne-chair.jpg`,
  portrait: `${SITE_URL}/photos/lee-anne.jpg`,
} as const;

export type MetabolicEmail = {
  key: "thu-1" | "thu-2" | "thu-3" | "fri-1" | "fri-2" | "fri-3";
  day: "Thursday" | "Friday";
  /** Clock time, America/Denver. */
  sendAtLabel: string;
  subject: string;
  previewText: string;
  bodyHtml: string;
};

const INK = "#3f3a36";
const GOLD = "#e8c36a";

function p(html: string, extra = ""): string {
  return `<p style="margin:0 0 14px;color:${INK};font-size:16px;line-height:1.6;${extra}">${html}</p>`;
}

function button(label: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="width:auto;margin:6px auto 4px;border-collapse:collapse;">
  <tr>
    <td align="center" bgcolor="${GOLD}" style="border:none;border-radius:20px;background:${GOLD};">
      <a href="${METABOLIC_FORM_URL}" style="display:inline-block;padding:8px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.2;font-weight:600;color:#3d2914;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>
<p style="margin:0 0 16px;text-align:center;font-size:12px;line-height:1.4;">
  <a href="${METABOLIC_FORM_URL}" style="color:#8a8178;font-weight:400;text-decoration:underline;">${METABOLIC_FORM_URL}</a>
</p>`;
}

function photo(src: string, alt: string, width: number): string {
  return `
<p style="margin:6px 0 16px;text-align:center;">
  <img src="${src}" alt="${alt}" width="${width}" style="max-width:${width}px;height:auto;border-radius:8px;display:block;margin:0 auto;">
</p>`;
}

const LETTER = "<!--letter-->";

export const METABOLIC_EMAILS: MetabolicEmail[] = [
  {
    key: "thu-1",
    day: "Thursday",
    sendAtLabel: "2:00 PM",
    subject: "{{firstName}}, I can take 3 of you for free",
    previewText: "Five private sessions. You buy a Keto-Mojo. I close it Friday at 10.",
    bodyHtml: [
      LETTER,
      p("I'm taking <strong>3 women</strong> for five weeks of one-on-one metabolic coaching. The coaching is free."),
      p("Five private 60-minute Zoom sessions, just you and me. You buy a Keto-Mojo meter. That's the only cost. <strong>Applications close Friday, October 16, at 10 PM.</strong>"),
      button("Apply for a free spot"),
      photo(
        PHOTO.session,
        "Lee Anne sitting with a client at the kitchen table, going over a plan together",
        440
      ),
      p("This is coaching I usually charge for. I'm in the practicum for my Mindy Pelz Coach with Confidence certification, so I need 3 practice clients. I'd love for one of them to be you."),
      p("We'll look at how your body responds to food, fasting, and blood sugar, and what your ketones are doing. One hour a week. You don't need to know how to fast."),
      p("A mentor may review our sessions, because this is my practicum. If that's a no, skip this one."),
      p("The link above is the application. Fill it out there. You don't need to send anything back to me. If more than 3 of you want in, I'll keep a waitlist."),
    ].join("\n"),
  },
  {
    key: "thu-2",
    day: "Thursday",
    sendAtLabel: "5:00 PM",
    subject: "I'll get back on track in January",
    previewText: "Holiday cookies are coming. 3 free spots. Tomorrow at 10 I close them.",
    bodyHtml: [
      LETTER,
      p(`<em>"I'll get back on track in January."</em>`),
      p("I hear that every year, right about the time the parties, the cookies, and the family dinners start."),
      p("You can go into December knowing a little more about your own blood sugar. January doesn't have to be the plan."),
      p("I have <strong>3 free spots</strong>. Five weeks, one hour a week on Zoom. You buy a Keto-Mojo. No crash diet. <strong>I close applications tomorrow, Friday, October 16, at 10 PM.</strong>"),
      button("Take one of the 3 spots"),
      photo(
        PHOTO.desk,
        "Lee Anne at her kitchen table with her laptop, ready for a coaching session",
        260
      ),
      p("The coaching is free because it's my Mindy Pelz practicum. The meter is the part you purchase. If more than 3 women apply, I'll keep a waitlist."),
    ].join("\n"),
  },
  {
    key: "thu-3",
    day: "Thursday",
    sendAtLabel: "8:00 PM",
    subject: "{{firstName}}, tomorrow at 10 this closes",
    previewText: "Last note from me today. Five free sessions, then a waitlist.",
    bodyHtml: [
      LETTER,
      p("<strong>Tomorrow at 10 PM I stop taking applications.</strong> Last note from me today."),
      p("Five weeks. Five one-on-one sessions. One hour a week. We'll look at your food, your blood sugar, and your energy. The coaching is free. You buy a Keto-Mojo. You don't need fasting experience. 3 women, then a waitlist."),
      button("Apply before 10 tomorrow"),
      photo(PHOTO.portrait, "Lee Anne Chapman", 160),
      p("If a friend came to mind, forward this to her. She has until tomorrow at 10 PM too.", "margin-bottom:4px;"),
    ].join("\n"),
  },
  {
    key: "fri-1",
    day: "Friday",
    sendAtLabel: "9:00 AM",
    subject: "{{firstName}}, 10 tonight is the close",
    previewText: "Still 3 free spots. Five weeks with me. You buy the meter.",
    bodyHtml: [
      LETTER,
      p("It's Friday. I'm still taking <strong>3 women</strong> for five weeks of free one-on-one metabolic coaching, and <strong>tonight at 10</strong> is when I stop."),
      p("Five private 60-minute Zoom sessions. You buy a Keto-Mojo. That's the only cost. A mentor may review the sessions. If that's a no, skip this one."),
      button("Apply today"),
      photo(
        PHOTO.session,
        "Lee Anne sitting with a client at the kitchen table, going over a plan together",
        440
      ),
      p("This is the coaching I usually charge for. It's free right now because I'm in my Mindy Pelz Coach with Confidence practicum. One hour a week. You don't need to know how to fast. More than 3 women, and I'll keep a waitlist."),
    ].join("\n"),
  },
  {
    key: "fri-2",
    day: "Friday",
    sendAtLabel: "1:30 PM",
    subject: "{{firstName}}, it takes a few minutes",
    previewText: "The application stays open until 10 tonight. Then I stop.",
    bodyHtml: [
      LETTER,
      p("<strong>10 PM tonight is the cutoff.</strong> If you've been meaning to look at this, do it before the afternoon gets away from you."),
      p("I'm taking 3 women. Five weeks, one hour a week on Zoom, just you and me. The coaching is free. You buy a Keto-Mojo. No fasting experience needed. Food, blood sugar, ketones. Your body, not a generic plan."),
      button("Finish the application"),
      photo(PHOTO.desk, "Lee Anne at her kitchen table with her laptop", 240),
      p("Put your name in before 10. If more than 3 of you do, I'll keep a waitlist."),
    ].join("\n"),
  },
  {
    key: "fri-3",
    day: "Friday",
    sendAtLabel: "6:00 PM",
    subject: "Last one from me. 10 tonight.",
    previewText: "After 10 I stop taking names. 3 free spots.",
    bodyHtml: [
      LETTER,
      p("<strong>Last email. I close this at 10 tonight.</strong>"),
      p("3 women. Five one-on-one sessions. One hour a week. The coaching is free. You buy a Keto-Mojo."),
      button("Apply before 10 tonight"),
      photo(PHOTO.portrait, "Lee Anne Chapman", 150),
      p("After 10 I won't take more applications. If more than 3 come in before then, I'll keep a waitlist."),
      p("Forward this if someone else should see it. She has until 10 tonight too.", "margin-bottom:4px;"),
    ].join("\n"),
  },
];

export const METABOLIC_SHELL = {
  headline: "",
  subheadline: "",
  greetingTemplate: "Hi {{firstName}},",
  signOffClosing: "Better Than Perfect,",
  signOffName: "Lee Anne",
  signOffTitle: "Mind & Body Reset",
  ctaLabel: "",
  ctaUrl: "",
  variant: "letter" as const,
  audienceGroup: "all" as const,
};
