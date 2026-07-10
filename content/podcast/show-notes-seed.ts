/** Editorial show notes for top podcast episodes (backfill). */
export type ShowNoteSeed = {
  videoId: string;
  slug: string;
  title: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
  showNotesHtml: string;
  relatedLinks: { href: string; label: string }[];
};

function notes(opts: {
  summary: string;
  takeaways: string[];
  links: { href: string; label: string }[];
}): string {
  const takeaways = opts.takeaways.map((t) => `<li>${t}</li>`).join("");
  const links = opts.links
    .map((l) => `<li><a href="${l.href}">${l.label}</a></li>`)
    .join("");
  return `
<p>${opts.summary}</p>
<h2>Key takeaways</h2>
<ul>${takeaways}</ul>
<h2>Related resources</h2>
<ul>${links}</ul>
<p><a href="/book">Book a free discovery call</a> · <a href="/food-quiz">Take the free quiz</a> · <a href="/reclaim">Explore R.E.C.L.A.I.M.</a></p>
<p style="font-size:0.9rem;opacity:0.85;"><em>Show notes are for education and coaching context only — not medical advice.</em></p>
`.trim();
}

export const SHOW_NOTES_SEEDS: ShowNoteSeed[] = [
  {
    videoId: "-lkhOm9WsoQ",
    slug: "overcoming-nighttime-sugar-battles",
    title: "Overcoming Nighttime Sugar Battles: A New Approach",
    publishedAt: "2026-05-01T14:00:15+00:00",
    seoTitle: "Nighttime Sugar Battles in Midlife | Podcast Show Notes",
    seoDescription:
      "Show notes: why nighttime sugar battles intensify after 40 and a midlife approach that reduces the mental fight — without more willpower.",
    relatedLinks: [
      { href: "/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works", label: "How to stop sugar cravings at night" },
      { href: "/snack-hack", label: "Free Snack Hack guide" },
    ],
    showNotesHtml: notes({
      summary:
        "In this episode, Lee Anne reframes nighttime sugar battles as a midlife pattern — biology, stress, and habit — not a moral failure. You will hear a practical approach to evening urges that prioritizes safety and satisfaction over white-knuckling.",
      takeaways: [
        "Evening cravings often start with under-fueling earlier in the day.",
        "Food noise gets louder when sugar is morally banned.",
        "A wind-down ritual can replace the pantry as your default relief valve.",
        "Progress looks like quieter nights, not a perfect streak.",
      ],
      links: [
        { href: "/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works", label: "Pillar: stop sugar cravings at night" },
        { href: "/snack-hack", label: "Snack Hack free guide" },
      ],
    }),
  },
  {
    videoId: "TmOsGg7hzXk",
    slug: "fuel-fat-loss-over-40-balance-insulin",
    title: "Fuel Fat Loss Over 40: Balance Insulin and Boost Energy",
    publishedAt: "2026-06-05T17:41:48+00:00",
    seoTitle: "Balance Insulin & Energy After 40 | Podcast Show Notes",
    seoDescription:
      "Show notes for Fuel Fat Loss Over 40: how insulin balance, energy, and midlife habits connect — without another crash diet.",
    relatedLinks: [
      { href: "/insulin-resistance-after-40", label: "Insulin resistance after 40 hub" },
      { href: "/health-wellness-blog/mastering-insulin-fueling-fat-burning-and-energy-after-40", label: "Mastering insulin article" },
    ],
    showNotesHtml: notes({
      summary:
        "Lee Anne connects midlife energy crashes and stubborn fat loss to insulin dynamics — and why “eat less, move more” often backfires after 40. This episode focuses on fueling for stability rather than punishment.",
      takeaways: [
        "Insulin sensitivity changes across midlife; strategies must change too.",
        "Protein, fiber, and meal structure support steadier energy.",
        "Chronic restriction can worsen food noise and rebound eating.",
        "Metabolic health and mindset work best as a pair.",
      ],
      links: [
        { href: "/insulin-resistance-after-40", label: "Insulin resistance after 40" },
        { href: "/unicity", label: "Feel Great System with coaching support" },
      ],
    }),
  },
  {
    videoId: "rK9ePYUX2TU",
    slug: "beyond-the-scale-building-new-weight-loss-patterns",
    title: "Beyond the Scale: Building New Weight Loss Patterns",
    publishedAt: "2026-06-12T16:55:01+00:00",
    seoTitle: "Beyond the Scale: New Weight Loss Patterns | Show Notes",
    seoDescription:
      "Podcast show notes on building weight-loss patterns that last — identity, habits, and midlife reality beyond the scale.",
    relatedLinks: [
      { href: "/reclaim", label: "R.E.C.L.A.I.M. coaching" },
      { href: "/health-wellness-blog/weight-loss-mindset-mind-the-gap-to-find-your-peace", label: "Weight loss mindset article" },
    ],
    showNotesHtml: notes({
      summary:
        "The scale is a noisy metric. This episode explores building patterns — sleep, protein, stress skills, self-talk — that create sustainable change for women who are done with extreme plans.",
      takeaways: [
        "Patterns beat plans you abandon in three weeks.",
        "Identity shift (“I’m someone who…”) sustains behavior.",
        "Midlife bodies need strength and recovery, not just restriction.",
        "Peace with the process reduces all-or-nothing rebounds.",
      ],
      links: [
        { href: "/reclaim", label: "R.E.C.L.A.I.M. program" },
        { href: "/habit-tracker", label: "Free habit tracker" },
      ],
    }),
  },
  {
    videoId: "gZ9azorTTJU",
    slug: "navigating-midlife-changes-hormones-weight",
    title: "Navigating Midlife Changes: Hormones, Weight, and New Beginnings",
    publishedAt: "2026-06-12T16:53:53+00:00",
    seoTitle: "Midlife Hormones, Weight & New Beginnings | Show Notes",
    seoDescription:
      "Show notes: hormones, weight, and midlife transitions — how to navigate change without shame or another crash diet.",
    relatedLinks: [
      { href: "/holistic-health-and-wellness", label: "Holistic health for women 40+" },
      { href: "/about", label: "About Lee Anne" },
    ],
    showNotesHtml: notes({
      summary:
        "Midlife is not a broken version of your younger self. Lee Anne talks hormones, weight shifts, and choosing a new beginning grounded in compassion and strategy.",
      takeaways: [
        "Hormonal transitions change hunger, sleep, and stress capacity.",
        "Self-compassion is a performance strategy, not a luxury.",
        "New beginnings work better than endless restarts of old plans.",
        "Support (community + coaching) shortens the learning curve.",
      ],
      links: [
        { href: "/holistic-health-and-wellness", label: "Holistic health hub" },
        { href: "/midlife-health-podcast", label: "All podcast episodes" },
      ],
    }),
  },
  {
    videoId: "AG2Wy57bozk",
    slug: "reclaim-rewire-reset-transform-identity",
    title: "Reclaim, Rewire, Reset: Transform Your Identity, Transform Your Weight",
    publishedAt: "2026-06-05T17:36:44+00:00",
    seoTitle: "Reclaim, Rewire, Reset Identity Work | Show Notes",
    seoDescription:
      "Show notes on identity-level change: reclaim, rewire, reset — how who you believe you are shapes midlife health habits.",
    relatedLinks: [
      { href: "/reclaim", label: "R.E.C.L.A.I.M. coaching" },
      { href: "/health-wellness-blog/reclaim-rewire-reset-become-a-different-decision-maker", label: "Decision-maker article" },
    ],
    showNotesHtml: notes({
      summary:
        "Lasting change is identity work. This episode unpacks reclaiming your body story, rewiring decision patterns, and resetting your life without waiting for a perfect Monday.",
      takeaways: [
        "Behavior follows identity stories you rehearse daily.",
        "Small decisions compound faster than perfect plans.",
        "R.E.C.L.A.I.M. is structured support for that rewiring.",
        "You can change the script without hating your body first.",
      ],
      links: [
        { href: "/reclaim", label: "Explore R.E.C.L.A.I.M." },
        { href: "/book", label: "Book a free call" },
      ],
    }),
  },
  {
    videoId: "gWHx3roujsA",
    slug: "breaking-the-cycle-habits-not-plans",
    title: "Breaking the Cycle: Focus on Habits, Not Plans",
    publishedAt: "2026-04-17T22:28:40+00:00",
    seoTitle: "Habits Not Plans: Break the Diet Cycle | Show Notes",
    seoDescription:
      "Show notes on breaking the start-over cycle by focusing on habits instead of rigid diet plans.",
    relatedLinks: [
      { href: "/habit-tracker", label: "Free habit tracker" },
      { href: "/health-wellness-blog/stop-chasing-plans-lasting-health-transformation", label: "Stop chasing plans article" },
    ],
    showNotesHtml: notes({
      summary:
        "Plans fail when life gets real. Lee Anne makes the case for habit systems — small, repeatable, identity-aligned actions — over the next 21-day miracle plan.",
      takeaways: [
        "Rigid plans create all-or-nothing thinking.",
        "Habits survive busy weeks; willpower does not.",
        "Track wins you can control (actions), not only outcomes.",
        "Coaching accelerates habit installation.",
      ],
      links: [
        { href: "/habit-tracker", label: "Habit tracker" },
        { href: "/food-quiz", label: "Food mindset quiz" },
      ],
    }),
  },
  {
    videoId: "15ZSzV_Ee_A",
    slug: "fuel-system-reset-sugar-to-fat-burn",
    title: "Unlocking Your Body's Fuel System: The Switch from Sugar to Fat Burn",
    publishedAt: "2026-03-27T21:50:37+00:00",
    seoTitle: "Sugar-to-Fat Fuel System Reset | Podcast Show Notes",
    seoDescription:
      "Show notes on metabolic fuel flexibility — understanding the switch from sugar burning to fat burning in midlife context.",
    relatedLinks: [
      { href: "/health-wellness-blog/fuel-system-reset-switching-from-sugar-to-fat-burning", label: "Fuel system reset article" },
      { href: "/insulin-resistance-after-40", label: "Insulin resistance hub" },
    ],
    showNotesHtml: notes({
      summary:
        "This episode explores the idea of a metabolic fuel system reset — why you feel stuck on the sugar rollercoaster and what steadier energy can look like when insulin and habits cooperate.",
      takeaways: [
        "Constant sugar spikes keep energy volatile.",
        "Meal structure and fiber support steadier fueling.",
        "Mindset still matters when biology is improving.",
        "Tools and coaching help you stay consistent.",
      ],
      links: [
        { href: "/unicity", label: "Feel Great System" },
        { href: "/insulin-resistance-after-40", label: "Insulin resistance after 40" },
      ],
    }),
  },
  {
    videoId: "LDL5KJvEuoE",
    slug: "why-your-brain-resists-change",
    title: "Why Does Your Brain Resist Change Even When You Want to Transform?",
    publishedAt: "2026-06-29T19:59:05+00:00",
    seoTitle: "Why Your Brain Resists Change | Podcast Show Notes",
    seoDescription:
      "Show notes: why your brain resists change even when you want transformation — and how to work with your wiring in midlife health.",
    relatedLinks: [
      { href: "/health-wellness-blog/beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40", label: "Beyond willpower article" },
      { href: "/reclaim", label: "R.E.C.L.A.I.M. coaching" },
    ],
    showNotesHtml: notes({
      summary:
        "Wanting change and doing change are different systems. Lee Anne unpacks resistance, self-sabotage, and how to work with your brain instead of bullying it into another plan.",
      takeaways: [
        "Resistance often protects you from past failure pain.",
        "Tiny consistent steps beat heroic overhauls.",
        "Self-talk is part of the metabolic environment.",
        "Support makes hard rewiring sustainable.",
      ],
      links: [
        { href: "/reclaim", label: "R.E.C.L.A.I.M." },
        { href: "/book", label: "Free discovery call" },
      ],
    }),
  },
];
