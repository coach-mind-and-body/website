import { BRAND, SITE_URL } from "@shared/brand";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import { buildNewsletterHtml } from "./newsletterShell";

const LANDING = `${SITE_URL}${REAL_FOOD_RESET.path}`;
const APP = `${SITE_URL}/habit-tracker`;
const NAME = REAL_FOOD_RESET.name;

export type RealFoodResetEmailPhase = "warmup" | "promo" | "challenge_day" | "confirmation";

export type RealFoodResetEmailDraft = {
  key: string;
  phase: RealFoodResetEmailPhase;
  subject: string;
  previewText: string;
  headline: string;
  subheadline?: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  /** health = whole list; real_food_reset = people who registered */
  audienceGroup: "health" | "real_food_reset";
  /** Suggested Mountain-time send, ISO local without Z */
  suggestedSendAt: string;
};

function p(text: string): string {
  return `<p>${text}</p>`;
}

function joinHtml(parts: string[]): string {
  return parts.join("\n");
}

export const REAL_FOOD_RESET_EMAILS: RealFoodResetEmailDraft[] = [
  // ── Warm-up (existing health list) ────────────────────────────────────────
  {
    key: "warmup-1",
    phase: "warmup",
    subject: "Can we stop blaming ourselves for a minute?",
    previewText: "You don't need another Monday restart.",
    headline: "Can we stop blaming ourselves for a minute?",
    bodyHtml: joinHtml([
      p("You know that feeling when you wake up and immediately start replaying what you ate the night before?"),
      p("“I shouldn't have eaten that.” “Why did I have another one?” “I was doing so good…” “Today I'll do better.”"),
      p("And suddenly, before your feet even hit the floor, you're negotiating with food again."),
      p("<strong>You don't need another Monday restart.</strong> And you probably don't need another diet telling you to eat less, try harder, or have more willpower."),
      p("For so many women over 40, food has become a never-ending list of rules. Good foods. Bad foods. Foods you “earned.” Foods you need to “make up for.”"),
      p("It's exhausting. And when you've spent years bouncing between diets, trends, restriction, and starting over, it's easy to believe YOU are the problem."),
      p("What if instead of trying harder, you got curious? What's actually in the foods you're eating? Which choices leave you feeling satisfied? Which ones have you reaching for something else an hour later?"),
      p("Over the next few days, I'm going to help you look at food a little differently. No guilt. No food police. No waiting until Monday. Just curiosity."),
      p("Because changing your lifestyle doesn't start with being perfect. It starts with realizing that you CAN make a different choice."),
    ]),
    ctaLabel: "",
    ctaUrl: "",
    audienceGroup: "health",
    suggestedSendAt: "2026-09-08T10:00:00",
  },
  {
    key: "warmup-2",
    phase: "warmup",
    subject: "It's 8:30 PM. Do you know where your snacks are?",
    previewText: "You've been “good” all day. Then the house gets quiet.",
    headline: "It's 8:30 PM. Do you know where your snacks are?",
    bodyHtml: joinHtml([
      p("The house is finally quiet. You've been “good” all day. You've taken care of everybody. You've answered the texts, handled the work, figured out dinner, cleaned up the kitchen…"),
      p("And now? You want something."),
      p("Maybe it's chocolate. Maybe it's chips. Maybe you find yourself standing in front of the pantry thinking: “I'll just have one.” Then… “One more won't hurt.” And before you know it, you're annoyed with yourself."),
      p("We spend so much time focusing on WHAT we're eating that we rarely stop and get curious about what's happening around the eating."),
      p("Were you actually hungry? Were you exhausted? Were you looking for a little comfort after being “on” all day? Did you eat enough satisfying food earlier? Or has nighttime simply become the moment when all the food rules you've been following finally become too much?"),
      p("This is why another list of “good” and “bad” foods isn't necessarily the answer. We need awareness. Because you can't change a pattern you don't understand."),
      p("So tonight, here's your homework: <strong>Don't change anything. Just notice.</strong>"),
      p("When you find yourself reaching for something after dinner, ask: “What am I looking for right now?” No judgment. No “I shouldn't.” Just information."),
    ]),
    ctaLabel: "",
    ctaUrl: "",
    audienceGroup: "health",
    suggestedSendAt: "2026-09-10T10:00:00",
  },
  {
    key: "warmup-3",
    phase: "warmup",
    subject: "Your food label has a story to tell",
    previewText: "Not the front of the package. The back.",
    headline: "Your food label has a story to tell",
    bodyHtml: joinHtml([
      p("When was the last time you REALLY looked at a food label? Not just the calories. Not just the big, beautiful words on the front telling you it's “healthy,” “natural,” “high protein,” or “low fat.”"),
      p("I'm talking about turning the package around."),
      p("Sometimes the biggest eye-opener isn't what we're intentionally eating. It's what we don't realize we're eating. Sugar can show up in places you might not expect. And highly processed foods can become such a normal part of our day that we don't even think about them anymore."),
      p("Breakfast. Coffee. A quick snack. Lunch on the run. A little something in the afternoon. Sauce or dressing at dinner. None of those choices individually feels like a big deal. But what happens when you put the entire day together?"),
      p("This isn't about becoming afraid of food. It's not about obsessing over every ingredient. And it's definitely not about creating MORE food rules."),
      p("It's about knowing what you're eating so YOU get to make the choice."),
      p("There is a huge difference between “I can't have that” and “I know what's in that, and I'm choosing what works for me.” One feels like restriction. The other feels like confidence."),
      p("And confidence around food? That's what we're after."),
    ]),
    ctaLabel: "",
    ctaUrl: "",
    audienceGroup: "health",
    suggestedSendAt: "2026-09-12T10:00:00",
  },
  {
    key: "warmup-4",
    phase: "warmup",
    subject: "Protein is not the answer...",
    previewText: "Yes, protein matters. It still isn't the whole story.",
    headline: "Protein is not the answer...",
    bodyHtml: joinHtml([
      p("Okay, before you come for me… yes, protein matters."),
      p("But simply adding more protein isn't the magic answer to everything you're struggling with around food. You can eat the chicken breast, drink the protein shake, buy the high-protein snack — and still spend your evening thinking: “Should I eat this? Shouldn't I eat that? Maybe just one… I'll start over tomorrow.”"),
      p("Eating well isn't just about knowing which nutrient you're supposed to eat more of this week. It's about building meals and habits that work in your actual life."),
      p("Protein can be part of that. So can fiber. So can fat. So can understanding what's in the food you're buying."),
      p("But there is something else that's just as important: learning to make choices without turning every meal into a negotiation."),
      p("My goal isn't for you to become really, really good at following another set of rules. I want you to become confident enough to make choices for yourself. No perfection required."),
      p("I've got something coming soon that will help you practice exactly that. Stay tuned."),
    ]),
    ctaLabel: "",
    ctaUrl: "",
    audienceGroup: "health",
    suggestedSendAt: "2026-09-15T10:00:00",
  },
  {
    key: "warmup-5",
    phase: "warmup",
    subject: "What if you tried something different for 5 days?",
    previewText: "Forget forever. What about five days?",
    headline: "What if you tried something different for 5 days?",
    bodyHtml: joinHtml([
      p("What if I asked you to forget about forever? Forget “I can never eat that again.” Forget “I have to completely change my diet.” Forget “my family will never go for this.” Forget “healthy eating is too expensive.” Forget “I don't have time.”"),
      p("And instead… what if we focused on <strong>five days?</strong>"),
      p("Five days of getting curious about what's actually in your food. Five days of learning how to read labels differently. Five days of spotting where added sugars may be hiding. Five days of practicing how to put together satisfying meals with protein, fat, and fiber. Five days of making healthier choices in the real world — even when you're eating out."),
      p("Not because five days will magically fix everything. But because five days is enough time to start proving something incredibly important to yourself: <strong>I can do this.</strong>"),
      p("If you've spent years telling yourself “I always fail,” “I can't stick with anything,” “I've already tried everything” — maybe the first thing we need to change isn't your entire life. Maybe we need to give you an experience that shows you change is possible."),
      p("That's exactly what I've been working on. I'll tell you all about it very soon."),
      p("You don't have to wait until Monday. And you definitely don't have to be perfect."),
    ]),
    ctaLabel: "",
    ctaUrl: "",
    audienceGroup: "health",
    suggestedSendAt: "2026-09-17T10:00:00",
  },

  // ── Promo (health list, starts ~Sept 18) ───────────────────────────────────
  {
    key: "promo-1",
    phase: "promo",
    subject: `It's here! Join my FREE ${NAME}`,
    previewText: "Five days. Real food. Real life. Starts September 28.",
    headline: "It's happening!",
    subheadline: `${NAME} · starts September 28`,
    bodyHtml: joinHtml([
      p(`On <strong>September 28</strong>, I'm kicking off my FREE <strong>${NAME}</strong> for women 40+.`),
      p("And before you think “Oh great. Another diet.” — nope."),
      p("This isn't about counting every calorie, starving yourself, or adding another giant list of foods you “shouldn't” eat. For five days, we're doing something different. We're getting CURIOUS."),
      p("You'll learn what's actually considered processed food, how to read a food label, where added sugar may be hiding, how to build meals using protein, fat, and fiber, and how to make healthier swaps — even when you're eating out."),
      p("What I really want you to walk away with is <strong>confidence</strong>. I want you to finish these five days thinking: “Wait… I CAN do this.”"),
      p("Home base is the app I built for you — daily check-ins, food logging, recipes, chat, and push reminders. We also meet live on Google Meet Monday, Wednesday, and Friday at 12:00 pm Mountain (one hour). Tuesday and Thursday you'll get a video plus recipes in the app."),
      p("Progress, not perfection. No Monday restart. Just five days to see what's possible."),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-18T10:00:00",
  },
  {
    key: "promo-2",
    phase: "promo",
    subject: "What if YOU aren't the problem?",
    previewText: "You've tried eating less. You've tried the newest diet. Then you get blamed.",
    headline: "What if YOU aren't the problem?",
    bodyHtml: joinHtml([
      p("You've tried eating less. You've tried the newest diet. You've sworn off certain foods. You've promised yourself you'll have more willpower."),
      p("And when it doesn't last? You know who gets blamed. YOU. “I have no discipline.” “I always fail.” “Why can't I just stick with it?”"),
      p("Maybe we need a different experiment. Instead of another diet… what happens when you learn? When you start noticing what's actually in the foods you're eating? When you learn to read a label? When you understand how to put protein, fat, and fiber together? When you practice healthier swaps instead of trying to make every meal perfect? And when someone is there to support you while you do it?"),
      p(`That's what the FREE <strong>${NAME}</strong> is about. Five days to slow down, practice, learn, and prove to yourself that you are capable of making different choices.`),
      p("I don't want you depending on another diet to tell you what you're “allowed” to eat. I want you to become more confident making those decisions for yourself."),
      p("We start September 28."),
    ]),
    ctaLabel: "Yes, I'm in — save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-19T10:00:00",
  },
  {
    key: "promo-3",
    phase: "promo",
    subject: "How many Mondays have you started over?",
    previewText: "One choice doesn't erase the choices you made before it.",
    headline: "“I'll start Monday.”",
    bodyHtml: joinHtml([
      p("How many times have you said that? Monday comes. You're motivated. You eat the “right” breakfast. You make the “good” choices. You're feeling pretty proud of yourself."),
      p("Then life happens. You're tired. Dinner doesn't go as planned. The house gets quiet. You find yourself snacking. And suddenly your brain decides: “Well, I blew it.”"),
      p("So you promise yourself you'll start again. Monday. Next month. After vacation. After the holidays."),
      p("Can we stop doing that? One choice doesn't erase the choices you made before it. And you don't need to “start over.”"),
      p(`That's one of the reasons I'm hosting the FREE <strong>${NAME}</strong>. Yes, we're going to spend five days focusing on less processed food and more whole-food choices. But underneath that, I want you to practice something bigger: <strong>making a choice and moving forward.</strong>`),
      p("No “I was good.” No “I was bad.” No “I blew it, so I might as well…” Just: What did I learn? What can I choose next?"),
      p("We begin September 28."),
    ]),
    ctaLabel: "Join the free challenge",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-21T10:00:00",
  },
  {
    key: "promo-4",
    phase: "promo",
    subject: "You're eating HOW much sugar?",
    previewText: "Most of us aren't sitting around with a sugar bowl. That's not the problem.",
    headline: "How much added sugar do you think you're eating?",
    bodyHtml: joinHtml([
      p("Do you actually know? Most of us aren't sitting around spooning sugar straight out of the bag."),
      p("It's the everyday foods that can make awareness tricky. The breakfast you grabbed because you were rushing. The coffee drink. The sauce. The dressing. The snack that says something healthy-looking on the front of the package."),
      p("This is exactly why I don't want you blindly following another diet. <strong>I want you to know what you're choosing.</strong>"),
      p(`During my FREE <strong>${NAME}</strong>, we're going to turn those packages around and actually LOOK. You'll learn how to read food labels and recognize added sugars so you can make more informed choices.`),
      p("Not because sugar is “bad.” Not because you need another thing to feel guilty about. Because awareness changes things."),
      p("There's a big difference between “I can't eat that” and “I understand what's in that, and I get to decide.” THAT is the kind of confidence I want you to build."),
      p("We start September 28. Five days. Real food. Real-life skills. And absolutely no food police."),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-22T10:00:00",
  },
  {
    key: "promo-5",
    phase: "promo",
    subject: "Protein is not the answer.",
    previewText: "There. I said it. We'll still eat protein.",
    headline: "Protein is not the answer.",
    bodyHtml: joinHtml([
      p("There. I said it. Now, before you send me an angry email… protein matters."),
      p("But simply adding more protein isn't going to magically change your entire relationship with food. You can eat more protein and STILL find yourself at 9 PM negotiating with the pantry. “Maybe I'll just have one.” “I deserve it.” “I've been good today.” “Okay… one more.” “Ugh. Why did I do that?”"),
      p("Knowing what to eat and consistently making choices that support you are two different things."),
      p(`That's why Day 4 of my <strong>${NAME}</strong> isn't just “EAT MORE PROTEIN!” We're going to talk about building meals using protein, fat AND fiber.`),
      p("And throughout the challenge, we're going to look at the bigger picture: labels, added sugars, processed versus whole foods, real-life swaps, eating out, your habits, and your choices."),
      p("You don't need another nutrition trend to obsess over. You need practical skills you can use after the challenge is over."),
      p("We start September 28, and it's completely FREE. And yes… we'll still eat protein."),
    ]),
    ctaLabel: "Join the 5-day Real Food Reset",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-23T10:00:00",
  },
  {
    key: "promo-6",
    phase: "promo",
    subject: "“But healthy food is too expensive…”",
    previewText: "We're not creating a perfect life for five days.",
    headline: "We're not creating a perfect life for five days.",
    bodyHtml: joinHtml([
      p("Whenever we talk about eating differently, I hear some version of this: “Healthy food costs too much.” Or “I don't have time to cook everything from scratch.” Or “My family isn't going to eat like this.” And my personal favorite: “I've tried changing my diet before. It never lasts.”"),
      p("I hear you. But here's the thing: <strong>we're learning how to make better choices inside the life you already have.</strong>"),
      p("You don't need a refrigerator full of fancy ingredients. You don't need to spend Sunday meal-prepping 37 containers of chicken and broccoli. And you certainly don't need your family standing around the kitchen applauding your new food choices."),
      p("You need some simple skills. What am I buying? What's actually in it? What's a better swap? How can I put together a meal that satisfies me? What can I choose when I'm not eating at home?"),
      p(`That's what we're practicing inside my FREE <strong>${NAME}</strong>, starting September 28.`),
      p("You'll have recipes, a food log in the app, daily check-ins, and live support Monday / Wednesday / Friday at 12:00 pm Mountain. You don't have to figure everything out yourself."),
      p("And if you're already thinking “But what if I fail?” — good. Come anyway. We're not looking for perfect. We're looking for progress."),
    ]),
    ctaLabel: "Join the free challenge",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-24T10:00:00",
  },
  {
    key: "promo-7",
    phase: "promo",
    subject: "September 28 is getting close!",
    previewText: "You don't need to get ready before you get ready.",
    headline: "Consider this your friendly nudge.",
    bodyHtml: joinHtml([
      p("If you've been reading my emails thinking “That sounds good.” “I should probably do that.” “Maybe I'll sign up later…” — consider this your friendly nudge."),
      p("<strong>Join us.</strong> You don't need to get ready before you get ready. You don't need to clean out your entire pantry first. You don't need to lose five pounds before joining. You don't need to have your meal plan figured out."),
      p("That's what the challenge is FOR."),
      p("For five days, I'm going to help you understand processed vs. whole foods, read food labels with more confidence, recognize added sugars, build meals with protein, fat, and fiber, and navigate eating out and healthier swaps."),
      p("Plus: recipes, a food log in the app, daily check-ins, three Google Meet lives (Mon/Wed/Fri at 12:00 pm Mountain), and support along the way."),
      p("It's FREE. The only thing I'm asking you to bring is a willingness to get curious and try."),
      p("You have nothing to prove to me. But you might have something pretty important to prove to yourself: <strong>I can make a change.</strong>"),
    ]),
    ctaLabel: "Save my spot for September 28",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-26T10:00:00",
  },
  {
    key: "promo-8",
    phase: "promo",
    subject: "Last call: We start tomorrow!",
    previewText: "Don't do it perfectly. Come anyway.",
    headline: "Tomorrow we begin.",
    bodyHtml: joinHtml([
      p(`This is it. <strong>Tomorrow we begin the FREE ${NAME}.</strong>`),
      p("If you've been sitting on the fence because you're worried you won't do it perfectly… I'm going to make this easy for you: <strong>Don't do it perfectly.</strong>"),
      p("Come do it imperfectly. Come learn. Come ask questions. Come discover what's actually in the foods you've been buying. Come try some different meals. Come notice your habits. Come see what happens when you stop waiting for the perfect Monday and simply take the next step."),
      p("<strong>Day 1:</strong> Processed food vs. whole food (live, 12:00 pm Mountain)<br/><strong>Day 2:</strong> How to read a food label (video in the app)<br/><strong>Day 3:</strong> Let's talk sugar (live)<br/><strong>Day 4:</strong> Pairing protein, fat, and fiber (video in the app)<br/><strong>Day 5:</strong> Eating out, healthier swaps, Q&amp;A + your next steps (live)"),
      p("This isn't about proving how “good” you can be for five days. It's about learning skills you can take with you long after the challenge ends."),
      p("If your brain is saying “I don't have time.” “I've tried before.” “I'll probably fail.” “I'll do the next one.” — here's my answer: <strong>Come anyway.</strong>"),
      p("Registration closes tonight. We start tomorrow. Let's stop starting over."),
    ]),
    ctaLabel: "Join before we start",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-27T10:00:00",
  },

  // ── Daily challenge (registrants only) ─────────────────────────────────────
  {
    key: "day-1",
    phase: "challenge_day",
    subject: "Day 1: Processed vs. whole food — we go live at noon",
    previewText: "Open the app, check in, and join us at 12:00 pm Mountain.",
    headline: "Day 1 is here.",
    subheadline: "Processed food vs. whole food",
    bodyHtml: joinHtml([
      p("Welcome. Today we start with the basics: what do we actually mean when we say “processed food”?"),
      p(`We go live at <strong>12:00 pm Mountain</strong> for one hour. The Google Meet button is in the app — join from there.`),
      p("Your only job today: show up, get curious, and log what you eat in the app. Progress, not perfection. One “imperfect” choice does not cancel the day."),
      p("Open the habit tracker, join today's challenge check-in, and I'll see you on Meet."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-28T08:30:00",
  },
  {
    key: "day-2",
    phase: "challenge_day",
    subject: "Day 2: Turn the package around",
    previewText: "No live call today. Your video and recipes are in the app.",
    headline: "Day 2 — food-label detective",
    bodyHtml: joinHtml([
      p("No live call today. Your lesson is a short video in the app, plus recipes and a simple label-detective prompt."),
      p("The move is the same one I'll keep repeating: <strong>turn it around.</strong> Ignore the “healthy / natural / high protein” on the front. Look at the ingredients, serving size, and added sugar."),
      p("Check in for Day 2 in the app when you've watched the video (or when you've flipped at least one package). If you have a question, send it in app chat — I read those."),
    ]),
    ctaLabel: "Open today's lesson",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-29T08:30:00",
  },
  {
    key: "day-3",
    phase: "challenge_day",
    subject: "Day 3: Let's talk sugar — live at noon",
    previewText: "No sugar police. Just awareness.",
    headline: "Day 3 — let's talk sugar",
    bodyHtml: joinHtml([
      p("Sugar shows up under a lot of names, in foods you might not expect. Today we look at that together — without turning you into the sugar police."),
      p("Google Meet at <strong>12:00 pm Mountain</strong>, one hour. Log today's meals in the app so you can actually see the pattern, not just guess."),
      p("See you at noon."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-30T08:30:00",
  },
  {
    key: "day-4",
    phase: "challenge_day",
    subject: "Day 4: Protein is not the answer",
    previewText: "Build a plate: protein + fat + fiber. Video in the app.",
    headline: "Day 4 — protein, fat, and fiber",
    bodyHtml: joinHtml([
      p("No live call today. Your video and recipes are waiting in the app."),
      p("Protein matters. It still isn't the whole story. Today we practice putting protein, fat, and fiber on the same plate so a meal actually satisfies you."),
      p("Check off Day 4 when you've watched the video or built one plate that way. Questions go in app chat."),
    ]),
    ctaLabel: "Open today's lesson",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-10-01T08:30:00",
  },
  {
    key: "day-5",
    phase: "challenge_day",
    subject: "Day 5: Real life — live at noon",
    previewText: "Eating out, swaps, Q&A, and what comes next.",
    headline: "Day 5 — real food in the real world",
    bodyHtml: joinHtml([
      p("Last day. This is the one that matters: what happens when you go out to eat, when the schedule gets crazy, when the “perfect” option isn't available."),
      p("Google Meet at <strong>12:00 pm Mountain</strong>. Bring your questions. We'll talk swaps, eating out, and your next step after these five days."),
      p("You do not have to have been perfect to show up. Come anyway."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-10-02T08:30:00",
  },
];

export function getRealFoodResetConfirmationEmail(
  firstName: string,
  claimToken?: string | null
): {
  subject: string;
  html: string;
  text: string;
} {
  const name = firstName.trim() || "friend";
  const subject = `You're in: ${NAME} starts September 28`;
  const appUrl = claimToken ? `${APP}?claim=${encodeURIComponent(claimToken)}` : APP;
  const bodyHtml = joinHtml([
    p(`You're registered for the FREE <strong>${NAME}</strong>. We start <strong>Monday, September 28</strong>.`),
    p("<strong>The app is home base.</strong> That's where you'll check in daily, log food, get Tuesday/Thursday videos and recipes, and message me. Push notifications will nudge you — you can turn those on in the app."),
    p("<strong>Lives:</strong> Monday, Wednesday, and Friday at 12:00 pm Mountain, one hour. The Google Meet button is in the app after you’re enrolled — not on the signup page. Tuesday and Thursday are video + recipes in the app."),
    p("Progress, not perfection. One messy meal does not mean you start over on Monday."),
    p("Open the tracker now so it's on your phone before we begin:"),
  ]);
  const html = buildNewsletterHtml({
    firstName: name,
    previewText: "App is home base. Lives are M/W/F at 12:00 pm Mountain.",
    headline: "You're in.",
    subheadline: `${NAME} · Sept 28–Oct 2`,
    bodyHtml,
    ctaLabel: "Open the habit tracker",
    ctaUrl: appUrl,
  });
  const text = `Hi ${name},\n\nYou're registered for ${NAME}. We start Monday, September 28.\n\nThe app is home base: ${appUrl}\nLives: Mon/Wed/Fri at 12:00 pm Mountain in Google Meet (join from the app).\nTue/Thu: video + recipes in the app.\nOn iPhone, sign in to the Habit Tracker with this same email.\n\nProgress, not perfection.\n\n${BRAND.coachName}`;
  return { subject, html, text };
}

export function getRealFoodResetReasonLine(audience: string): string {
  if (audience === "real_food_reset") {
    return `You're receiving this because you registered for ${NAME} at mindandbodyresetcoach.com.`;
  }
  return "You're receiving this because you joined our health & wellness list at mindandbodyresetcoach.com.";
}

function wrapDraft(draft: RealFoodResetEmailDraft, firstName: string): { subject: string; html: string } {
  return {
    subject: draft.subject,
    html: buildNewsletterHtml({
      firstName,
      previewText: draft.previewText,
      headline: draft.headline,
      subheadline: draft.subheadline ?? null,
      bodyHtml: draft.bodyHtml,
      ctaLabel: draft.ctaLabel || null,
      ctaUrl: draft.ctaUrl || null,
    }),
  };
}

const DAY_DRAFTS = REAL_FOOD_RESET_EMAILS.filter((e) => e.phase === "challenge_day");

export const REAL_FOOD_RESET_DAY_EMAILS = DAY_DRAFTS.map(
  (draft) => (firstName: string) => wrapDraft(draft, firstName)
);

export const REAL_FOOD_RESET_DAY_DATES = ["2026-09-28", "2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02"] as const;
