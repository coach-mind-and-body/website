import { COOKIE_NAME } from "@shared/const";
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
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
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
});

export type AppRouter = typeof appRouter;
