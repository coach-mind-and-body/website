export type EpisodeSupplement = {
  summary: readonly string[];
  takeaways: readonly string[];
  /** Article used as a source, when the episode page itself was only a stub. */
  sourceBlogSlug?: string;
};

export const EPISODE_SUPPLEMENTS: Record<string, EpisodeSupplement> = {
  "why-your-brain-resists-change": {
    sourceBlogSlug: "beyond-willpower-how-to-stop-self-sabotaging-weight-loss-after-40",
    summary: [
      "This episode asks why change stalls after 40 even when someone wants it. The description frames the problem as identity lagging behind new habits, not as food itself. Many women eat well all day and then overeat at night, and then blame themselves. Actions such as eating protein, walking, fasting, and drinking water can already be in place while the brain still reaches for familiar labels like “emotional eater” or “I always fail.” The comparison in the episode is a new phone still running old software. Familiarity feels safer than a new story.",
      "The article published with this topic sets the same evening scene. It is 9 p.m. The day went well: food, water, a walk. Then the person is in the kitchen with a sleeve of crackers, watching their hand keep moving, and asking what is wrong with them. Both the episode description and the article treat that moment as the old operating system trying to restore factory settings. The brain’s job, as the article puts it, is to keep things predictable. When new actions outrun the old identity, it pulls back toward what it knows.",
      "Menopause can turn the volume up. The episode description says cravings, fatigue, stress, and weight gain can get louder, which makes the old pattern harder to ignore. Showing up anyway matters more than a perfect streak. The question the episode keeps is “Who am I becoming?” Each choice is a vote for a new identity. Three tools are named: speak in “I’m someone who…” statements, collect daily evidence of aligned actions, and challenge the old thoughts so belief is built by small repetitions. The article adds one constraint on the new identity: describe who you are becoming, not an outcome such as a number on the scale.",
    ],
    takeaways: [
      "A careful day followed by nighttime overeating can be an old identity, not a lack of knowledge.",
      "The brain prefers familiar labels because familiarity feels safe.",
      "Menopause can make cravings, fatigue, stress, and weight gain louder.",
      "The three tools named are “I’m someone who…” statements, daily evidence, and questioning old thoughts.",
      "Showing up consistently is the point, not a perfect streak.",
    ],
  },
  "beyond-the-scale-building-new-weight-loss-patterns": {
    sourceBlogSlug: "why-am-i-gaining-weight-after-40-even-when-i-eat-less",
    summary: [
      "This episode is about stubborn belly weight after 40 that shows up even when someone is eating less and exercising. The description reframes the “menopause belly” as a symptom of automatic patterns rather than a broken metabolism. Hormone changes can make insulin more dominant, so small habits carry more weight than they used to. The habits named are nighttime snacking, stress eating, and the “start Monday” cycle.",
      "The direction of the episode is to become what Lee Anne calls a one percenter. In this episode that phrase is about behavior, not income: keeping promises to yourself, building identity through follow-through, and choosing the right discomfort. The tools are specific. Ask a better question than why the weight will not move. Ask what is interrupting progress. Keep a victory list of daily wins. When a craving shows up, take one pause and choose “future you” over “craving you.”",
      "The chapters walk that order. They start with the menopause belly mystery, then the idea that the body follows patterns, then how hormones shift after 40. From there the episode contrasts future you with craving you, names the right discomfort, and moves to spotting patterns and tracking wins so identity has evidence. It closes with three steps to start and an invitation to a clarity call to find the sticking points and build a plan. The matching article on gaining weight after 40, even when you eat less, is the long version of this same pattern story.",
    ],
    takeaways: [
      "The episode treats menopause belly as a symptom of patterns, not a broken metabolism.",
      "Hormone changes can make insulin more dominant, so small habits matter more.",
      "Nighttime snacking, stress eating, and “start Monday” are the patterns named.",
      "A one percenter, here, is someone who keeps promises to herself.",
      "The tools are a better question, a victory list, and one pause that chooses future you.",
    ],
  },
  "navigating-midlife-changes-hormones-weight": {
    sourceBlogSlug: "why-youre-gaining-weight-in-perimenopause-even-with-good-habits",
    summary: [
      "This episode is about weight coming back in midlife even when exercise and food habits stayed consistent. Lee Anne tells a personal story she describes as one she hid: liposuction that worked at first and did not last, because the deeper issue was not fat. The description says the deeper issue was hormones and perimenopause. The YouTube title puts it directly: why the weight came back in midlife, and why it was not the habits.",
      "She talks about women chasing symptoms while missing what is driving them. The symptoms named are cravings, belly fat, exhaustion, brain fog, and low motivation. The contributors named are hormonal shifts, insulin resistance, chronic stress, and poor sleep. The reframe is that the body is communicating, not betraying you. More shame, and trying harder at the old plan, is not the strategy the episode offers. Curiosity is.",
      "Three starting steps are listed. Stop the self-blame. Add protein through the day. Do one joyful thing daily. Joy is part of the healing section of the episode, not a side note. The later chapters say you do not need your 25-year-old body back, and that this season is about a better relationship with yourself and a life you love now. The article on gaining weight in perimenopause even with good habits is the written version of this same story.",
    ],
    takeaways: [
      "Weight can return in midlife even when the old habits are still in place.",
      "The episode’s liposuction story is about hormones and perimenopause, not a fat problem that surgery finished.",
      "Cravings, belly fat, exhaustion, brain fog, and low motivation are the symptoms named.",
      "Hormonal shifts, insulin resistance, chronic stress, and poor sleep are the contributors named.",
      "The three steps are to drop the self-blame, add protein through the day, and do one joyful thing.",
    ],
  },
  "fuel-fat-loss-over-40-balance-insulin": {
    sourceBlogSlug: "mastering-insulin-fueling-fat-burning-and-energy-after-40",
    summary: [
      "This episode is for women over 40 who still deal with energy crashes, brain fog, cravings, and stubborn belly fat after cutting carbs, skipping meals, and exercising. The description says the issue is often overwhelmed insulin rather than a lazy metabolism. As estrogen drops, insulin can become more dominant, which the episode connects to fat storage and an appetite that is harder to regulate.",
      "The picture used on the episode and on the matching article is traffic. Carbohydrates send glucose onto the freeway, and insulin directs the flow. Grazing keeps the road congested. Two tools already named on the site come up here. Unicity Balance is the fiber blend used before higher-carb meals. The article describes that blend as slowing glucose absorption, supporting healthy A1C levels, and improving insulin sensitivity, and as something that can make a fasting window easier because you feel full longer. Unimate is the yerba mate drink used during fasting for calmer energy and mental clarity, rather than a typical energy-drink jolt.",
      "The how-to in the episode description is short. Use Balance before higher-carb meals. Use Unimate during a fasting window. Avoid grazing. Build meals around protein. Both the episode and the article call these training wheels: the tools support the choices, they do not replace them. The close is the same line the article uses. Consistency beats perfection. A clarity call is there if you want the week planned for your own meals.",
    ],
    takeaways: [
      "The episode points at overwhelmed insulin, not a lazy metabolism, when eating less and exercising are not enough.",
      "Estrogen dropping can leave insulin more dominant.",
      "The traffic picture is glucose on the freeway and insulin directing the flow.",
      "Balance is the fiber blend before higher-carb meals. Unimate is the yerba mate drink during fasting.",
      "The episode still asks for fewer snacks and protein-forward meals. The tools do not replace those choices.",
    ],
  },
  "reclaim-rewire-reset-transform-identity": {
    sourceBlogSlug: "reclaim-rewire-reset-become-a-different-decision-maker",
    summary: [
      "This episode asks why weight-loss attempts fail, and it refuses the usual answers of hormones, age, or a lack of motivation. The description says most attempts fail because they target food and habits without changing identity, patterns, and standards. The matching article uses the same idea: fresh paint on a house does not help if the foundation is cracked. Buying another plan, another app, or another supplement is what the article calls decorating dysfunction.",
      "The method has three phases. Reclaim your body means stabilize. The big rocks named in the episode are fiber, protein, calorie awareness, exercise, sleep, and emotional regulation, plus removing one sabotage habit. The article says start with subtraction before addition. Rewire your mind means update the operating system. The old lines are self-doubt and all-or-nothing thinking. The replacement the article names is quick recovery: “I recover quickly,” and “one decision doesn’t define me.” Reset your standards means build structure that is boring, predictable, and repeatable, instead of waiting on motivation or a 30-day extreme.",
      "The episode’s closing line is that sustainable change is not a better plan. It is becoming a different decision maker, with support and accountability. The article says the women who finish this work are not more obsessive. They are calmer, and they are no longer at war with food. That result is described as identity change, built by hard work and structure, not by a new supplement.",
    ],
    takeaways: [
      "The episode says attempts fail when identity, patterns, and standards never change.",
      "Reclaim is stabilization: fiber, protein, calorie awareness, exercise, sleep, emotional regulation, and one sabotage habit removed.",
      "Rewire replaces all-or-nothing thinking with quick recovery after one decision.",
      "Reset means boring, repeatable standards instead of motivation or a short extreme.",
      "The goal named is becoming a different decision maker, with support and accountability.",
    ],
  },
  "overcoming-nighttime-sugar-battles": {
    summary: [
      "This episode is about nighttime chocolate cravings after 40. Lee Anne describes women who feel in control with food all day and then hit an urgent sugar craving at night. She argues it is not a willpower problem. The description calls it a dopamine-driven habit loop that can get louder after 40 because of a natural dopamine decline, plus stress, hormonal shifts, and decision fatigue.",
      "Chocolate is reframed as relief and as an off switch, not as a moral failure. The craving is compared to a toddler that escalates when you argue with it, and to emotional weather that peaks and then passes. Shame is called out directly: it raises stress, and that can make the craving louder. Arguing with the urge is part of what feeds it.",
      "The episode teaches a three-part approach. First, notice the thoughts that start the loop. Second, take a 10-minute pause without arguing, and name the craving as a dopamine dip. Third, plan treats ahead of time so sugar is intentional currency instead of an emergency. She also encourages more sources of joy than food, so the evening has an off switch that is not the pantry. The chapters run from why night cravings hit, through the after-40 brain changes and the dopamine loop, to sugar as currency and an evening reset. A clarity call is offered if you want that plan fitted to your own nights.",
    ],
    takeaways: [
      "Daytime control and an urgent nighttime sugar craving can be the same habit loop, not a willpower failure.",
      "The episode ties the loop to dopamine, stress, hormonal shifts, and decision fatigue after 40.",
      "Shame raises stress and can make the craving louder.",
      "The three parts are awareness of the trigger thoughts, a 10-minute pause, and treats planned ahead.",
      "Joy that is not food is part of the evening reset.",
    ],
  },
  "fuel-system-reset-sugar-to-fat-burn": {
    sourceBlogSlug: "fuel-system-reset-switching-from-sugar-to-fat-burning",
    summary: [
      "This episode is about switching from burning sugar to using stored fat after 40. What follows is only the fuel-system reset article published the same day.",
      "The article is about getting unstuck from sugar-burning mode after 40. The scene is 3:17 p.m. You are not truly hungry, you are tired, and you want chocolate. A sweet snack lifts you, then you feel sluggish and annoyed. The article calls that a sugar-burning metabolism, not a lack of willpower, and it points at needing snacks every few hours or crashing between meals.",
      "After 40, the article says, metabolic flexibility often drops as estrogen drops, and insulin becomes more dominant. Elevated insulin is described as a lock on the fat-fuel tank. The results it lists are more hunger and irritability between meals, dependence on snacks for energy, and weight gain around the abdomen. The picture is a hybrid with two tanks, sugar and stored fat. A flexible metabolism switches. A sugar burner keeps topping up the sugar tank.",
      "Three steps are the reset. Stop eating naked carbs: pair carbohydrates with protein and fat, such as an apple with nut butter or toast with eggs, so the glucose rise is slower. Expand the overnight fast by finishing food around 6 or 7 p.m. and moving breakfast back an hour or two, so insulin can drop. Take a 10-minute walk after dinner so muscles can use glucose. The article calls this an upgrade era and says consistency, not perfection, is what makes the switch usable.",
    ],
    takeaways: [
      "The 3:17 p.m. crash-and-chocolate loop is described as sugar-burning mode, not a character flaw.",
      "Dropping estrogen and more-dominant insulin are the midlife changes the article names.",
      "Pair carbs with protein and fat instead of eating them alone.",
      "A longer overnight gap, with food ending around 6 or 7 p.m., is the second step.",
      "A 10-minute walk after dinner is the third step.",
    ],
  },
  "breaking-the-cycle-habits-not-plans": {
    sourceBlogSlug: "stop-chasing-plans-lasting-health-transformation",
    summary: [
      "This episode is about breaking the start-over cycle by focusing on habits instead of another plan. What follows is only the article published the same day, Stop Chasing Plans.",
      "The article says most women are not stuck because they lack a strategy. They are stuck in productive procrastination: a new supplement, a stricter routine, or another program, while the habit that is actually stalling them stays in place. Buying the plan feels like movement. The article compares it to reorganizing a closet to avoid a hard conversation, and to a smoker who adds breathwork and green juice and keeps smoking. The body, it says, responds to what you do, not to the plan you bought.",
      "The fix it describes is subtraction. Find the one inhibiting habit and remove it, instead of stacking five new habits on top of it. Late-night overeating and lack of sleep are the examples of heavy habits. Supplements and debates about meal timing are the pebbles. The jar picture is the big rocks first: protein, fiber, sleep, and removing the habit that is in the way. The pebbles and sand settle after that.",
      "It also challenges the idea that weight loss is easy when it is working, and the habit of judging consistency by your best days. Consistency over time is compared to interest in an account. Perfection and a fresh “start Monday” are treated as reasons people quit. The aim is a lifestyle you can keep on an ordinary week, not a filtered one. The article points to coaching when you are ready to work on the habit instead of the next plan.",
    ],
    takeaways: [
      "Another plan can be productive procrastination if the stalling habit stays.",
      "The article’s test is the smoker who adds healthy extras and keeps smoking.",
      "Remove one inhibiting habit before you add more.",
      "Big rocks named: protein, fiber, sleep, and the habit in the way.",
      "Consistency on ordinary days matters more than a perfect Monday restart.",
    ],
  },
  "bridging-the-divide-body-journey-to-peace": {
    sourceBlogSlug: "weight-loss-mindset-mind-the-gap-to-find-your-peace",
    summary: [
      "This episode is Bridging the Divide: Your Body’s Journey to Peace. What follows is only the article on minding the gap between desire and action until there is peace.",
      "The article says the painful place in a weight-loss effort is the gap between how badly you want a result and what you are actually willing to do. It offers two ways out. Increase what you are willing to give so it matches the desire, or lower the desire so it matches what you can do right now. Staying in the middle, wanting the result and not changing the behavior, is what creates the friction, the exhaustion, and the shame.",
      "The picture is a canyon. Across it is a version of you that feels light, comfortable, calm, and steady. The space between is not described as weight, age, or metabolism. It is indecision. Living there is compared to a rocking chair: motion, no progress. “I’ll start Monday” and “I need more motivation” are named as thoughts that keep the gap open.",
      "Path one is acting like you want it: nutrition, movement, and rest, done consistently enough that self-respect replaces the hunt for motivation. Path two is the compassionate choice, stabilizing and letting go of the obsessive focus without calling that failure. The article describes a client who had stood at that edge for years. What changed for her was anxiety dropping because her actions and her desires finally matched, not because a number on the scale moved. Peace, in this article, follows alignment.",
    ],
    takeaways: [
      "The gap is desire on one side and the actions you will actually take on the other.",
      "Two paths: raise what you will do, or lower the demand you are putting on yourself.",
      "The middle, wanting the result without the change, is the exhausting place.",
      "“I’ll start Monday” is named as a thought that keeps the gap open.",
      "The client example is about anxiety easing when actions and desires match, not about a scale number.",
    ],
  },
};

export function summaryWordCount(supplement: EpisodeSupplement): number {
  return supplement.summary.join(" ").split(/\s+/).filter(Boolean).length;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** The live thin pages are a short stub plus this sentence. */
const THIN_STUB = /Watch the full episode below, then explore related resources/i;

export function podcastNotesAreThin(html: string | null | undefined): boolean {
  if (!html || !html.trim()) return true;
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  return words < 180 || THIN_STUB.test(text);
}

export function supplementHtml(supplement: EpisodeSupplement): string {
  const paragraphs = supplement.summary
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");
  const items = supplement.takeaways
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
  const article = supplement.sourceBlogSlug
    ? `<p><a href="/health-wellness-blog/${supplement.sourceBlogSlug}">Related article</a></p>`
    : "";
  return `${paragraphs}<h2>Key takeaways</h2><ul>${items}</ul>${article}<p><em>Show notes are for education and coaching context only — not medical advice.</em></p>`;
}

/**
 * Replace a thin stub with the written summary. Leave substantial notes alone.
 */
export function showNotesForEpisode(slug: string, html: string | null): string | null {
  const supplement = EPISODE_SUPPLEMENTS[slug];
  if (!supplement || !podcastNotesAreThin(html)) return html;
  return supplementHtml(supplement);
}
