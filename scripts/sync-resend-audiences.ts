import "dotenv/config";

const { syncAllAdminAudiencesToResend } = await import("../server/resendAudienceSync");

const report = await syncAllAdminAudiencesToResend();
console.log(JSON.stringify({
  segments: report.segments,
  created: report.created,
  updated: report.updated,
  addedToSegment: report.addedToSegment,
  removedFromSegment: report.removedFromSegment,
  alreadyUnsubscribed: report.alreadyUnsubscribed,
  failed: report.failed.slice(0, 20),
  failedCount: report.failed.length,
}, null, 2));
process.exit(report.failed.length > 0 ? 1 : 0);
