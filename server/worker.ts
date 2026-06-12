import "dotenv/config";
import { startCallFollowUpPoller } from "./callFollowUpPoller";
import { startLmsPoller } from "./lmsPoller";
import { startYoutubePoller } from "./youtubePoller";

console.log("Starting background worker pollers...");

// Start the Google Calendar polling service for automated follow-up emails
startCallFollowUpPoller();

// Start the LMS reminder polling service
startLmsPoller();

// Start the YouTube Podcast broadcast polling service
startYoutubePoller();

// Keep the process running
process.on("SIGTERM", () => {
  console.log("Worker process terminating...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Worker process interrupted...");
  process.exit(0);
});
