import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  // email/password auth
  passwordHash: varchar("passwordHash", { length: 255 }),
  // google oauth (separate from Manus OAuth)
  googleId: varchar("googleId", { length: 128 }),
  // email verification for email/password accounts
  emailVerified: boolean("emailVerified").default(false).notNull(),
  emailVerifyToken: varchar("emailVerifyToken", { length: 128 }),
  // password reset
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiry: timestamp("passwordResetExpiry"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Leads (discovery call sign-ups) ──────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "contacted", "enrolled", "not_a_fit"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ── Enrollments ───────────────────────────────────────────────────────────────
export const enrollments = mysqlTable("enrollments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  program: mysqlEnum("program", ["fpu", "reclaim"]).default("reclaim").notNull(),
  paymentType: mysqlEnum("paymentType", ["full", "deposit"]).notNull(),
  depositPaid: boolean("depositPaid").default(false).notNull(),
  balancePaid: boolean("balancePaid").default(false).notNull(),
  status: mysqlEnum("status", ["pending", "active", "completed", "cancelled"]).default("pending").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ── Coaching Sessions ─────────────────────────────────────────────────────────
export const coachingSessions = mysqlTable("coaching_sessions", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  sessionNumber: int("sessionNumber").notNull(),
  status: mysqlEnum("status", ["not_scheduled", "scheduled", "completed", "cancelled"]).default("not_scheduled").notNull(),
  scheduledAt: timestamp("scheduledAt"),
  completedAt: timestamp("completedAt"),
  googleMeetLink: varchar("googleMeetLink", { length: 500 }),
  adminNotes: text("adminNotes"),
  privateNotes: text("privateNotes"),
  googleEventId: varchar("googleEventId", { length: 255 }),
  followUpEmailSentAt: timestamp("followUpEmailSentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = typeof coachingSessions.$inferInsert;

// ── Blog Posts ────────────────────────────────────────────────────────────────
export const blogPosts = mysqlTable("blog_posts", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  coverImage: varchar("coverImage", { length: 1000 }),
  coverImageAlt: varchar("coverImageAlt", { length: 500 }),
  published: boolean("published").default(false).notNull(),
  publishedAt: timestamp("publishedAt"),
  scheduledAt: timestamp("scheduledAt"),
  seoTitle: varchar("seoTitle", { length: 500 }),
  seoDescription: text("seoDescription"),
  authorId: int("authorId"),
  // JSON-LD Schema markup
  schemaTypes: varchar("schemaTypes", { length: 500 }), // comma-separated: "Article,FAQ,VideoObject"
  schemaFaqJson: text("schemaFaqJson"),                 // JSON array of {question, answer}
  schemaVideoUrl: varchar("schemaVideoUrl", { length: 1000 }), // YouTube URL for VideoObject
  schemaVideoDescription: text("schemaVideoDescription"),
  schemaHowToStepsJson: text("schemaHowToStepsJson"),   // JSON array of {name, text} steps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ── Follow-ups ────────────────────────────────────────────────────────────────
export const followUps = mysqlTable("follow_ups", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["review_request", "check_in", "upsell"]).notNull(),
  sentAt: timestamp("sentAt"),
  status: mysqlEnum("status", ["pending", "sent", "responded"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = typeof followUps.$inferInsert;

// ── Deposits (Stripe webhook records) ────────────────────────────────────────
export const deposits = mysqlTable("deposits", {
  id: int("id").autoincrement().primaryKey(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = typeof deposits.$inferInsert;

// ── Google Calendar Tokens ────────────────────────────────────────────────────
export const googleTokens = mysqlTable("google_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  accessToken: text("accessToken").notNull(),
  refreshToken: text("refreshToken").notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }).notNull(),
  email: varchar("email", { length: 320 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GoogleToken = typeof googleTokens.$inferSelect;
export type InsertGoogleToken = typeof googleTokens.$inferInsert;

// ── Client Files (uploads per enrollment) ─────────────────────────────────────
export const clientFiles = mysqlTable("client_files", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  uploadedByUserId: int("uploadedByUserId").notNull(),
  uploadedByRole: mysqlEnum("uploadedByRole", ["client", "admin"]).notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 1000 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 2000 }).notNull(),
  mimeType: varchar("mimeType", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientFile = typeof clientFiles.$inferSelect;
export type InsertClientFile = typeof clientFiles.$inferInsert;

// ── FPU Orders (Financial Peace University Stripe purchases) ────────────────
export const fpuOrders = mysqlTable("fpu_orders", {
  id: int("id").autoincrement().primaryKey(),
  stripeSessionId: varchar("stripeSessionId", { length: 255 }).notNull().unique(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  userId: int("userId"),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  productType: mysqlEnum("productType", ["fpu_class", "fpu_coaching"]).default("fpu_class").notNull(),
  status: mysqlEnum("status", ["pending", "paid", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FpuOrder = typeof fpuOrders.$inferSelect;
export type InsertFpuOrder = typeof fpuOrders.$inferInsert;

// ── FPU Coaching Sessions (1:1 sessions for paid FPU coaching clients) ────────
export const fpuCoachingSessions = mysqlTable("fpu_coaching_sessions", {
  id: int("id").autoincrement().primaryKey(),
  fpuOrderId: int("fpuOrderId").notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientName: varchar("clientName", { length: 255 }),
  sessionNumber: int("sessionNumber").notNull(), // 1, 2, or 3
  googleEventId: varchar("googleEventId", { length: 255 }),
  completedAt: timestamp("completedAt"),
  followUpEmailSentAt: timestamp("followUpEmailSentAt"),
  adminNotes: text("adminNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FpuCoachingSession = typeof fpuCoachingSessions.$inferSelect;
export type InsertFpuCoachingSession = typeof fpuCoachingSessions.$inferInsert;

// ── Site Settings ─────────────────────────────────────────────────────────────
export const siteSettings = mysqlTable("site_settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ── Podcast Native Broadcasting ───────────────────────────────────────────────
export const podcastSubscribers = mysqlTable("podcast_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PodcastSubscriber = typeof podcastSubscribers.$inferSelect;
export type InsertPodcastSubscriber = typeof podcastSubscribers.$inferInsert;

export const broadcastedEpisodes = mysqlTable("broadcasted_episodes", {
  id: int("id").autoincrement().primaryKey(),
  videoId: varchar("videoId", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 255 }),
  broadcastedAt: timestamp("broadcastedAt").defaultNow().notNull(),
});

export type BroadcastedEpisode = typeof broadcastedEpisodes.$inferSelect;
export type InsertBroadcastedEpisode = typeof broadcastedEpisodes.$inferInsert;

// ── FPU Group Sign-Ups (name+email collected on /financial-peace) ───────────────────────
export const fpuLeads = mysqlTable("fpu_leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FpuLead = typeof fpuLeads.$inferSelect;
export type InsertFpuLead = typeof fpuLeads.$inferInsert;

// ── Page Content (editable page sections, draft/publish workflow) ─────────────
export const pageContent = mysqlTable("page_content", {
  id: int("id").autoincrement().primaryKey(),
  page: varchar("page", { length: 100 }).notNull(),       // e.g. "financial-peace"
  key: varchar("key", { length: 100 }).notNull(),          // e.g. "hero-heading"
  publishedContent: text("publishedContent"),              // live content visitors see
  draftContent: text("draftContent"),                      // unpublished edits
  hasDraft: boolean("hasDraft").default(false).notNull(),  // true when draft differs from published
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PageContent = typeof pageContent.$inferSelect;
export type InsertPageContent = typeof pageContent.$inferInsert;

// ── Reclaim Program (LMS) ─────────────────────────────────────────────────────
export const programModules = mysqlTable("program_modules", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 1000 }),
  content: text("content"), // Rich text
  pdfUrl: varchar("pdfUrl", { length: 1000 }), // Optional PDF download
  order: int("order").notNull(), // 1 through 6
  isPublished: boolean("isPublished").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProgramModule = typeof programModules.$inferSelect;
export type InsertProgramModule = typeof programModules.$inferInsert;

export const assignments = mysqlTable("assignments", {
  id: int("id").autoincrement().primaryKey(),
  moduleId: int("moduleId").notNull(),
  question: text("question").notNull(),
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = typeof assignments.$inferInsert;

export const assignmentSubmissions = mysqlTable("assignment_submissions", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  userId: int("userId").notNull(),
  answer: text("answer"),
  fileUrl: varchar("fileUrl", { length: 1000 }),
  feedback: text("feedback"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
export type InsertAssignmentSubmission = typeof assignmentSubmissions.$inferInsert;

export const moduleProgress = mysqlTable("module_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  moduleId: int("moduleId").notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  lastReminderSentAt: timestamp("lastReminderSentAt"),
});

export type ModuleProgress = typeof moduleProgress.$inferSelect;
export type InsertModuleProgress = typeof moduleProgress.$inferInsert;

// ── Email Automation ─────────────────────────────────────────────────────────
export const subscribers = mysqlTable("subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  lastName: varchar("lastName", { length: 255 }),
  segments: text("segments"), // JSON array of segment strings e.g. ["fpu", "podcast"]
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = typeof subscribers.$inferInsert;

export const sequenceEnrollments = mysqlTable("sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  subscriberId: int("subscriberId").notNull(),
  sequenceId: varchar("sequenceId", { length: 255 }).notNull(), // e.g. "fpu_babystep_1"
  currentStep: int("currentStep").default(0).notNull(), // 0 = not started
  lastEmailedAt: timestamp("lastEmailedAt"),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;
export type InsertSequenceEnrollment = typeof sequenceEnrollments.$inferInsert;

// ── Habit Tracker ─────────────────────────────────────────────────────────────
export const habitTemplates = mysqlTable("habit_templates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type HabitTemplate = typeof habitTemplates.$inferSelect;
export type InsertHabitTemplate = typeof habitTemplates.$inferInsert;

export const userHabits = mysqlTable("user_habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  order: int("order").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserHabit = typeof userHabits.$inferSelect;
export type InsertUserHabit = typeof userHabits.$inferInsert;

export const userHabitLogs = mysqlTable("user_habit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userHabitId: int("userHabitId").notNull(),
  userId: int("userId").notNull(),
  dateStr: varchar("dateStr", { length: 10 }).notNull(), // YYYY-MM-DD
  completed: boolean("completed").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserHabitLog = typeof userHabitLogs.$inferSelect;
export type InsertUserHabitLog = typeof userHabitLogs.$inferInsert;
