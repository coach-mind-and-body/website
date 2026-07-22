import "dotenv/config";
import { startCallFollowUpPoller } from "./callFollowUpPoller";
import { startLmsPoller } from "./lmsPoller";
import { startYoutubePoller } from "./youtubePoller";
import { startSequencePoller } from "./sequencePoller";
import { startHabitReminderPoller } from "./habitReminderPoller";
import { processScheduledCampaigns } from "./crm/campaignJob";

console.log("Starting background worker pollers...");

// Start the Google Calendar polling service for automated follow-up emails
startCallFollowUpPoller();

// Start the LMS reminder polling service
startLmsPoller();

// Start the YouTube Podcast broadcast polling service
startYoutubePoller();

// Process nurture email sequences (snack hack, reclaim, FPU)
startSequencePoller();

// Daily habit push reminders (~8:00 PM America/Denver)
startHabitReminderPoller();

// Process scheduled CRM SMS campaigns every 60 seconds
processScheduledCampaigns().catch((err) =>
  console.error("[Campaign Job] Error on initial run:", err)
);
setInterval(() => {
  processScheduledCampaigns().catch((err) =>
    console.error("[Campaign Job] Error on interval run:", err)
  );
}, 60_000);

// Keep the process running
process.on("SIGTERM", () => {
  console.log("Worker process terminating...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Worker process interrupted...");
  process.exit(0);
});
