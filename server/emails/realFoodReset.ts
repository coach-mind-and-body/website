import { BRAND, SITE_URL } from "@shared/brand";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import { buildNewsletterHtml } from "./newsletterShell";

const LANDING = `${SITE_URL}${REAL_FOOD_RESET.path}`;
const APP = `${SITE_URL}/habit-tracker`;
const BOOK = `${SITE_URL}/book`;
const NAME = REAL_FOOD_RESET.name;

function bookLine(): string {
  return p(
    `Want a one-on-one conversation? Book a free discovery call here: <a href="${BOOK}">mindandbodyresetcoach.com/book</a>.`
  );
}

export type RealFoodResetEmailPhase = "warmup" | "promo" | "reminder" | "challenge_day" | "confirmation" | "offer";

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
  audienceGroup: "health" | "snack_hack" | "real_food_reset";
  /** Suggested Mountain-time send, ISO local without Z */
  suggestedSendAt: string;
};

function p(text: string): string {
  return `<p>${text}</p>`;
}

function guideImg(path: string, alt: string): string {
  return `<img src="${SITE_URL}${path}" alt="${alt}" width="560" style="max-width:100%;height:auto;border-radius:12px;display:block;margin:16px auto;border:1px solid #f0e8e4;" />`;
}

function joinHtml(parts: string[]): string {
  return parts.join("\n");
}

