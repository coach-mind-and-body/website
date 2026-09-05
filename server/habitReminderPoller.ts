import { isHabitReminderWindow, processHabitReminders } from "./habitReminders";
import { isDay3Window, processDay3Reengage } from "./habitDay3";
import {
  isWeeklyInsightEmailWindow,
  processWeeklyInsightEmails,
} from "./habitWeeklyInsightEmail";
import { challengePushKindNow, processChallengePushes } from "./challengePushes";

const CHECK_INTERVAL_MS = 60_000; // every minute

const globalForPoller = globalThis as typeof globalThis & {
  __habitReminderPollerStarted?: boolean;
};

/**
 * Background poller:
 * - ~8:00 PM MT evening habit / victory push
 * - ~9:00 AM MT day-3 re-engage
 * - Sunday ~9:05 AM MT weekly insight email
 * - Real Food Reset: 8am morning, 11:45 live, 7pm check-in (America/Denver)
 * Starts at most once per Node process.
 */
export function startHabitReminderPoller() {
  if (globalForPoller.__habitReminderPollerStarted) {
    console.log("[Habit Reminder Poller] Already started in this process — skipping.");
    return;
  }
  globalForPoller.__habitReminderPollerStarted = true;

  console.log(
    "[Habit Reminder Poller] Starting (habits 8pm + day3 9am + Sunday insight + Real Food Reset pushes, America/Denver)..."
  );

  const tick = () => {
    if (isHabitReminderWindow()) {
      processHabitReminders().catch((err) =>
        console.error("[Habit Reminder Poller] Error:", err)
      );
    }
    if (isDay3Window()) {
      processDay3Reengage().catch((err) =>
        console.error("[Habit Day3 Poller] Error:", err)
      );
    }
    if (isWeeklyInsightEmailWindow()) {
      processWeeklyInsightEmails().catch((err) =>
        console.error("[Habit Weekly Insight] Error:", err)
      );
    }
    if (challengePushKindNow()) {
      processChallengePushes().catch((err) =>
        console.error("[Challenge Push] Error:", err)
      );
    }
  };

  setInterval(tick, CHECK_INTERVAL_MS);
}
