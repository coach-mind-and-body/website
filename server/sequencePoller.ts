import { processEmailSequences } from "./sequences";

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000; // every 4 hours

let started = false;

export function startSequencePoller() {
  if (started) return;
  started = true;

  console.log("[Sequence Poller] Starting email sequence processor (every 4 hours)...");

  processEmailSequences().catch((err) =>
    console.error("[Sequence Poller] Error on initial run:", err)
  );

  setInterval(() => {
    processEmailSequences().catch((err) =>
      console.error("[Sequence Poller] Error on interval run:", err)
    );
  }, CHECK_INTERVAL_MS);
}