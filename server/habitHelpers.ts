import { eq, and } from "drizzle-orm";
import { userHabits, userHabitLogs } from "../drizzle/schema";
import { calculateCurrentStreak, calculateMaxStreak } from "../lib/habitStreak";

/** 
 * Calculates streak stats for a user based on the "any-habit" rule (America/Denver).
 */
export async function calculateUserHabitStats(db: any, userId: number) {
  const allLogs = await db.select().from(userHabitLogs).where(eq(userHabitLogs.userId, userId));
  const activeUserHabits = await db
    .select()
    .from(userHabits)
    .where(and(eq(userHabits.userId, userId), eq(userHabits.isActive, true)));

  const completedDates = new Set<string>();
  const activeHabitIds = new Set(activeUserHabits.map((h: any) => h.id));

  for (const log of allLogs) {
    if (log.completed && activeHabitIds.has(log.userHabitId)) {
      completedDates.add(log.dateStr);
    }
  }

  const sortedDates = Array.from(completedDates).sort().reverse();
  const lastActiveDateStr = sortedDates.length > 0 ? sortedDates[0] : null;
  const streak = calculateCurrentStreak(completedDates);
  const maxStreak = calculateMaxStreak(completedDates);

  return {
    streak,
    maxStreak,
    lastActiveDateStr,
    completedDates: Array.from(completedDates),
  };
}
