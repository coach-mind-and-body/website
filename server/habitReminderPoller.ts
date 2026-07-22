import { isHabitReminderWindow, processHabitReminders } from "./habitReminders";

const CHECK_INTERVAL_MS = 60_000; // every minute

/**
 * Background poller: around 8:00 PM America/Denver, send daily habit push reminders.
 * Durable once-per-day lock is inside processHabitReminders.
 */
export function startHabitReminderPoller() {
  console.log("[Habit Reminder Poller] Starting (fires ~8:00 PM America/Denver)...");

  const tick = () => {
    if (!isHabitReminderWindow()) return;
    processHabitReminders().catch((err) =>
      console.error("[Habit Reminder Poller] Error:", err)
    );
  };

  // Check shortly after boot, then every minute
  setTimeout(tick, 5_000);
  setInterval(tick, CHECK_INTERVAL_MS);
}
