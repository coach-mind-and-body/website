export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startSequencePoller } = await import("./server/sequencePoller");
    startSequencePoller();

    // Daily habit push reminders (~8pm America/Denver) even if the separate
    // worker process isn't running. Durable once-per-day lock prevents doubles.
    const { startHabitReminderPoller } = await import("./server/habitReminderPoller");
    startHabitReminderPoller();

    // Lightweight calendar sync so discovery bookings land in CRM even if the
    // separate worker process isn't running (webhook + this poll both call the same path).
    const { syncRecentCalendarEvents } = await import("./server/googleCalendar");
    const runSync = () =>
      syncRecentCalendarEvents().catch((err) =>
        console.error("[Instrumentation] Calendar sync error:", err)
      );
    runSync();
    setInterval(runSync, 10 * 60 * 1000); // every 10 minutes

    // Scheduled admin newsletters. Production Docker only runs `next start`,
    // not `pnpm worker` — so due sends would sit as "scheduled" forever without this.
    const { processSendingNewsletters } = await import("./server/newsletterJob");
    const runNewsletters = () =>
      processSendingNewsletters().catch((err) =>
        console.error("[Instrumentation] Newsletter job error:", err)
      );
    runNewsletters();
    setInterval(runNewsletters, 30_000);
  }
}