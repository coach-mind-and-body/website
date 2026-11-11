/**
 * Category strings shared with the iOS app (UNNotificationCategory.identifier).
 * Keep these in lockstep with NotificationCategory in NotificationService.swift.
 */
export const NOTIFICATION_CATEGORY = {
  coachMessage: "coach-message",
  habitReminder: "habit-reminder",
  waterProtein: "water-protein",
  moveReminder: "move-reminder",
  sessionReminder: "session-reminder",
  homeworkForm: "homework-form",
  foodLog: "food-log",
  coachClientMessage: "coach-client-message",
  coachIntake: "coach-intake",
  challenge: "challenge",
} as const;

export type NotificationCategoryId = (typeof NOTIFICATION_CATEGORY)[keyof typeof NOTIFICATION_CATEGORY];

export const QUICK_PROTEIN_NAME = "Quick protein";
export const QUICK_PROTEIN_GRAMS = 20;
/** 4 kcal per gram, so a protein-only quick add is not logged as zero calories. */
export const QUICK_PROTEIN_CALORIES_PER_GRAM = 4;
export const WALK_10_NAME = "Walk 10m";
export const WALK_20_NAME = "Walk 20m";

export function isMealMacroTitle(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes("protein") || t.includes("fiber");
}

export function isVictoryTitle(title: string): boolean {
  const t = title.trim().toLowerCase();
  return (
    t.includes("3 win") ||
    t.includes("three win") ||
    t.includes("3 victories") ||
    t.includes("victory list") ||
    t === "write 3 wins" ||
    t === "write 3 wins tonight"
  );
}

export function isWaterTitle(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes("water") || t.includes("hydrate");
}

/** Cups get one cup. Everything else (including blank) is the +8 oz button. */
export function waterStep(unit: string | null | undefined): number {
  const u = (unit ?? "").toLowerCase();
  if (u.includes("cup")) return 1;
  return 8;
}

export function walkLogName(minutes: number): string {
  return minutes >= 20 ? WALK_20_NAME : WALK_10_NAME;
}

export type HabitNudgeHabit = { id: number; title: string; order: number };

export type HabitNudge = {
  title: string;
  body: string;
  url: string;
  category: typeof NOTIFICATION_CATEGORY.habitReminder;
  habitId?: number;
};

/** Same branches as the evening cron. Adds the habit the Mark done button should close. */
export function chooseHabitNudge(input: {
  eveningOn: boolean;
  victoryOn: boolean;
  activeIds: number[];
  completedIds: number[];
  hasVictory: boolean;
  habits: HabitNudgeHabit[];
}): HabitNudge | null {
  const activeIds = input.activeIds;
  if (activeIds.length === 0) return null;
  const completedActive = activeIds.filter((id) => input.completedIds.includes(id));
  const hasCompletedAny = completedActive.length > 0;
  const allDone = completedActive.length >= activeIds.length;
  const habitId = firstOpenHabitId(input.habits, activeIds, input.completedIds);

  if (!hasCompletedAny && input.eveningOn) {
    return {
      title: "Quick habit check-in",
      body: "Take 30 seconds to log today's habits. Small steps add up.",
      url: "/habit-tracker",
      category: NOTIFICATION_CATEGORY.habitReminder,
      habitId,
    };
  }
  if (hasCompletedAny && !allDone && input.eveningOn) {
    const left = activeIds.length - completedActive.length;
    return {
      title: "Almost there",
      body: `${left} habit${left === 1 ? "" : "s"} left today. One more vote for future you.`,
      url: "/habit-tracker",
      category: NOTIFICATION_CATEGORY.habitReminder,
      habitId,
    };
  }
  if (hasCompletedAny && !input.hasVictory && input.victoryOn) {
    return {
      title: "Capture 3 wins",
      body: "Before bed: what went right today? Your brain needs evidence.",
      url: "/habit-tracker?focus=victories",
      category: NOTIFICATION_CATEGORY.habitReminder,
    };
  }
  return null;
}

