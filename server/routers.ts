import { COOKIE_NAME } from "@shared/const";
import { cookies } from "next/headers";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { paymentRouter } from "./routers/payment";
import { blogRouter } from "./routers/blog";
import { leadsRouter } from "./routers/leads";
import { enrollmentRouter } from "./routers/enrollment";
import { clientFilesRouter } from "./routers/clientFiles";
import { googleCalendarRouter } from "./routers/googleCalendarRouter";
import { settingsRouter } from "./routers/settings";
import { fpuRouter } from "./routers/fpu";
import { pageEditorRouter } from "./routers/pageEditor";
import { podcastRouter } from "./routers/podcast";
import { seoOptimizerRouter } from "./routers/seoOptimizer";
import { reclaimHubRouter } from "./routers/reclaimHub";
import { leadgenRouter } from "./routers/leadgen";
import { cronRouter } from "./routers/cron";
import { habitRouter } from "./routers/habit";
import { pushRouter } from "./routers/push";
import { challengesRouter } from "./routers/challenges";
import { appUpdatesRouter } from "./routers/appUpdates";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieStore = await cookies();
      cookieStore.delete(COOKIE_NAME);
      return { success: true } as const;
    }),
  }),
  payment: paymentRouter,
  blog: blogRouter,
  leads: leadsRouter,
  enrollment: enrollmentRouter,
  clientFiles: clientFilesRouter,
  googleCalendar: googleCalendarRouter,
  settings: settingsRouter,
  fpu: fpuRouter,
  pageEditor: pageEditorRouter,
  podcast: podcastRouter,
  seoOptimizer: seoOptimizerRouter,
  reclaimHub: reclaimHubRouter,
  leadgen: leadgenRouter,
  cron: cronRouter,
  habit: habitRouter,
  push: pushRouter,
  challenges: challengesRouter,
  appUpdates: appUpdatesRouter,
});

export type AppRouter = typeof appRouter;
