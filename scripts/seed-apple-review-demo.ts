/**
 * Upserts the App Store / TestFlight reviewer account with enough
 * signed-in content that Guideline 2.1(a) can actually open every tab.
 *
 *   pnpm exec tsx scripts/seed-apple-review-demo.ts
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const EMAIL = "apple.review@mindandbodyresetcoach.com";
const PASSWORD = "Review2026App";
const NAME = "Apple Reviewer";
const OPEN_ID = `email:${EMAIL}`;

function mountainToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function asYmd(value: unknown, fallback: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const match = String(value ?? "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : fallback;
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const c = await mysql.createConnection(url);
  const today = mountainToday();
  const hash = await bcrypt.hash(PASSWORD, 12);

  try {
    const [existing] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id, email FROM users WHERE email = ? OR openId = ? LIMIT 1",
      [EMAIL, OPEN_ID]
    );

    let userId: number;
    if (existing[0]) {
      userId = existing[0].id as number;
      await c.query(
        `UPDATE users
         SET name = ?, passwordHash = ?, loginMethod = 'email', emailVerified = 1,
             emailVerifyToken = NULL, role = 'user', shareHabitsWithCoach = 1,
             lastSignedIn = NOW()
         WHERE id = ?`,
        [NAME, hash, userId]
      );
      console.log("Updated user", userId, EMAIL);
    } else {
      const [ins] = await c.query<mysql.ResultSetHeader>(
        `INSERT INTO users
          (openId, name, email, loginMethod, passwordHash, emailVerified, role, shareHabitsWithCoach, lastSignedIn)
         VALUES (?, ?, ?, 'email', ?, 1, 'user', 1, NOW())`,
        [OPEN_ID, NAME, EMAIL, hash]
      );
      userId = ins.insertId;
      console.log("Created user", userId, EMAIL);
    }

    const [templates] = await c.query<mysql.RowDataPacket[]>(
      "SELECT title, description, type, targetValue, unit, `order` FROM habit_templates WHERE isActive = 1 ORDER BY `order`"
    );
    for (const t of templates) {
      const [have] = await c.query<mysql.RowDataPacket[]>(
        "SELECT id FROM user_habits WHERE userId = ? AND title = ? LIMIT 1",
        [userId, t.title]
      );
      if (have[0]) continue;
      await c.query(
        `INSERT INTO user_habits (userId, title, description, type, targetValue, unit, \`order\`, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [userId, t.title, t.description, t.type, t.targetValue, t.unit, t.order]
      );
    }

    const [habits] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id, title, type, targetValue FROM user_habits WHERE userId = ? AND isActive = 1",
      [userId]
    );
    for (const h of habits) {
      const [log] = await c.query<mysql.RowDataPacket[]>(
        "SELECT id FROM user_habit_logs WHERE userHabitId = ? AND dateStr = ? LIMIT 1",
        [h.id, today]
      );
      if (log[0]) continue;
      const numeric =
        h.type === "numeric" ? Math.max(1, Math.round(Number(h.targetValue || 1) * 0.7)) : null;
      await c.query(
        `INSERT INTO user_habit_logs (userHabitId, userId, dateStr, completed, numericValue)
         VALUES (?, ?, ?, 1, ?)`,
        [h.id, userId, today, numeric]
      );
    }

    const [wins] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id FROM user_victory_lists WHERE userId = ? AND dateStr = ? LIMIT 1",
      [userId, today]
    );
    if (!wins[0]) {
      await c.query(
        `INSERT INTO user_victory_lists (userId, dateStr, win1, win2, win3)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          today,
          "Drank water with breakfast",
          "Walked 15 minutes after lunch",
          "Ate protein at dinner",
        ]
      );
    }

    const [ch] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id, startDate FROM challenges WHERE themeTag = 'real_food_reset' AND isActive = 1 LIMIT 1"
    );
    if (ch[0]) {
      const challengeId = ch[0].id as number;
      const startDate = asYmd(ch[0].startDate, "2026-09-28");
      const [enrolled] = await c.query<mysql.RowDataPacket[]>(
        "SELECT id FROM user_challenges WHERE challengeId = ? AND (userId = ? OR email = ?) LIMIT 1",
        [challengeId, userId, EMAIL]
      );
      if (!enrolled[0]) {
        await c.query(
          `INSERT INTO user_challenges (userId, email, challengeId, startDate, status)
           VALUES (?, ?, ?, ?, 'active')`,
          [userId, EMAIL, challengeId, startDate]
        );
        console.log("Enrolled in Real Food Reset", challengeId);
      } else {
        await c.query(
          "UPDATE user_challenges SET userId = ?, email = ?, status = 'active' WHERE id = ?",
          [userId, EMAIL, enrolled[0].id]
        );
      }
    } else {
      console.warn("No active real_food_reset challenge found");
    }

    const [meal] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id FROM calorie_logs WHERE userId = ? AND dateStr = ? LIMIT 1",
      [userId, today]
    );
    if (!meal[0]) {
      await c.query(
        `INSERT INTO calorie_logs (userId, dateStr, mealType, foodName, calories, protein, carbs, fat, fiber, servings)
         VALUES (?, ?, 'breakfast', 'Eggs, spinach, and berries', 380, 28, 18, 22, 6, 1)`,
        [userId, today]
      );
      await c.query(
        `INSERT INTO calorie_logs (userId, dateStr, mealType, foodName, calories, protein, carbs, fat, fiber, servings)
         VALUES (?, ?, 'lunch', 'Chicken salad with olive oil', 520, 38, 12, 32, 4, 1)`,
        [userId, today]
      );
    }

    const [fit] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id FROM fitness_logs WHERE userId = ? AND dateStr = ? LIMIT 1",
      [userId, today]
    );
    if (!fit[0]) {
      await c.query(
        `INSERT INTO fitness_logs (userId, dateStr, exerciseName, sets, reps, weight, durationMinutes, caloriesBurned)
         VALUES (?, ?, 'Walk', 1, 0, 0, 20, 90)`,
        [userId, today]
      );
    }

    const [thread] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id FROM conversations WHERE userId = ? AND platform = 'webchat' LIMIT 1",
      [userId]
    );
    let conversationId: number;
    if (thread[0]) {
      conversationId = thread[0].id as number;
    } else {
      const [ins] = await c.query<mysql.ResultSetHeader>(
        `INSERT INTO conversations
          (userId, contactEmail, platform, status, botActive, unreadCount, lastMessageAt)
         VALUES (?, ?, 'webchat', 'open', 0, 1, NOW())`,
        [userId, EMAIL]
      );
      conversationId = ins.insertId;
    }

    const [coachMsg] = await c.query<mysql.RowDataPacket[]>(
      "SELECT id FROM messages WHERE conversationId = ? AND direction = 'outbound' LIMIT 1",
      [conversationId]
    );
    if (!coachMsg[0]) {
      await c.query(
        `INSERT INTO messages (conversationId, direction, senderName, content, status, isAutomated)
         VALUES (?, 'outbound', 'Lee Anne', ?, 'delivered', 1)`,
        [
          conversationId,
          "Welcome. This is your private thread with me. Check today's habits, log a meal in Food, and open the Challenge card on Habits — that's the 5-Day No Processed Food Challenge.",
        ]
      );
    }

    const ok = await bcrypt.compare(PASSWORD, hash);
    if (!ok) throw new Error("Password hash self-check failed");

    console.log("Demo account ready");
    console.log("  User name:", EMAIL);
    console.log("  Password:", PASSWORD);
    console.log("  Today:", today);
  } finally {
    await c.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
