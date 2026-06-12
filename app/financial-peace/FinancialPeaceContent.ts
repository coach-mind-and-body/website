// Default HTML content for each editable block on the /financial-peace page.
// Stored here to keep JSX clean and avoid parser issues with inline style strings.

export const FPU_CONTENT: Record<string, string> = {
  "hero-heading": [
    '<h1 style="font-family:\'Cormorant Garamond\',serif;font-size:clamp(2rem,5vw,3.4rem);',
    'color:oklch(1 0 0);font-weight:bold;line-height:1.2;margin-bottom:20px;">',
    'What If You Could Stop Dreading Your Bank Account and ',
    '<em style="color:oklch(0.72 0.09 145);font-style:italic;">Actually Look Forward</em>',
    ' to Your Future?</h1>',
  ].join(""),

  "hero-subheading": [
    '<p style="color:oklch(0.92 0.015 148);max-width:580px;margin:0 auto 12px;font-size:1.125rem;">',
    'A 9-week program that takes you from financial overwhelm to financial peace — ',
    'with real talk, real strategies, and zero shame.</p>',
  ].join(""),

  "hero-cohort-date": [
    '<span style="font-size:0.875rem;font-weight:bold;color:oklch(0.72 0.11 78);">',
    'Next cohort starts May 12, 2026</span>',
  ].join(""),

  "relate-heading": [
    '<h2 style="font-family:\'Cormorant Garamond\',serif;font-size:clamp(1.8rem,3.5vw,2.6rem);',
    'color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:8px;">',
    "Be honest. Nobody's watching. 👀</h2>",
  ].join(""),

  "relate-subtext": [
    '<p style="font-size:1rem;color:oklch(0.52 0.015 50);margin-bottom:32px;">',
    "If any of these hit home, you're in exactly the right place.</p>",
  ].join(""),

  "relate-pain-points": [
    '<ul style="display:flex;flex-direction:column;gap:16px;list-style:none;padding:0;">',
    '<li style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:oklch(1 0 0);border-left:4px solid oklch(0.72 0.09 145);border-radius:0 12px 12px 0;box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.05);">',
    '<span style="font-size:1.25rem;flex-shrink:0;">😔</span>',
    '<span style="font-size:1rem;line-height:1.6;color:oklch(0.35 0.015 50);">You feel like you\'ll never get out of debt in this lifetime.</span></li>',
    '<li style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:oklch(1 0 0);border-left:4px solid oklch(0.72 0.09 145);border-radius:0 12px 12px 0;box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.05);">',
    '<span style="font-size:1.25rem;flex-shrink:0;">🤫</span>',
    "<span style=\"font-size:1rem;line-height:1.6;color:oklch(0.35 0.015 50);\">You're secretly googling food banks near you and hoping your kids won't see your search history.</span></li>",
    '<li style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:oklch(1 0 0);border-left:4px solid oklch(0.72 0.09 145);border-radius:0 12px 12px 0;box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.05);">',
    '<span style="font-size:1.25rem;flex-shrink:0;">👟</span>',
    "<span style=\"font-size:1rem;line-height:1.6;color:oklch(0.35 0.015 50);\">You're tired of telling your kids no when they ask for new shoes or a treat. Every. Single. Time.</span></li>",
    '<li style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:oklch(1 0 0);border-left:4px solid oklch(0.72 0.09 145);border-radius:0 12px 12px 0;box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.05);">',
    '<span style="font-size:1.25rem;flex-shrink:0;">🍽️</span>',
    "<span style=\"font-size:1rem;line-height:1.6;color:oklch(0.35 0.015 50);\">A friend invites you to dinner and your stomach drops — because you can't afford it and you're too embarrassed to say so.</span></li>",
    '<li style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:oklch(1 0 0);border-left:4px solid oklch(0.72 0.09 145);border-radius:0 12px 12px 0;box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.05);">',
    '<span style="font-size:1.25rem;flex-shrink:0;">⛺</span>',
    "<span style=\"font-size:1rem;line-height:1.6;color:oklch(0.35 0.015 50);\">You're embarrassed when people ask about vacation plans, because you're camping in the Walmart parking lot and <em>praying</em> the kids think it's an adventure. (We actually did this. And honestly? 10/10 would recommend — the kids still talk about it.)</span></li>",
    '<li style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:oklch(1 0 0);border-left:4px solid oklch(0.72 0.09 145);border-radius:0 12px 12px 0;box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.05);">',
    '<span style="font-size:1.25rem;flex-shrink:0;">🦑</span>',
    "<span style=\"font-size:1rem;line-height:1.6;color:oklch(0.35 0.015 50);\">You completely understand why people played the Squid Games 🫠 — the debt part, not the killing part. We're very anti-killing here, lol.</span></li>",
    "</ul>",
  ].join(""),

  "relate-quote": [
    '<blockquote style="margin-top:40px;padding:24px;border-radius:16px;font-style:italic;font-size:1.15rem;',
    "font-family:'Cormorant Garamond',serif;background:oklch(0.97 0.012 80);",
    'border:2px solid oklch(0.72 0.09 145);color:oklch(0.38 0.09 148);">',
    '\u201cIf you said yes to any of these \u2014 I get it. I was <em>there</em> too. And I found a way out. That\u2019s why I\u2019m here.\u201d</blockquote>',
  ].join(""),

  "story-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,3.5vw,2.4rem);",
    'color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:24px;">',
    "I Know This Feeling Because I Lived It</h2>",
  ].join(""),

  "story-body": [
    '<div style="color:oklch(0.42 0.015 50);font-size:1rem;line-height:1.8;">',
    "<p style=\"margin-bottom:20px;\">I'm not going to pretend I've always had it together. I had crippling credit card debt that followed me everywhere. I had a neighbor gently tell me where to pick up a free box of food. I had the tension with my husband every time he mentioned going out to lunch — because I knew we couldn't afford it, and I was furious that he didn't seem to notice.</p>",
    "<p style=\"margin-bottom:20px;\">I told my five kids that Christmas was going to be small that year. I knew our car needed a tune-up and I had no idea how we'd pay for it. I felt trapped, ashamed, and honestly — exhausted from pretending everything was fine.</p>",
    "<p style=\"margin-bottom:20px;\">The turning point came when I finally stopped white-knuckling it alone and found a system that actually made sense. <strong style=\"color:oklch(0.38 0.09 148);\">Dave Ramsey's Financial Peace University</strong> gave me the step-by-step roadmap I desperately needed. And combining it with the mindset work I do as a certified life coach made it finally <em>stick</em>.</p>",
    "<p>Within months, we paid off our first debt, built our starter emergency fund, and — for the first time in years — I felt <strong>hope</strong> instead of dread when I opened my bank app. That feeling? I want it for you too.</p>",
    "</div>",
  ].join(""),

  "leeanne-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.6rem,3.5vw,2.2rem);",
    "color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:16px;\">Hi, I'm Lee Anne \uD83D\uDC4B</h2>",
  ].join(""),

  "leeanne-bio": [
    '<div style="color:oklch(0.42 0.015 50);font-size:1rem;line-height:1.8;">',
    "<p style=\"margin-bottom:16px;\">I'm a certified mindset life coach, health coach, and Financial Peace coordinator — and someone who has lived every one of those bullet points above in real time.</p>",
    "<p style=\"margin-bottom:16px;\">I'm not going to sugarcoat it: <strong style=\"color:oklch(0.38 0.09 148);\">it takes work, consistency, and trusting the process.</strong> But I'll be walking right alongside you every step of the way. We'll tackle the mindset roadblocks, the family resistance, and the daily strategies you need to actually stay the course.</p>",
    "<p>It is <em>possible</em> for you and your family — no matter how much debt you have right now, or what your income looks like. Your journey starts now.</p>",
    "</div>",
  ].join(""),

  "curriculum-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,3.5vw,2.4rem);",
    "color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:8px;\">What You'll Walk Away With After 9 Weeks</h2>",
  ].join(""),

  "curriculum-subtext": [
    '<p style="font-size:1rem;color:oklch(0.52 0.015 50);margin-bottom:40px;">',
    "Real skills. Real shifts. A real plan that works for real families — not just people with perfect budgets and zero stress.</p>",
  ].join(""),

  "curriculum-cards": [
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;">',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83D\uDCB8 Your Debt Snowball, Started</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Step-by-step guidance on how to begin — no guessing, no confusion, just a clear path forward.</p></div>',
    "<div style=\"border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);\"><h3 style=\"font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;\">\uD83D\uDCCA A Budget You'll Actually Use</h3><p style=\"font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);\">An in-depth plan built around your real life — not some spreadsheet that makes you want to cry.</p></div>",
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83D\uDEE1\uFE0F Insurance You Need vs. Don\'t</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Finally understand what you\'re actually paying for — and what you can cut without risk.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\u26A1 Lower Your Costs Overnight</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Practical ways to free up money fast, starting this week.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83C\uDFE6 Your Emergency Fund</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">How to start building your cushion so one bad day doesn\'t blow your whole plan.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83E\uDDE0 Mindset Shifts That Change Everything</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Because the numbers are only half the battle. We tackle the thinking that keeps people stuck.</p></div>',
    "<div style=\"border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);\"><h3 style=\"font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;\">\uD83C\uDF7D\uFE0F Eating Well on a Budget</h3><p style=\"font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);\">How to eat food that's actually enjoyable without blowing your grocery budget.</p></div>",
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83C\uDF89 Fun on Zero Budget</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">How to create memories with your kids that they\'ll still be laughing about years later (the Walmart camping trip is living proof).</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83D\uDCAC Navigating Money Conversations</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">How to talk about money with your spouse, your kids, and yourself — without it turning into a fight.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83C\uDFE0 Real Estate & Big Purchases</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Learn when to save, when to invest, and how to make smart decisions on the big-ticket items.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\uD83D\uDCC8 Building Wealth Over Time</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Retirement, investing basics, and how to set your family up for generational financial health.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);border-top:3px solid oklch(0.72 0.09 145);box-shadow:0 2px 12px oklch(0.20 0.015 50 / 0.05);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\u2753 Questions & Answers</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Bring your real-life money questions to the group. No judgment, just honest answers and support.</p></div>',
    "</div>",
  ].join(""),

  "for-you-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,3.5vw,2.4rem);",
    "color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:16px;\">This 9 Weeks Is For You If...</h2>",
  ].join(""),

  "for-you-subtext": "",

  "for-you-list": [
    '<ul style="display:flex;flex-direction:column;gap:16px;margin-bottom:40px;list-style:none;padding:0;">',
    '<li style="display:flex;align-items:flex-start;gap:12px;"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;margin-top:2px;">\u2713</span><span style="font-size:1rem;line-height:1.6;color:oklch(0.42 0.015 50);">You want accountability without shame, blame, or guilt.</span></li>',
    '<li style="display:flex;align-items:flex-start;gap:12px;"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;margin-top:2px;">\u2713</span><span style="font-size:1rem;line-height:1.6;color:oklch(0.42 0.015 50);">You want to see progress over perfection — because perfection isn\'t real, but progress is.</span></li>',
    '<li style="display:flex;align-items:flex-start;gap:12px;"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;margin-top:2px;">\u2713</span><span style="font-size:1rem;line-height:1.6;color:oklch(0.42 0.015 50);">You want to show your kids that you can do hard things — and find joy in the process.</span></li>',
    "<li style=\"display:flex;align-items:flex-start;gap:12px;\"><span style=\"color:oklch(0.38 0.09 148);flex-shrink:0;margin-top:2px;\">\u2713</span><span style=\"font-size:1rem;line-height:1.6;color:oklch(0.42 0.015 50);\">You're willing to show up and let me guide you — even when it feels uncomfortable.</span></li>",
    '<li style="display:flex;align-items:flex-start;gap:12px;"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;margin-top:2px;">\u2713</span><span style="font-size:1rem;line-height:1.6;color:oklch(0.42 0.015 50);">You are determined that this is YOUR year for financial freedom.</span></li>',
    "</ul>",
    '<p style="font-size:1rem;color:oklch(0.52 0.015 50);margin-top:24px;font-style:italic;">You don\'t need to have it all figured out. You just need to be willing to show up.</p>',
  ].join(""),

  "cohort-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.6rem,3.5vw,2.2rem);",
    "color:oklch(1 0 0);font-weight:bold;margin-bottom:32px;\">May 2026 Cohort Details</h2>",
  ].join(""),

  "coaching-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,3.5vw,2.4rem);",
    "color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:16px;\">Want Someone In Your Corner?</h2>",
  ].join(""),

  "coaching-intro": [
    '<p style="font-size:1rem;line-height:1.8;color:oklch(0.42 0.015 50);margin-bottom:32px;">',
    "The FPU class gives you the curriculum and the community. But if you want <strong>private, personalized time with me</strong> — someone who has been exactly where you are — you can add on three one-on-one coaching sessions. We'll dig into your specific situation: your income, your debt, your mindset blocks, and your family dynamics. Think of it as the difference between a group fitness class and having your own personal trainer.",
    "</p>",
  ].join(""),

  "coaching-features": [
    '<div style="display:flex;flex-direction:column;gap:12px;">',
    '<p style="font-size:0.875rem;padding:8px 0;border-bottom:1px solid oklch(0.90 0.015 50);display:flex;align-items:flex-start;gap:8px;color:oklch(0.42 0.015 50);"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;">\u2713</span>3 private 50-minute sessions with Lee Anne (schedule at your pace)</p>',
    '<p style="font-size:0.875rem;padding:8px 0;border-bottom:1px solid oklch(0.90 0.015 50);display:flex;align-items:flex-start;gap:8px;color:oklch(0.42 0.015 50);"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;">\u2713</span>Personalized budget review and accountability check-ins</p>',
    '<p style="font-size:0.875rem;padding:8px 0;border-bottom:1px solid oklch(0.90 0.015 50);display:flex;align-items:flex-start;gap:8px;color:oklch(0.42 0.015 50);"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;">\u2713</span>Mindset coaching tailored to your specific money blocks</p>',
    '<p style="font-size:0.875rem;padding:8px 0;border-bottom:1px solid oklch(0.90 0.015 50);display:flex;align-items:flex-start;gap:8px;color:oklch(0.42 0.015 50);"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;">\u2713</span>A plan built around your actual income, debt, and family situation</p>',
    '<p style="font-size:0.875rem;padding:8px 0;display:flex;align-items:flex-start;gap:8px;color:oklch(0.42 0.015 50);"><span style="color:oklch(0.38 0.09 148);flex-shrink:0;">\u2713</span>Direct access to ask questions between sessions</p>',
    "</div>",
  ].join(""),

  "coaching-guarantee": [
    '<div><p style="font-weight:bold;font-size:0.875rem;color:oklch(0.20 0.015 50);margin-bottom:4px;">My Commitment to You</p>',
    '<p style="font-size:0.875rem;line-height:1.6;color:oklch(0.42 0.015 50);">Show up for your sessions, do the work, and engage with the process. If after your first session you feel it\'s not the right fit, reach out and I\'ll refund the remaining sessions — no questions asked.</p></div>',
  ].join(""),

  "faq-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,3.5vw,2.4rem);",
    "color:oklch(0.20 0.015 50);font-weight:bold;margin-bottom:32px;\">I Hear You. Let Me Answer the Real Questions.</h2>",
  ].join(""),

  "faq-items": [
    '<div style="display:flex;flex-direction:column;gap:20px;">',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.04);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\u201cHow much does FPU cost?\u201d</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Students purchase their kit directly through the Dave Ramsey Store. There are two options: <strong>$129 Financial Peace All Access</strong> (12 months FPU + EveryDollar + additional tools) or <strong>$99 FPU Basic</strong> (12 months FPU + 3 months EveryDollar). Both include a physical and digital workbook. Then you sign up for my class for free through the class link!</p></div>',
    "<div style=\"border-radius:16px;padding:24px;background:oklch(1 0 0);box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.04);\"><h3 style=\"font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;\">\u201cWhat if my spouse/partner isn't on board?\u201d</h3><p style=\"font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);\">This is one of the most common roadblocks — and we actually cover it inside the program. You don't need your partner to be excited on day one. You just need to start. Many spouses come around when they see the results happening.</p></div>",
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.04);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\u201cWill this actually work for MY situation?\u201d</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">I\'ve been broke, overwhelmed, and felt like my situation was uniquely hopeless. It wasn\'t. And yours isn\'t either. This program has worked for families of all income levels and debt amounts. The principles work — we just apply them to your life.</p></div>',
    '<div style="border-radius:16px;padding:24px;background:oklch(1 0 0);box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.04);"><h3 style="font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;">\u201cI\'ve tried budgeting before and it never sticks.\u201d</h3><p style="font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);">Same. The difference here is that we address the <em>mindset</em> piece alongside the tactical piece. Most budget plans fail because of what\'s happening between your ears, not in your spreadsheet. That\'s my specialty as a certified mindset coach.</p></div>',
    "<div style=\"border-radius:16px;padding:24px;background:oklch(1 0 0);box-shadow:0 2px 10px oklch(0.20 0.015 50 / 0.04);\"><h3 style=\"font-weight:bold;font-size:1rem;color:oklch(0.20 0.015 50);margin-bottom:8px;\">\u201cWhat's the difference between the class and the coaching add-on?\u201d</h3><p style=\"font-size:0.875rem;line-height:1.6;color:oklch(0.52 0.015 50);\">The FPU class gives you the curriculum, group sessions, and community. The 1:1 coaching add-on ($249) gives you private time with me to work through your specific situation — your income, your debt, your mindset blocks, your family dynamics. It's the difference between a group fitness class and a personal trainer.</p></div>",
    "</div>",
  ].join(""),

  "cta-heading": [
    "<h2 style=\"font-family:'Cormorant Garamond',serif;font-size:clamp(1.8rem,4vw,2.8rem);",
    "color:oklch(1 0 0);font-weight:bold;line-height:1.25;margin-bottom:20px;\">Don\u2019t Let Another Week, Month, or Year Go By.</h2>",
  ].join(""),

  "cta-body": [
    '<p style="font-size:1rem;line-height:1.8;color:oklch(0.88 0.015 148);max-width:520px;margin:0 auto 32px;">',
    "Your future self — the one who breathes easily when the bills come in, who says \u201cyes\u201d to dinner, who tells the story of the Walmart camping trip and laughs instead of cringes — that version of you is on the other side of this decision.",
    "</p>",
  ].join(""),
};