function ul(items: string[]): string {
  return `<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
}

function h3(text: string): string {
  return `<h3>${text}</h3>`;
}

export const REAL_FOOD_RESET_EMAILS: RealFoodResetEmailDraft[] = [
  // ── Warm-up (snack-hack leads → join the 5-day challenge) ──────────────────
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
      p(`If you want to practice that with me, save your free spot in <strong>${NAME}</strong>. We start September 28.`),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "snack_hack",
    suggestedSendAt: "2026-09-18T10:00:00",
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
      p(`That's the kind of noticing we'll do together in <strong>${NAME}</strong>. It's free. Starts September 28.`),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "snack_hack",
    suggestedSendAt: "2026-09-20T10:00:00",
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
      p(`We'll practice this together in <strong>${NAME}</strong>. Free. Starts September 28.`),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "snack_hack",
    suggestedSendAt: "2026-09-22T10:00:00",
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
      p(`That's what <strong>${NAME}</strong> is for. Free. Five days. Starts September 28.`),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "snack_hack",
    suggestedSendAt: "2026-09-24T10:00:00",
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
      p("That's exactly what I've been working on. It's free. It starts September 28. And you can save your spot right now."),
      p("You don't have to wait until Monday. And you definitely don't have to be perfect."),
    ]),
    ctaLabel: "Save my free spot",
    ctaUrl: LANDING,
    audienceGroup: "snack_hack",
    suggestedSendAt: "2026-09-26T10:00:00",
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
      p("Home base is the app I built for you — daily check-ins, food logging, recipes, chat, and push reminders. We also meet live on Google Meet Monday, Wednesday, and Friday at 1:00 pm Mountain (one hour). Tuesday and Thursday you'll get a video plus recipes in the app."),
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
    ctaLabel: "Join the 5-Day No Processed Food Challenge",
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
      p("You'll have recipes, a food log in the app, daily check-ins, and live support Monday / Wednesday / Friday at 1:00 pm Mountain. You don't have to figure everything out yourself."),
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
      p("Plus: recipes, a food log in the app, daily check-ins, three Google Meet lives (Mon/Wed/Fri at 1:00 pm Mountain), and support along the way."),
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
      p("<strong>Day 1:</strong> Start seeing — processed vs. whole food (live, 1:00 pm Mountain)<br/><strong>Day 2:</strong> Flip it — how to read a food label (video in the app)<br/><strong>Day 3:</strong> Sugar detective (live)<br/><strong>Day 4:</strong> Build it — protein + fat + fiber (video in the app)<br/><strong>Day 5:</strong> Keep going — eating out, swaps, Q&amp;A + your next steps (live)"),
      p("This isn't about proving how “good” you can be for five days. It's about learning skills you can take with you long after the challenge ends."),
      p("If your brain is saying “I don't have time.” “I've tried before.” “I'll probably fail.” “I'll do the next one.” — here's my answer: <strong>Come anyway.</strong>"),
      p("Registration closes tonight. We start tomorrow. Let's stop starting over."),
    ]),
    ctaLabel: "Join before we start",
    ctaUrl: LANDING,
    audienceGroup: "health",
    suggestedSendAt: "2026-09-27T10:00:00",
  },

  // ── Prep reminders (registrants only) ──────────────────────────────────────
  {
    key: "reminder-pantry",
    phase: "reminder",
    subject: "Quick question: What's hiding in your pantry?",
    previewText: "Don't clean it out. Just look.",
    headline: "Quick question: What's hiding in your pantry?",
    bodyHtml: joinHtml([
      p("We're getting closer to the 5-Day No Processed Food Challenge, and I have a tiny assignment for you today."),
      p("And when I say tiny, I mean it. <strong>Please don't clean out your pantry.</strong>"),
      p("Instead, open it. Take a look at what's actually in there. Cereal? Crackers? Protein bars? Granola? Bread? Snacks? Sauces?"),
      p("You don't need to decide whether any of it is “good” or “bad.” Today, I simply want you to ask: <strong>How much of what I eat every day comes from a package?</strong>"),
      p("No judgment. No throwing things away. No sudden declaration that you're “never eating that again.” Just notice. Because you can't make an intentional choice about something you haven't noticed yet."),
      p("That's exactly where we're starting on Day 1."),
      p(`The goal isn't more food rules. ${REAL_FOOD_RESET.philosophy}`),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-22T10:00:00",
  },
  {
    key: "reminder-breakfast",
    phase: "reminder",
    subject: "Before breakfast tomorrow, do THIS...",
    previewText: "Don't change it yet. Look at it.",
    headline: "Before breakfast tomorrow, do THIS...",
    bodyHtml: joinHtml([
      p("Okay, today's challenge-before-the-challenge is ridiculously simple."),
      p("Tomorrow morning, before you eat breakfast... <strong>look at it.</strong> That's all."),
      p("What do you normally grab? Yogurt? Cereal? Toast? Eggs? Protein shake? Granola bar on your way out the door? Coffee with creamer that technically deserves its own food group?"),
      p("Don't change it yet. Instead, ask: <strong>How much of this breakfast comes from a package?</strong>"),
      p("Then notice what happens in your brain. Do you immediately think, “Oh no, I shouldn't eat that”? Stop right there. We're not doing shoulds and shouldn'ts. We're gathering information."),
      p("That's one of the biggest things I want you to practice: <strong>curiosity instead of judgment.</strong> You don't have to fix everything today. You just have to start seeing what's actually there."),
      p("We start September 28."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-23T10:00:00",
  },
  {
    key: "reminder-1",
    phase: "reminder",
    subject: "But... I thought this was healthy",
    previewText: "Find one “healthy” package. Don't throw it away.",
    headline: "But... I thought this was healthy",
    bodyHtml: joinHtml([
      p("Have you ever bought something because the front said HIGH PROTEIN! NATURAL! MADE WITH WHOLE GRAINS! NO ADDED... SOMETHING!"),
      p("Today I want you to find <strong>one packaged food</strong> in your kitchen that you think of as “healthy.” A protein bar. Yogurt. Granola. Cereal. Bread. Plant milk. Coffee creamer."),
      p("Don't change it. Don't throw it away. And don't start Googling every ingredient. Just notice: why did I choose this particular product? The package? Something you heard online? Habit? Convenience? Taste?"),
      p("We're going to learn how to look beyond the front of the package during the challenge. For now... notice."),
      p("And while you're in the kitchen, here's the whole-food list for next week. Frozen veggies count. Eggs count. Leftover protein counts. You do not need a kitchen makeover."),
      guideImg(
        "/real-food-reset/whole-foods.png",
        "Foods to enjoy: vegetables, protein, nuts and seeds, fruits, healthy fats, beans, whole grains, drinks, and simple condiments"
      ),
      p("The same list lives in the app under Challenge. Jot down a few whole or minimally processed foods you'll want on hand. That's it."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-24T10:00:00",
  },
  {
    key: "reminder-packages",
    phase: "reminder",
    subject: "Try this for ONE day",
    previewText: "Notice every time you open a package to eat.",
    headline: "Try this for ONE day",
    bodyHtml: joinHtml([
      p("I have a little experiment for you today."),
      p("For <strong>one normal day</strong>, notice every time you open a package to eat something. That's it."),
      p("Don't count calories. Don't count carbs. Don't try to eat “perfectly.” Just mentally notice: package. Breakfast → package? Snack → package? Lunch → package? Afternoon pick-me-up → package? Dinner sauce → package? Something while watching TV → package?"),
      p("You may discover that packaged food shows up more — or less — than you expected. Either answer is useful."),
      p("This challenge isn't about me telling you everything you're doing wrong. It's about helping you finally SEE what you're actually eating so YOU can make more informed choices. No judgment. No food police. Just information."),
      p("Tonight, also notice what happens after dinner. Looking for something sweet? Wandering back into the kitchen? “I've been good all day...” You don't have to fix it. Just get curious."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-25T10:00:00",
  },
  {
    key: "reminder-2",
    phase: "reminder",
    subject: "Please don't throw out your food",
    previewText: "You do not need to empty the pantry. Here's what to eat instead.",
    headline: "Please don't throw out your food",
    bodyHtml: joinHtml([
      p("Important pre-challenge announcement: <strong>you do NOT need to throw everything in your pantry away.</strong> I mean it."),
      p("The goal of this challenge isn't “processed food is evil and I shall never eat it again.” We're spending five days focusing on whole and minimally processed foods while taking a break from ultra-processed foods. Why? Because sometimes the best way to notice our habits is to step outside of them for a little while."),
      p("So today, open the refrigerator or pantry again. But this time ask: <strong>What whole or minimally processed foods do I ALREADY eat and enjoy?</strong> Fruit? Vegetables? Eggs? Plain Greek yogurt? Nuts? Beans? Oats? Fish? Chicken? Maybe you're doing more than you've been giving yourself credit for. Notice that, too."),
      p("If your brain is already saying “I don't know what I'm supposed to cook,” here are a few plates. Mix and match. Leftovers count as lunch. Keep it simple. You do not need 17 new recipes."),
      guideImg(
        "/real-food-reset/meal-ideas.png",
        "Whole food meal ideas for breakfast, lunch, dinner, and snacks"
      ),
      p("These pictures are in the app too — Challenge tab — so you don't have to hunt through email while you're standing in the kitchen."),
    ]),
    ctaLabel: "Open the habit tracker",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-26T10:00:00",
  },
  {
    key: "reminder-tomorrow",
    phase: "reminder",
    subject: "TOMORROW! Your 5-Day Challenge starts",
    previewText: "No perfect pantry required. We start seeing what we're actually eating.",
    headline: "Tomorrow we begin.",
    bodyHtml: joinHtml([
      p("It's almost go time. Tomorrow we officially begin the 5-Day No Processed Food Challenge."),
      p("But before we start, I want you to remember something: <strong>you do NOT have to prove anything to me this week.</strong> You don't have to be the “best” challenger. You don't need five perfect days. You don't need to panic if something doesn't go according to plan."),
      p("We're going to learn. Notice. Experiment. Make different choices. And most importantly... keep going."),
      p("Tonight, take one last look around your kitchen. Ask the question you've been practicing: <strong>How much of what I eat every day comes from a package?</strong> Tomorrow, we're going to start figuring out what that actually means."),
      h3("Your Day 1 reminders"),
      ul([
        "We begin Monday, September 28",
        `Live at ${REAL_FOOD_RESET.liveTime}, one hour — join from the app`,
        "Have the food tracker ready (logging a meal counts)",
        "Come exactly as you are. No perfect pantry required.",
      ]),
      p("This is usually the point when the brain says, “I should probably eat ALL THE THINGS now.” You don't need a last supper. And you don't need to start restricting early either. Eat normally. Pay attention."),
      p("Tomorrow we start seeing what we're actually eating. I can't wait."),
    ]),
    ctaLabel: "Open the habit tracker",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-27T08:30:00",
  },

  // ── Daily challenge (registrants only) ─────────────────────────────────────
  {
    key: "day-1",
    phase: "challenge_day",
    subject: "Day 1: Did your pantry surprise you?",
    previewText: "NOTICE → SWAP ONE → TRACK. We go live at 1:00 pm Mountain.",
    headline: "Day 1 is in the books — wait, not yet.",
    subheadline: "Start seeing",
    bodyHtml: joinHtml([
      p("Day 1 is here. And I have one question: did you discover something today that surprised you?"),
      p("Maybe it was a food you never really thought of as processed. Maybe you realized how often packaged foods sneak into your day simply because they're convenient. Or maybe your biggest realization was, “Wait... I actually have a LOT of whole foods I can eat.”"),
      p("Whatever you discover, that's today's win. Remember, our goal isn't perfection. For these five days, we're focusing on whole and minimally processed foods while taking a break from ultra-processed foods."),
      p(`We go live at <strong>${REAL_FOOD_RESET.liveTime}</strong> for one hour. The Google Meet button is in the app — join from there.`),
      h3("Today's assignment is ridiculously simple"),
      ul([
        "<strong>NOTICE</strong> where ultra-processed foods normally show up in your day.",
        "<strong>SWAP ONE</strong> of them for a whole or minimally processed option.",
        "<strong>TRACK</strong> what you eat — and more importantly, what you notice.",
      ]),
      p("If you eat something ultra-processed? You haven't failed. Don't compensate. Don't beat yourself up. And please don't schedule another Monday restart."),
      p("Notice it. Learn from it. Make your next choice."),
      p("Your question tonight: <strong>What's ONE thing you see differently about your food after today?</strong> Write it in the app journal under Challenge."),
      p("And keep the package you grabbed during today's live handy... because tomorrow we're turning it over."),
      p(REAL_FOOD_RESET.philosophy),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-28T08:30:00",
  },
  {
    key: "day-2",
    phase: "challenge_day",
    subject: "Day 2: Stop trusting the front",
    previewText: "FLIP IT. No live call — video and the label challenge are in the app.",
    headline: "Day 2: Stop trusting the front",
    subheadline: "Flip it",
    bodyHtml: joinHtml([
      p("Yesterday, you started seeing what you're actually eating. Today? We're turning it around. Literally."),
      p("Welcome to Day 2: <strong>FLIP IT.</strong>"),
      p("Food packages are really good at getting our attention. High protein! Natural! Low fat! Made with whole grains! But today I want you to start building a new habit: <strong>don't just read the front. Flip it.</strong>"),
      p("No live call today. There's a short video in the app showing you exactly where I want you to look. You do NOT need a nutrition degree. We're keeping this simple."),
      p("Today we're looking at: ingredients, added sugar, serving size, protein, fiber, total carbohydrate, and fat."),
      h3("Your FLIP IT challenge"),
      p("Find TWO versions of the same type of food. Two yogurts. Two protein bars. Two breads. Two cereals. Two plant milks. Two coffee creamers. Whatever YOU actually buy."),
      p("Turn them over. Compare the labels. Then answer: <strong>Knowing what I know now, which would I choose — and WHY?</strong>"),
      p("We're not searching for the “perfect” food. We're practicing making an informed decision."),
      p("And pay particular attention to Added Sugars today... because tomorrow? We're going there."),
      p("<strong>P.S.</strong> Here's something else I want you to notice today. Now that you know how to read the label... does knowing what's in the food automatically make every decision easy? Or do you sometimes KNOW exactly what you want to choose and still find yourself negotiating? “I'll just have one.” “I've been good today.” “I'll start again tomorrow.”"),
      p("Don't judge it. Just notice it. That's part of what I call <strong>food noise</strong> — and we're going to talk about why knowing what to eat isn't always enough."),
    ]),
    ctaLabel: "Open today's lesson",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-29T08:30:00",
  },
  {
    key: "day-3",
    phase: "challenge_day",
    subject: "Day 3: Sugar detectives — report for duty",
    previewText: "Find 3 foods with added sugar. Live at 1:00 pm. No food police.",
    headline: "Day 3: Let's talk sugar",
    subheadline: "Sugar detective",
    bodyHtml: joinHtml([
      p("If the Added Sugars line made you raise an eyebrow yesterday — good. Today we go there. Together. Without turning you into the sugar police."),
      p(`Google Meet at <strong>${REAL_FOOD_RESET.liveTime}</strong>, one hour. Join from the app.`),
      h3("Your mission"),
      p("Find <strong>3 foods you regularly eat</strong> that contain Added Sugars. For each one, notice:"),
      ul([
        "What is the food?",
        "How many grams of Added Sugars does the label show per serving?",
        "What name for a sweetener did you find in the ingredients?",
        "Did you EXPECT it to be there?",
      ]),
      p("Then choose: <strong>KEEP IT</strong> — yep, I'm keeping this one. <strong>SWAP IT</strong> — I found an option I like better. Or <strong>CHOOSE IT INTENTIONALLY</strong> — I'm keeping it, but now I know what I'm choosing."),
      p("No food police allowed. The goal isn't more food rules. It's more food confidence."),
      p("More rules aren't the goal of this week — and they aren't the goal of the work I do after it, either. That's why the next step I built is called <strong>6 Habits in 6 Weeks to Quiet Food Noise</strong>. Not another list. Habits. We'll talk more about that when we get to real life on Friday. Today: be a detective, not a judge."),
    ]),
    ctaLabel: "Open the app",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-09-30T08:30:00",
  },
  {
    key: "day-4",
    phase: "challenge_day",
    subject: "Day 4: Protein is NOT the answer",
    previewText: "BUILD IT → SNAP IT → SHARE IT. Video in the app.",
    headline: "Day 4: Protein is NOT the answer",
    subheadline: "Build it",
    bodyHtml: joinHtml([
      p("Before you come for me... YES. Protein matters. But if your entire nutrition strategy has become MORE PROTEIN! ... we need to talk."),
      p("Because today I'm going to show you a ridiculously simple way to BUILD a meal instead of constantly wondering, “What am I supposed to eat?”"),
      p("Today's formula: <strong>protein + fat + fiber</strong>."),
      p("You do NOT need to count calories. You don't need a macro calculator. You don't need to weigh your chicken breast. And after yesterday's sugar conversation, we're definitely NOT declaring all carbohydrates bad. We're learning how to look at the WHOLE meal."),
      p("No live call today. Your video, the “where's my protein / fat / fiber?” guide, and recipes are in the app."),
      h3("BUILD IT → SNAP IT → SHARE IT"),
      ul([
        "Build ONE meal using today's formula. Breakfast, lunch, or dinner.",
        "Take a picture before you eat. Ugly broccoli counts. Paper plates count.",
        "Write in the app: my protein, my fat, my fiber, and something I noticed afterward.",
      ]),
      p("I don't want perfect plates. I want REAL plates. Your Tuesday-at-6:47-PM-I-have-no-idea-what-to-make plate. THAT'S where lifestyle change actually has to work."),
      p("<strong>Bonus reflection:</strong> If I already know what to eat, where do I STILL get stuck? Nighttime. Weekends. Cravings. Stress. Eating out. All-or-nothing. Starting over. Constant negotiating. Write one."),
      h3("But there's another part of this..."),
      p("You can build the “perfect” plate and still have food noise. You can know exactly what you want to eat and still find yourself negotiating at night. You can have a great Monday through Thursday and still feel like the wheels come off every weekend."),
      p("That's because knowing what to eat is ONE skill. Building the habits that help you consistently live it is another. That's exactly what I work on inside my private coaching program: <strong>6 Habits in 6 Weeks to Quiet Food Noise</strong>."),
      p("Tomorrow, during our final live session, I'll show you what that looks like and how you can continue working with me if you're ready for support. Whether you join me or not, don't miss tomorrow. We're answering: <strong>Great... but how do I keep doing this when life isn't perfect?</strong>"),
    ]),
    ctaLabel: "Open today's lesson",
    ctaUrl: APP,
    audienceGroup: "real_food_reset",
    suggestedSendAt: "2026-10-01T08:30:00",
  },
  {
    key: "day-5",
    phase: "challenge_day",
    subject: "You did it. Now comes the important part",
    previewText: "Keep going when life isn't perfect. Live at 1:00 pm. Your next step is ready.",
    headline: "You did it.",
    subheadline: "Keep going",
    bodyHtml: joinHtml([
      p("YOU DID IT. Five days. And look at everything you've learned."),
      ul([
        "You started seeing what you're actually eating.",
        "You learned to FLIP IT and read the label.",
        "You became a sugar detective.",
        "You learned how to build a meal with protein + fat + fiber.",
        "And today we talk about the skill that may matter most: how to keep going when real life isn't perfect.",
      ]),
      p(`Google Meet at <strong>${REAL_FOOD_RESET.liveTime}</strong>. Join from the app. Bring your questions. You do not have to have been perfect to show up. Come anyway.`),
      p("Because weekends happen. Restaurants happen. Stress happens. Cravings happen. 9 PM happens. And none of those things require you to throw everything away and promise, “I'll start again Monday.”"),
      p("But there's something else I want you to notice. After these five days, you probably know MORE about what to eat. But knowing what to eat isn't always the hard part. It's the negotiating. “I've been good all day...” “I deserve this...” “I'll just have one...” “I already blew it...” “I'll start again Monday.”"),
      p("THAT is where the deeper work begins."),
      p(`If you're ready for my help with that, I'd love to invite you into <strong>${REAL_FOOD_RESET.paidProgram}</strong>. This is six weeks of private, one-on-one coaching designed to help you work on the habits and patterns that keep pulling you back into the same food cycle.`),
      ul([
        "Private one-on-one coaching",
        "The same app you already opened: food log, check-ins, chat",
        "Habit tracking and program content",
        "Personal accountability and support",
      ]),
      p(`Your investment is <strong>${REAL_FOOD_RESET.paidPrice}</strong>. Because you completed the 5-Day No Processed Food Challenge with me, I'm adding a graduate bonus: <strong>one additional private coaching session — free</strong> when you enroll by <strong>${REAL_FOOD_RESET.offerClosesLabel}</strong>.`),
      p("I know you may be thinking, “But I've paid for programs before.” Or, “What if I fail again?” Here's what I want you to remember about the last five days. You weren't perfect. You didn't need to be. You LEARNED. You practiced. You noticed. You made different choices. And you kept going."),
      p("That's exactly what we'll continue doing together. Because when you get stuck... that's not where coaching failed. That's where the coaching starts."),
      p("Whether you join me for the next six weeks or continue on your own, please don't lose sight of what you've just proven: you can do this differently. No more waiting for Monday. Your next choice is your next choice."),
      p("I'm so proud of what you've accomplished this week."),
      bookLine(),
    ]),
    ctaLabel: `See ${REAL_FOOD_RESET.paidProgram}`,
    ctaUrl: `${SITE_URL}${REAL_FOOD_RESET.paidProgramPath}`,
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
    p(`You're officially IN. Welcome to the FREE <strong>${NAME}</strong>. We start <strong>Monday, September 28</strong>.`),
    p("And before you start cleaning out your pantry and throwing everything into the trash... <strong>don't.</strong> That's not what we're doing here."),
    p("Over the next five days, I'm going to help you slow down, get curious, and start seeing what you're actually eating — without turning this into another diet you have to be “perfect” at."),
    p("If you've ever thought “I know I should eat better, but I don't know where to start.” “I do great for a few days... then life happens.” Or my personal favorite: “I'll start again Monday.” You are in the right place."),
    p("This challenge isn't about being “good” for five days. And it's definitely not about creating another giant list of foods you're not allowed to eat. We're going to learn. Experiment. Pay attention. And make some simple changes together. Progress over perfection. Always."),
    h3("Here's what we're covering"),
    ul([
      "<strong>Day 1 — Start seeing.</strong> Processed vs. whole and minimally processed foods — and where ultra-processed foods may be showing up in your normal day. Live.",
      "<strong>Day 2 — Flip it.</strong> How to read a food label without needing a nutrition degree. Video in the app.",
      "<strong>Day 3 — Sugar detective.</strong> Added sugar, hidden sugars, and what those names on the ingredient list actually mean. Live.",
      "<strong>Day 4 — Build it.</strong> A simple way to build a meal using protein + fat + fiber. Video in the app.",
      "<strong>Day 5 — Keep going.</strong> Restaurants, swaps, real-life situations — and how to keep making intentional choices when life isn't perfect. Live.",
    ]),
    p("<strong>The app is home base.</strong> That's where you'll check in daily, log food, get Tuesday/Thursday videos and recipes, do the assignments, and message me. Push notifications will nudge you — turn those on in the app."),
    p(`<strong>Lives:</strong> Monday, Wednesday, and Friday at ${REAL_FOOD_RESET.liveTime}, one hour. The Google Meet button is in the app after you're enrolled — not on the signup page.`),
    p("You do NOT need to know everything before we begin. That's why you're here."),
    p("Once you're in the app, introduce yourself in chat and tell me: <strong>What made you say YES to this challenge?</strong>"),
    p(REAL_FOOD_RESET.philosophy),
    bookLine(),
    p(`Watch Lee Anne's welcome (one minute): <a href="${REAL_FOOD_RESET.welcomeVideoWatchUrl}">Play the welcome video</a>`),
    `<div style="text-align:center;margin:20px 0;">
      <a href="${REAL_FOOD_RESET.welcomeVideoWatchUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;text-decoration:none;">
        <img src="https://img.youtube.com/vi/${REAL_FOOD_RESET.welcomeVideoId}/hqdefault.jpg" alt="Watch the welcome video" width="560" style="max-width:100%;height:auto;border-radius:12px;display:block;" />
        <span style="display:inline-block;margin-top:10px;background:#c9a96e;color:#fff;padding:10px 22px;border-radius:9999px;font-weight:700;font-size:14px;">▶ Watch the welcome video</span>
      </a>
    </div>`,
    p("Open the tracker now so it's on your phone before we begin:"),
  ]);
  const html = buildNewsletterHtml({
    firstName: name,
    previewText: "App is home base. Lives are M/W/F at 1:00 pm Mountain.",
    headline: "You're in.",
    subheadline: `${NAME} · Sept 28–Oct 2`,
    bodyHtml,
    ctaLabel: "Open the habit tracker",
    ctaUrl: appUrl,
  });
  const text = `Hi ${name},\n\nYou're in: ${NAME}. We start Monday, September 28. Don't clean out the pantry.\n\nWatch the welcome video: ${REAL_FOOD_RESET.welcomeVideoWatchUrl}\n\nThe app is home base: ${appUrl}\nLives: Mon/Wed/Fri at 1:00 pm Mountain in Google Meet (join from the app).\nTue/Thu: video + assignments in the app.\nOn iPhone, sign in to the Habit Tracker with this same email.\n\nWant a one-on-one conversation? Book a free discovery call: ${BOOK}\n\n${REAL_FOOD_RESET.philosophy}\n\n${BRAND.coachName}`;
  return { subject, html, text };
}

export function getRealFoodResetReasonLine(audience: string): string {
  if (audience === "real_food_reset") {
    return `You're receiving this because you registered for ${NAME} at mindandbodyresetcoach.com.`;
  }
  if (audience === "snack_hack") {
    return `You're receiving this because you downloaded the Snack Hack guide and ${NAME} is next.`;
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

const SEQUENCE_DRAFTS = REAL_FOOD_RESET_EMAILS.filter(
  (e) => e.phase === "reminder" || e.phase === "challenge_day"
);

export const REAL_FOOD_RESET_DAY_EMAILS = SEQUENCE_DRAFTS.map(
  (draft) => (firstName: string) => wrapDraft(draft, firstName)
);

export const REAL_FOOD_RESET_DAY_DATES = [
  "2026-09-22",
  "2026-09-23",
  "2026-09-24",
  "2026-09-25",
  "2026-09-26",
  "2026-09-27",
  "2026-09-28",
  "2026-09-29",
  "2026-09-30",
  "2026-10-01",
  "2026-10-02",
] as const;
