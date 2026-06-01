import { publicProcedure, router } from "../_core/trpc";
import { processEmailSequences } from "../sequences";

export const cronRouter = router({
  // This endpoint can be hit daily by cron-job.org or Railway cron
  // In a production environment, you might want to add a secret token check here
  triggerDailySequences: publicProcedure.mutation(async () => {
    try {
      const result = await processEmailSequences();
      return result;
    } catch (error: any) {
      console.error("[Cron] Error processing sequences:", error);
      throw new Error("Failed to process sequences");
    }
  }),
});
