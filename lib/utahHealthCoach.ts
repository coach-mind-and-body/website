/**
 * Local page for women over 40 on the Wasatch Front.
 * Copy is limited to facts already published on the site: the coaches,
 * virtual Google Meet sessions, Sandy / Wasatch Front, the phone number,
 * and what 6 Habits in 6 Weeks covers. Cities are places served.
 * The title omits the brand because the root template appends it.
 */

export const UTAH_PAGE = {
  path: "/utah-health-coach",
  title: "Health Coach for Women Over 40 in Utah",
  description:
    "Health coach for women over 40 in Sandy, Utah, serving the Wasatch Front. Virtual coaching with Lee Anne Chapman, Sara, and Brittany. Call (801) 331-5319.",
} as const;

export const UTAH_PARAGRAPHS = [
  "Mind and Body Reset Coaching is a health and life coaching practice for women over 40. Lee Anne Chapman, a certified life coach and certified health coach, leads the practice with Sara and Brittany, certified Mind and Body Coaches. The practice is based in Sandy, Utah, and serves women along the Wasatch Front. Coaching conversations are virtual on Google Meet, so you can join from a computer, tablet, or phone.",
  "If you live in Sandy, Draper, Lehi, Riverton, South Jordan, or the Salt Lake area, you are in the area the practice serves. There is no separate office listing for those cities. The published contact is the Sandy, Utah practice line, (801) 331-5319, and the way to start is a free 30-minute discovery call.",
  "Lee Anne specializes in menopause, hormone health, and metabolic reset. After uncovering her own insulin resistance, raising five children, and going through menopause, she coaches women through that season. Her bio describes evidence-based strategies to restore hormonal balance, rebuild confidence, and create lasting wellbeing. The site describes the practice as help with hormones, insulin resistance, food noise, and lasting habits, without another diet.",
  "Sara is a certified Mind and Body Coach and a mom of two under two. Her bio says motherhood leaves very little time for perfect wellness, and that she uses hormone-aware tools in the middle of diapers, naps, and real-life chaos. She coaches women toward balance with food, weight loss, and energy without extremes, guilt, or pressure.",
  "Brittany is a certified Mind and Body Coach who helps women build sustainable habits that stick. Her bio says wellness does not have to be complicated or all-or-nothing. She meets women where they are, whether they are just starting or have tried everything. Her approach blends hormone-aware nutrition, mindset coaching, and practical lifestyle tools.",
  "The coaching program on the site is 6 Habits in 6 Weeks, private coaching to quiet food noise. It is six private 50-minute sessions with Lee Anne on Google Meet, plus email support between sessions and a personalized action plan after each session. The program page describes the focus as mindset, hormones, the relationship with food, and sustainable habits. It is not a meal plan and it is not calorie counting. Sessions are scheduled at a time that works for you.",
  "The free discovery call is the starting point. You book it on the book page. Google asks for your name and email so it can send the Google Meet link, and then Google emails a confirmation. The call is a conversation about whether coaching is a fit and whether 6 Habits in 6 Weeks is the right next step. The book page says to expect no sales pressure, a clearer look at what has been keeping you stuck, and at least one practical insight you can take with you.",
  "Women along the Wasatch Front use the same virtual sessions as clients elsewhere. You do not need to drive to Sandy for the call or for the six sessions. The phone number is there when you want to talk to the practice directly: (801) 331-5319. You can also meet the three coaches on the about page before you book.",
  "The health and wellness blog is where those same topics are written out: gaining weight after 40 even when you eat less, sugar cravings at night, calming food noise, gaining weight in perimenopause even with good habits, and telling anxiety and perimenopause apart. Those articles are education and coaching context. They are not a diagnosis, and the site says coaching is not a substitute for professional medical advice.",
  "If you want a health coach for women over 40 and you are in Utah, start with what is already on the site. Lee Anne Chapman, Sara, and Brittany. Virtual Google Meet sessions. Sandy and the Wasatch Front, including Draper, Lehi, Riverton, South Jordan, and the Salt Lake area. A free 30-minute discovery call, then six habits across six weeks if the call shows it is a fit.",
] as const;

export const UTAH_LINKS = [
  { href: "/book", label: "Book a free discovery call" },
  { href: "/about", label: "Meet Lee Anne, Sara, and Brittany" },
  {
    href: "/health-wellness-blog/why-am-i-gaining-weight-after-40-even-when-i-eat-less",
    label: "Why am I gaining weight after 40 even when I eat less",
  },
  {
    href: "/health-wellness-blog/how-to-stop-sugar-cravings-at-night-a-midlife-strategy-that-actually-works",
    label: "How to stop sugar cravings at night after 40",
  },
  {
    href: "/health-wellness-blog/calming-food-noise-drop-the-food-courtroom",
    label: "Calming food noise",
  },
  {
    href: "/health-wellness-blog/why-youre-gaining-weight-in-perimenopause-even-with-good-habits",
    label: "Why you're gaining weight in perimenopause even with good habits",
  },
  {
    href: "/health-wellness-blog/is-it-anxiety-or-is-it-perimenopause",
    label: "Is it anxiety or is it perimenopause",
  },
] as const;

export const UTAH_AREA_SERVED = [
  "Wasatch Front",
  "Sandy, Utah",
  "Draper, Utah",
  "Lehi, Utah",
  "Riverton, Utah",
  "South Jordan, Utah",
  "Salt Lake area, Utah",
] as const;

export function utahBodyWordCount(): number {
  const text = [...UTAH_PARAGRAPHS, ...UTAH_LINKS.map((link) => link.label)].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}
