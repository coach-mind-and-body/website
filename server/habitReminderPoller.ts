import { isHabitReminderWindow, processHabitReminders } from "./habitReminders";

const CHECK_INTERVAL_MS = 60_000; // every minute

const globalForPoller = globalThis as typeof globalThis & {
  __habitReminderPollerStarted?: boolean;
};

/**
 * Background poller: around 8:00 PM America/Denver, send daily habit push reminders.
 * Starts at most once per Node process (Next can call instrumentation more than once).
 */
export function startHabitReminderPoller() {
  if (globalForPoller.__habitReminderPollerStarted) {
    console.log("[Habit Reminder Poller] Already started in this process — skipping.");
    return;
  }
  globalForPoller.__habitReminderPollerStarted = true;

  console.log("[Habit Reminder Poller] Starting (fires ~8:00 PM America/Denver, once per day)...");

  const tick = () => {
    if (!isHabitReminderWindow()) return;
    processHabitReminders().catch((err) =>
      console.error("[Habit Reminder Poller] Error:", err)
    );
  };

  // Do not fire on boot unless we're already in the evening window
  setInterval(tick, CHECK_INTERVAL_MS);
}