export function firstOpenHabitId(
  habits: HabitNudgeHabit[],
  activeIds: number[],
  completedIds: number[]
): number | undefined {
  const active = new Set(activeIds);
  const done = new Set(completedIds);
  const open = habits
    .filter(
      (habit) =>
        active.has(habit.id) &&
        !done.has(habit.id) &&
        !isMealMacroTitle(habit.title) &&
        !isVictoryTitle(habit.title)
    )
    .sort((a, b) => a.order - b.order || a.id - b.id);
  return open[0]?.id;
}

export function pickWaterHabit<
  T extends { id: number; title: string; type: string; isActive?: boolean | null; order?: number | null },
>(habits: T[]): T | null {
  const matches = habits.filter((habit) => habit.isActive !== false && isWaterTitle(habit.title));
  const numeric = matches.filter((habit) => habit.type === "numeric");
  const pool = numeric.length ? numeric : matches;
  return [...pool].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.id - b.id)[0] ?? null;
}

export function addedAmount(
  current: number | null | undefined,
  step: number,
  target: number | null | undefined
): { numericValue: number; completed: boolean } {
  const numericValue = Math.max(0, (current ?? 0) + step);
  const goal = target ?? 0;
  return { numericValue, completed: goal > 0 ? numericValue >= goal : numericValue > 0 };
}

export function donePatch(
  habit: { type: string; targetValue: number | null },
  log: { numericValue: number | null } | null
): { completed: true; skipped: false; numericValue: number | null } {
  if (habit.type === "numeric") {
    const target = habit.targetValue ?? 0;
    const current = log?.numericValue ?? 0;
    const numericValue = target > 0 ? Math.max(current, target) : Math.max(current, 1);
    return { completed: true, skipped: false, numericValue };
  }
  return { completed: true, skipped: false, numericValue: log?.numericValue ?? null };
}

export function skipPatch(log: { numericValue: number | null } | null): {
  completed: false;
  skipped: true;
  numericValue: number | null;
} {
  return { completed: false, skipped: true, numericValue: log?.numericValue ?? null };
}

export function formAssignedAlert(title: string): { title: string; body: string } {
  const name = title.replace(/\s+/g, " ").trim() || "A new worksheet";
  return { title: "A worksheet is ready", body: name };
}

export function intakeAlert(name: string): { title: string; body: string } {
  const who = name.replace(/\s+/g, " ").trim() || "Someone";
  return { title: "New intake", body: `${who} filled out an intake.` };
}

type EnrollmentRow = { userId: number; program: string; status: string };
type UnlockRow = { userId: number; moduleId: number };

/** Who should get the "new worksheet" push. Mirrors clientCanSeeForm for a just-published form. */
export function formPushRecipients(input: {
  moduleId: number | null;
  programTags: readonly string[];
  listed: boolean;
  enrollments: EnrollmentRow[];
  unlocks: UnlockRow[];
}): number[] {
  if (!input.listed) return [];
  const programsByUser = new Map<number, string[]>();
  for (const row of input.enrollments) {
    if (row.status !== "active" && row.status !== "completed") continue;
    const list = programsByUser.get(row.userId) ?? [];
    list.push(row.program);
    programsByUser.set(row.userId, list);
  }
  const unlocksByUser = new Map<number, Set<number>>();
  for (const row of input.unlocks) {
    const set = unlocksByUser.get(row.userId) ?? new Set<number>();
    set.add(row.moduleId);
    unlocksByUser.set(row.userId, set);
  }
  const ids = new Set<number>([...programsByUser.keys(), ...unlocksByUser.keys()]);
  const recipients: number[] = [];
  for (const userId of ids) {
    const enrolled = programsByUser.get(userId) ?? [];
    const unlocked = input.moduleId != null && (unlocksByUser.get(userId)?.has(input.moduleId) ?? false);
    const visible =
      input.moduleId != null
        ? unlocked
        : input.programTags.some((tag) => enrolled.includes(tag));
    if (visible) recipients.push(userId);
  }
  return recipients.sort((a, b) => a - b);
}
