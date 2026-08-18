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
import { messagingRouter } from "./routers/messaging";
import { crmAutomationsRouter } from "./routers/crmAutomations";
import { templatesRouter } from "./routers/templates";
import { aiTrainingRouter } from "./routers/aiTraining";
import { pushNotificationsRouter } from "./routers/pushNotifications";
import { caloriesRouter } from "./routers/calories";
import { fitnessRouter } from "./routers/fitness";
import { newsletterRouter } from "./routers/newsletter";
import { foodRouter } from "./routers/food";
import { coachRouter } from "./routers/coach";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(async ({ ctx }) => {
      const user = ctx.user;
      if (!user) return null;
      const { isAdminEmail } = await import("../shared/adminEmails");
      if (isAdminEmail(user.email) && user.role !== "admin") {
        const { getDb } = await import("./db");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const db = await getDb();
        if (db) {
          await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
        }
        return { ...user, role: "admin" };
      }
      return user;
    }),
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
  messaging: messagingRouter,
  crmAutomations: crmAutomationsRouter,
  templates: templatesRouter,
  aiTraining: aiTrainingRouter,
  pushNotifications: pushNotificationsRouter,
  calories: caloriesRouter,
  fitness: fitnessRouter,
  newsletter: newsletterRouter,
  food: foodRouter,
  coach: coachRouter,
});

export type AppRouter = typeof appRouter;
