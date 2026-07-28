import { eq, and, gte } from "drizzle-orm";
import {
  userHabits,
  userHabitLogs,
  userVictoryLists,
} from "../drizzle/schema";
import { calculateCurrentStreak, calculateMaxStreak } from "../lib/habitStreak";
import { todayMountainDateStr } from "../lib/mountainTime";

export type WeeklyInsight = {
  weekCompletedDays: number;
  lastWeekCompletedDays: number;
  currentStreak: number;
  bestStreak: number;
  victoryDaysThisWeek: number;
  bestWeekday: string | null;
  topHabitTitle: string | null;
  headline: string;
  body: string;
  tip: string;
};

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function addDaysStr(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + delta);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekdayName(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return WEEKDAYS[d.getDay()] ?? "day";
}

/**
 * Rule-based weekly pattern insight (Lee Anne tone). No LLM.
 */
export async function computeWeeklyInsight(
  db: any,
  userId: number
): Promise<WeeklyInsight> {
  const today = todayMountainDateStr();
  const weekStart = addDaysStr(today, -6);
  const lastWeekStart = addDaysStr(today, -13);
  const lastWeekEnd = addDaysStr(today, -7);

  const habits = await db
    .select()
    .from(userHabits)
    .where(and(eq(userHabits.userId, userId), eq(userHabits.isActive, true)));
  const activeIds = new Set(habits.map((h: { id: number }) => h.id));

  const logs = await db
    .select()
    .from(userHabitLogs)
    .where(
      and(eq(userHabitLogs.userId, userId), gte(userHabitLogs.dateStr, lastWeekStart))
    );

  const completedByDate = new Map<string, number>();
  const habitCompletions = new Map<number, number>();

  for (const log of logs) {
    if (!log.completed || !activeIds.has(log.userHabitId)) continue;
    completedByDate.set(log.dateStr, (completedByDate.get(log.dateStr) || 0) + 1);
    habitCompletions.set(
      log.userHabitId,
      (habitCompletions.get(log.userHabitId) || 0) + 1
    );
  }

  const allCompletedDates = new Set<string>();
  const allLogs = await db
    .select()
    .from(userHabitLogs)
    .where(eq(userHabitLogs.userId, userId));
  for (const log of allLogs) {
    if (log.completed && activeIds.has(log.userHabitId)) {
      allCompletedDates.add(log.dateStr);
    }
  }

  let weekCompletedDays = 0;
  let lastWeekCompletedDays = 0;
  const weekdayCounts = new Map<string, number>();

  for (const [dateStr] of completedByDate) {
    if (dateStr >= weekStart && dateStr <= today) {
      weekCompletedDays++;
      const wd = weekdayName(dateStr);
      weekdayCounts.set(wd, (weekdayCounts.get(wd) || 0) + 1);
    }
    if (dateStr >= lastWeekStart && dateStr <= lastWeekEnd) {
      lastWeekCompletedDays++;
    }
  }

  let bestWeekday: string | null = null;
  let bestWdCount = 0;
  for (const [wd, c] of weekdayCounts) {
    if (c > bestWdCount) {
      bestWdCount = c;
      bestWeekday = wd;
    }
  }

  let topHabitTitle: string | null = null;
  let topHabitCount = 0;
  for (const h of habits) {
    const c = habitCompletions.get(h.id) || 0;
    if (c > topHabitCount) {
      topHabitCount = c;
      topHabitTitle = h.title;
    }
  }

  const victories = await db
    .select()
    .from(userVictoryLists)
    .where(
      and(eq(userVictoryLists.userId, userId), gte(userVictoryLists.dateStr, weekStart))
    );
  const victoryDaysThisWeek = victories.filter(
    (v: { win1: string; win2: string; win3: string }) =>
      (v.win1 || v.win2 || v.win3).trim().length > 0
  ).length;

  const currentStreak = calculateCurrentStreak(allCompletedDates);
  const bestStreak = Math.max(currentStreak, calculateMaxStreak(allCompletedDates));

  const delta = weekCompletedDays - lastWeekCompletedDays;
  let headline = "Your weekly pattern check-in";
  let body = `You showed up ${weekCompletedDays} day${weekCompletedDays === 1 ? "" : "s"} this week.`;
  let tip = "Tonight: write three wins. Your brain needs evidence of progress.";

  if (weekCompletedDays === 0) {
    headline = "A quiet week — not a failure";
    body =
      "You didn't log much this week. That doesn't mean you're broken. It means tomorrow is a fresh vote for the woman you're becoming.";
    tip = "Pick one habit for tomorrow. One. Future you only needs one win to restart.";
  } else if (delta > 0) {
    headline = "You're building momentum";
    body = `You completed habits on ${weekCompletedDays} days this week — up from ${lastWeekCompletedDays} last week. That's a pattern, not willpower.`;
    tip = bestWeekday
      ? `${bestWeekday}s are strong for you — protect that day like an appointment.`
      : "Keep stacking small wins. Consistency beats perfect weeks.";
  } else if (delta < 0 && weekCompletedDays > 0) {
    headline = "Still in the game";
    body = `You showed up ${weekCompletedDays} day${weekCompletedDays === 1 ? "" : "s"} this week (was ${lastWeekCompletedDays}). Soft weeks happen. Comebacks build identity.`;
    tip = "Ask: what interrupted progress? Not “why can’t I?” — what got in the way?";
  } else {
    headline = "Steady is a superpower";
    body = `You completed habits on ${weekCompletedDays} days — matching last week. Steady patterns are how midlife change sticks.`;
  }

  if (topHabitTitle && topHabitCount > 0) {
    body += ` Your strongest habit right now: “${topHabitTitle}.”`;
  }
  if (victoryDaysThisWeek > 0) {
    body += ` You logged victories on ${victoryDaysThisWeek} day${victoryDaysThisWeek === 1 ? "" : "s"} — that's your scoreboard of what went right.`;
  }
  if (currentStreak > 0) {
    tip =
      currentStreak >= 7
        ? `You're on a ${currentStreak}-day streak. Best ever: ${bestStreak}. One-percenters keep promises when nobody is watching.`
        : tip;
  }

  return {
    weekCompletedDays,
    lastWeekCompletedDays,
    currentStreak,
    bestStreak,
    victoryDaysThisWeek,
    bestWeekday,
    topHabitTitle,
    headline,
    body,
    tip,
  };
}
