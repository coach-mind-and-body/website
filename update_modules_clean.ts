import "dotenv/config";
import { getDb } from "./server/db";
import { programModules } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const modules = [
  {
    order: 1,
    title: "Module 1: Regulate Your Nervous System + Ease Food Noise",
    description: "Begin with Mindfulness. Understand your relationship with food, body, and emotion. Shift from autopilot to awareness.",
    content: `
      <h2>Week 1: Awareness & Intention</h2>
      <p><strong>Core Focus:</strong> Understand your relationship with food, body, and emotion. <br/><strong>Coaching Goal:</strong> Shift from autopilot to awareness.</p>
      <p><strong>Mindset:</strong> Notice your thoughts. No judgment, just curiosity.</p>
      <div style="background:#f9f9f9; padding: 15px; border-left: 4px solid #c9a96e; margin-bottom: 20px;">
        <p><strong>C-T-F-A-R:</strong> What am I thinking about my body? How does that make me feel?</p>
      </div>
      <hr />
      <h2>Your Habits for this Week</h2>
      <ul>
        <li>Start daily Unimate + Balance routine</li>
        <li>Hydration goal: &frac12; your body weight (oz)</li>
        <li>Journal daily for 5 minutes</li>
      </ul>
      <p><strong>Mantra:</strong> "Awareness is the first step toward peace."</p>
      <hr />
      <h2>Homework</h2>
      <p>Write your "why" &mdash; what do you want to feel by the end of 6 weeks?</p>
      <hr />
      <h2>Why Nothing Has Worked (It's not your fault)</h2>
      <p>We are going to learn the Feel Great foundations: awareness and emotional regulation. We will interrupt the "I can't trust myself around food" story and use simple <em>Better Than Perfect</em> tools to reduce urgency, guilt, and overeating.</p>
      <p><strong>Outcome:</strong> You will feel calmer. Food noise starts to quiet. You will feel hope again.</p>
    `
  },
  {
    order: 2,
    title: "Module 2: Stabilize Your Hormones & Turn Hunger Off",
    description: "Learn how to honor your plan — not perfectly, but consistently. Create safety and predictability through small wins.",
    content: `
      <h2>Week 2: Decision & Commitment</h2>
      <p><strong>Core Focus:</strong> Learn how to honor your plan &mdash; not perfectly, but consistently.<br/><strong>Coaching Goal:</strong> Create safety and predictability through small wins.</p>
      <p><strong>Mindset:</strong> Make decisions from love, not guilt.</p>
      <div style="background:#f9f9f9; padding: 15px; border-left: 4px solid #c9a96e; margin-bottom: 20px;">
        <p><strong>C-T-F-A-R:</strong> What happens when I think "I blew it"? What could I think instead?</p>
      </div>
      <hr />
      <h2>Your Habits for this Week</h2>
      <ul>
        <li>Daily food rhythm (3 intentional meals or FGS rhythm)</li>
        <li>Pre-plan your day each morning</li>
        <li>Keep one small promise daily (walk, water, or bedtime)</li>
      </ul>
      <p><strong>Mantra:</strong> "Decide once. Honor daily."</p>
      <hr />
      <h2>Homework</h2>
      <p>Reflect nightly &mdash; Did I honor my plan? Why or why not?</p>
      <hr />
      <h2>Hormonal Rules for Women 40&ndash;60</h2>
      <p>We will balance insulin, cortisol, and leptin for fewer cravings. We will introduce Dr. Mindy Pelz&rsquo;s beginner fasting windows (gentle 12&ndash;13 hours) and teach how to use food timing to reduce snacking and emotional cravings.</p>
      <p><strong>Outcome:</strong> Hunger stabilizes. Cravings decrease. You experience your first quiet afternoon.</p>
    `
  },
  {
    order: 3,
    title: "Module 3: Rewire Your Thoughts & Rebuild Trust With Your Body",
    description: "End emotional eating and all-or-nothing thinking. Build emotional literacy and learn to process, not resist, feelings.",
    content: `
      <h2>Week 3: Emotional Mastery</h2>
      <p><strong>Core Focus:</strong> End emotional eating and all-or-nothing thinking.<br/><strong>Coaching Goal:</strong> Build emotional literacy and learn to process, not resist, feelings.</p>
      <p><strong>Mindset:</strong> No emotion is dangerous when allowed.</p>
      <div style="background:#f9f9f9; padding: 15px; border-left: 4px solid #c9a96e; margin-bottom: 20px;">
        <p><strong>C-T-F-A-R:</strong> When I feel anxious, what am I thinking?</p>
      </div>
      <hr />
      <h2>Your Habits for this Week</h2>
      <ul>
        <li>3 deep breaths before eating</li>
        <li>Pause when you feel an urge &mdash; name the emotion</li>
        <li>Write 1 thought daily that calms your nervous system</li>
      </ul>
      <p><strong>Mantra:</strong> "You can handle an urge without obeying it."</p>
      <hr />
      <h2>Homework</h2>
      <p>Track emotional triggers &mdash; what feelings most often lead to buffering?</p>
      <hr />
      <h2>Belief Work & Self-Coaching</h2>
      <p>Identify the thoughts causing sabotage. Build new core beliefs: "I can trust myself around food." Create your personal self-coaching script using Jody Moore&rsquo;s model. Replace all-or-nothing habits with <em>Better Than Perfect</em> consistency.</p>
      <p><strong>Outcome:</strong> You feel in control again. You stop the guilt spiral and start feeling proud.</p>
    `
  },
  {
    order: 4,
    title: "Module 4: Activate Fat Burning With Fasting & Food Freedom",
    description: "Rebuild trust with your body through calm, consistent actions. Move from control to connection.",
    content: `
      <h2>Week 4: Body Respect & Consistency</h2>
      <p><strong>Core Focus:</strong> Rebuild trust with your body through calm, consistent actions.<br/><strong>Coaching Goal:</strong> Move from control to connection.</p>
      <p><strong>Mindset:</strong> "My body isn&rsquo;t broken &mdash; it&rsquo;s communicating."</p>
      <div style="background:#f9f9f9; padding: 15px; border-left: 4px solid #c9a96e; margin-bottom: 20px;">
        <p><strong>C-T-F-A-R:</strong> What do I make it mean when the scale fluctuates?</p>
      </div>
      <hr />
      <h2>Your Habits for this Week</h2>
      <ul>
        <li>Continue FGS routine</li>
        <li>Add gentle movement (walking, stretching, yoga)</li>
        <li>Prioritize rest and bedtime consistency</li>
      </ul>
      <p><strong>Mantra:</strong> "Progress, not perfection."</p>
      <hr />
      <h2>Homework</h2>
      <p>Journal: What signs show my body is healing or balancing?</p>
      <hr />
      <h2>Metabolic Repair & Deeper Fasting</h2>
      <p>Progress to 14&ndash;16 hour fasts (based on readiness). Implement hormone-friendly meal rhythms for perimenopause/menopause. Learn fat-burning food pairings (protein + smart carbs + healthy fats). Create your personal "Food Freedom Framework".</p>
      <p><strong>Outcome:</strong> Weight starts shifting. Bloating goes down. You feel lighter in body and mind.</p>
    `
  },
  {
    order: 5,
    title: "Module 5: Master Emotional Regulation & Stress-Driven Eating",
    description: "Step into the woman who lives calm, confident, and free. Anchor new beliefs and habits into your identity.",
    content: `
      <h2>Week 5: Identity & Empowerment</h2>
      <p><strong>Core Focus:</strong> Step into the woman who lives calm, confident, and free.<br/><strong>Coaching Goal:</strong> Anchor new beliefs and habits into your identity.</p>
      <p><strong>Mindset:</strong> Be &rarr; Do &rarr; Have. Act like the woman you&rsquo;re becoming.</p>
      <div style="background:#f9f9f9; padding: 15px; border-left: 4px solid #c9a96e; margin-bottom: 20px;">
        <p><strong>C-T-F-A-R:</strong> What would my future self think, feel, and do today?</p>
      </div>
      <hr />
      <h2>Your Habits for this Week</h2>
      <ul>
        <li>Re-affirm daily "I am" statements</li>
        <li>Morning visualization: 2 minutes of gratitude and self-belief</li>
        <li>Continue honoring one micro-habit per day</li>
      </ul>
      <p><strong>Mantra:</strong> "I am her already."</p>
      <hr />
      <h2>Homework</h2>
      <p>Write a letter from your future self thanking you for showing up now.</p>
      <hr />
      <h2>It's Not Because You're Weak: The REAL Method</h2>
      <p>Your brain is not hungry. It detected an uncomfortable emotional state and searched its memory for the fastest available source of dopamine. Food won. Not because you are weak. Because it has the best track record.</p>
      <p><strong>R = Recognize:</strong> Pause. Name the urge. "I'm having an urge to eat."</p>
      <p><strong>E = Examine:</strong> Ask: "What am I actually feeling?" (Stress, Loneliness, Frustration, Boredom, Anxiety, Exhaustion)</p>
      <p><strong>A = Address the Need:</strong> What would actually help? (If stress &rarr; movement. If lonely &rarr; connection. If bored &rarr; stimulation.)</p>
      <p><strong>L = Let the Urge Ride:</strong> Urges are like waves. They rise. They peak. They fall. You do not have to obey every urge.</p>
    `
  },
  {
    order: 6,
    title: "Module 6: Integrate Your New Identity & Make It Stick",
    description: "Maintain balance, celebrate growth, and design your next 90 days. Solidify lifelong confidence and self-coaching tools.",
    content: `
      <h2>Week 6: Integration & Celebration</h2>
      <p><strong>Core Focus:</strong> Maintain balance, celebrate growth, and design your next 90 days.<br/><strong>Coaching Goal:</strong> Solidify lifelong confidence and self-coaching tools.</p>
      <p><strong>Mindset:</strong> You don&rsquo;t need perfection &mdash; you need peace.</p>
      <div style="background:#f9f9f9; padding: 15px; border-left: 4px solid #c9a96e; margin-bottom: 20px;">
        <p><strong>C-T-F-A-R:</strong> How do I want to think about myself going forward?</p>
      </div>
      <hr />
      <h2>Your Habits for this Week</h2>
      <ul>
        <li>Choose your maintenance rhythm (FGS, journaling, movement)</li>
        <li>Celebrate weekly wins &mdash; emotional, physical, or mindset</li>
        <li>Teach one concept you&rsquo;ve learned to someone else (anchors it deeper)</li>
      </ul>
      <p><strong>Mantra:</strong> "This is not the end &mdash; it&rsquo;s my new normal."</p>
      <hr />
      <h2>Homework</h2>
      <p>Reflect: What belief changed my life the most?</p>
      <hr />
      <h2>Make It Your Identity</h2>
      <p>Step into the identity of a woman who trusts herself around food. Build a forever plan that doesn&rsquo;t rely on willpower. Create hormone-friendly routines for long-term health. Practice advanced self-coaching for thoughts about weight, food, and aging. Celebrate wins and build your "Reset for Life" maintenance strategy.</p>
      <p><strong>Outcome:</strong> You feel confident. Food noise is quiet. Weight loss feels doable and sustainable.</p>
    `
  }
];

async function main() {
  const db = await getDb();
  if (!db) { console.log("no db"); return; }
  
  for (const mod of modules) {
    // try update
    const existing = await db.select().from(programModules).where(eq(programModules.order, mod.order));
    if (existing.length > 0) {
      await db.update(programModules).set({
        title: mod.title,
        description: mod.description,
        content: mod.content
      }).where(eq(programModules.id, existing[0].id));
      console.log("Updated Module", mod.order);
    } else {
      await db.insert(programModules).values({
        title: mod.title,
        description: mod.description,
        content: mod.content,
        order: mod.order,
        isPublished: true
      });
      console.log("Inserted Module", mod.order);
    }
  }
  
  console.log("Modules populated beautifully.");
  process.exit(0);
}

main().catch(console.error);
