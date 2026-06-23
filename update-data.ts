import { getDb } from './server/db';
import { programModules, blogPosts } from './drizzle/schema';
import { eq, inArray } from 'drizzle-orm';
import 'dotenv/config';

async function run() {
    const db = await getDb();
    if (!db) {
        console.error('No DB connected.');
        process.exit(1);
    }

    // UPDATE MODULES
    const modulesData = [
        {
            title: 'Module 1: Regulate Your Nervous System + Ease Food Noise',
            description: 'Begin with Mindfulness. Understand your relationship with food, body, and emotion. Shift from autopilot to awareness.',
            content: '<h2>Week 1 – Awareness & Intention: Begin with Mindfulness</h2><p><strong>Core Focus:</strong> Understand your relationship with food, body, and emotion. Coaching Goal: Shift from autopilot to awareness.</p><p><strong>Mindset:</strong> Notice your thoughts. No judgment, just curiosity.</p><p><strong>Habits:</strong><br/>- Start daily Unimate + Balance routine<br/>- Hydration goal: ½ your body weight (oz)<br/>- Journal daily for 5 minutes</p><p><strong>Mantra:</strong> "Awareness is the first step toward peace."</p>',
            order: 1,
            isPublished: true,
        },
        {
            title: 'Module 2: Calm Your Hormones and Cravings',
            description: 'Decision & Commitment. Build self-trust and learn how to honor your plan.',
            content: '<h2>Week 2 – Decision & Commitment: Build Self-Trust</h2><p><strong>Core Focus:</strong> Learn how to honor your plan — not perfectly, but consistently.</p><p><strong>Mindset:</strong> Make decisions from love, not guilt.</p><p><strong>Habits:</strong><br/>- Daily food rhythm<br/>- Pre-plan your day each morning<br/>- Keep one small promise daily</p><p><strong>Mantra:</strong> "Decide once. Honor daily."</p>',
            order: 2,
            isPublished: true,
        },
        {
            title: 'Module 3: Learn to Trust Your Body Again',
            description: 'Emotional Mastery. End emotional eating and all-or-nothing thinking.',
            content: '<h2>Week 3 – Emotional Mastery: Feel Instead of Fix</h2><p><strong>Core Focus:</strong> Build emotional literacy and learn to process, not resist, feelings.</p><p><strong>Mindset:</strong> No emotion is dangerous when allowed.</p><p><strong>Habits:</strong><br/>- 3 deep breaths before eating<br/>- Pause when you feel an urge — name the emotion<br/>- Write 1 thought daily that calms your nervous system</p><p><strong>Mantra:</strong> "You can handle an urge without obeying it."</p>',
            order: 3,
            isPublished: true,
        },
        {
            title: 'Module 4: Activate Fat Burning and Metabolic Healing',
            description: 'Body Respect & Consistency. Rebuild trust with your body through calm, consistent actions.',
            content: '<h2>Week 4 – Body Respect & Consistency</h2><p><strong>Core Focus:</strong> Move from control to connection.</p><p><strong>Mindset:</strong> "My body isn’t broken — it’s communicating."</p><p><strong>Habits:</strong><br/>- Continue FGS routine<br/>- Add gentle movement<br/>- Prioritize rest and bedtime consistency</p><p><strong>Mantra:</strong> "Progress, not perfection."</p>',
            order: 4,
            isPublished: true,
        },
        {
            title: 'Module 5: Interpret Your Emotions Instead of Eating Them',
            description: 'Identity & Empowerment. Step into the woman who lives calm, confident, and free.',
            content: '<h2>Week 5 – Identity & Empowerment</h2><p><strong>Core Focus:</strong> Anchor new beliefs and habits into your identity.</p><p><strong>Mindset:</strong> Be ? Do ? Have. Act like the woman you’re becoming.</p><p><strong>Habits:</strong><br/>- Re-affirm daily "I am" statements<br/>- Morning visualization<br/>- Continue honoring one micro-habit per day</p><p><strong>Mantra:</strong> "I am her already."</p>',
            order: 5,
            isPublished: true,
        },
        {
            title: 'Module 6: Make Your New Identity the Default',
            description: 'Integration & Celebration. Solidify lifelong confidence and self-coaching tools.',
            content: '<h2>Week 6 – Integration & Celebration: Better Than Perfect</h2><p><strong>Core Focus:</strong> Maintain balance, celebrate growth, and design your next 90 days.</p><p><strong>Mindset:</strong> You don’t need perfection — you need peace.</p><p><strong>Habits:</strong><br/>- Choose your maintenance rhythm<br/>- Celebrate weekly wins<br/>- Teach one concept you’ve learned to someone else</p><p><strong>Mantra:</strong> "This is not the end — it’s my new normal."</p>',
            order: 6,
            isPublished: true,
        }
    ];

    // Clear existing placeholder modules (if any) or just insert new ones if none exist.
    // Let's delete existing modules first and insert the fresh ones.
    await db.delete(programModules);
    await db.insert(programModules).values(modulesData);
    console.log('Modules updated.');

    // UPDATE BLOGS
    const updates = [
        { old: 'Stop Food Shame: Healing Midlife Insulin Resistance', new: 'Why Does Midlife Insulin Resistance Cause Food Shame, and How Do You Heal It?' },
        { old: 'Embracing Change: Redefining Your Journey Through Menopause', new: 'How Can You Redefine Your Journey Through Menopause and Embrace Change?' },
        { old: 'Calming Food Noise: Drop the Food Courtroom', new: 'How Do You Drop the \'Food Courtroom\' and Finally Calm Your Food Noise?' },
        { old: 'The Power of Your Hormone Reset: Embrace Day One with Confidence', new: 'Why is Day One of Your Hormone Reset the Most Powerful, and How Can You Embrace It?' },
        { old: 'Embrace Reflection: Shifting from Fault-Finding to Self-Awareness', new: 'How Can You Shift from Fault-Finding to Self-Awareness?' },
        { old: 'Midlife Body Image: Your Body is Not a Before Picture', new: 'Why Do You View Your Body as a "Before Picture," and How Can You Change That?' },
        { old: 'Reclaim, Rewire, Reset: Become a Different Decision Maker', new: 'How Do You Reclaim, Rewire, and Reset to Become a Different Decision Maker?' },
        { old: 'Mastering Insulin: Fueling Fat Burning & Energy After 40', new: 'How Do You Master Insulin to Fuel Fat Burning and Energy After 40?' },
        { old: 'Weight Loss Mindset: Mind the Gap to Find Your Peace', new: 'Why Does the "Weight Loss Gap" Cause Anxiety, and How Do You Find Peace?' },
        { old: 'Colon Health After 40: Diet, Inflammation, and Better Questions', new: 'Why Is Colon Health Crucial After 40, and How Do You Reduce Inflammation?' },
        { old: 'Fuel System Reset: Switching from Sugar to Fat Burning', new: 'How Do You Reset Your Fuel System to Switch from Sugar to Fat Burning?' },
        { old: 'Stop Chasing Plans: Remove the One Habit Holding Your Health Back', new: 'Why Should You Stop Chasing Plans, and What Habit Is Holding Your Health Back?' },
        { old: 'Patterns, Not the Belly: Unlocking Weight Loss Success After 40', new: 'Why Should You Focus on Patterns Instead of the Belly to Unlock Weight Loss After 40?' }
    ];

    for (const update of updates) {
        await db.update(blogPosts)
            .set({ title: update.new })
            .where(eq(blogPosts.title, update.old));
    }
    console.log('Blog titles updated.');

    process.exit(0);
}
run();
