import { cronTick, isPairsReminderWindow } from "@/lib/weekly-pairs/cron";

const globalForPoller = globalThis as typeof globalThis & {
  __pairsReminderPollerStarted?: boolean;
};

/** Sunday 5pm Denver check. The round record keeps it to one send. */
export function startPairsReminderPoller() {
  if (globalForPoller.__pairsReminderPollerStarted) return;
  globalForPoller.__pairsReminderPollerStarted = true;

  const tick = () => {
    if (!isPairsReminderWindow()) return;
    cronTick().catch((err) => console.error("[Pairs reminder]", err));
  };

  tick();
  setInterval(tick, 60_000);
}