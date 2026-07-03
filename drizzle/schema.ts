import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
  date,
} from "drizzle-orm/mysql-core";

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  phone: varchar("phone", { length: 50 }),
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
  shareHabitsWithCoach: boolean("shareHabitsWithCoach").default(false).notNull(),
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


// ── Podcast Native Broadcasting ───────────────────────────────────────────────
export const podcastSubscribers = mysqlTable("podcast_subscribers", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PodcastSubscriber = typeof podcastSubscribers.$inferSelect;
// ── Push Notifications & Challenges ──────────────────────────────────────────

export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").references(() => users.id),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  deviceId: text("deviceId"), // For anonymous users
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const challenges = mysqlTable("challenges", {
  id: int("id").primaryKey().autoincrement(),
  title: text("title").notNull(),
  description: text("description"),
  durationDays: int("durationDays").notNull().default(7),
  isActive: boolean("isActive").notNull().default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userChallenges = mysqlTable("user_challenges", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").references(() => users.id),
  deviceId: text("deviceId"), // For anonymous users
  challengeId: int("challengeId").references(() => challenges.id).notNull(),
  startDate: date("startDate", { mode: "string" }).notNull(),
  status: varchar("status", { length: 50, enum: ["active", "completed", "failed"] }).notNull().default("active"),
});

export const userChallengeLogs = mysqlTable("user_challenge_logs", {
  id: int("id").primaryKey().autoincrement(),
  userChallengeId: int("userChallengeId").references(() => userChallenges.id).notNull(),
  dateStr: date("dateStr", { mode: "string" }).notNull(),
});

export const appUpdates = mysqlTable("app_updates", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  videoUrl: text("videoUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = typeof challenges.$inferInsert;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = typeof userChallenges.$inferInsert;
export type UserChallengeLog = typeof userChallengeLogs.$inferSelect;
export type InsertUserChallengeLog = typeof userChallengeLogs.$inferInsert;
export type AppUpdate = typeof appUpdates.$inferSelect;
export type InsertAppUpdate = typeof appUpdates.$inferInsert;

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

// Old email-automation sequenceEnrollments removed — canonical definition is below (CRM sequences)

// ── Habit Tracker ─────────────────────────────────────────────────────────────
export const habitTemplates = mysqlTable("habit_templates", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["boolean", "numeric"]).default("boolean").notNull(),
  targetValue: int("targetValue"),
  unit: varchar("unit", { length: 50 }),
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
  type: mysqlEnum("type", ["boolean", "numeric"]).default("boolean").notNull(),
  targetValue: int("targetValue"),
  unit: varchar("unit", { length: 50 }),
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
  numericValue: int("numericValue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserHabitLog = typeof userHabitLogs.$inferSelect;
export type InsertUserHabitLog = typeof userHabitLogs.$inferInsert;

export const userDailyNotes = mysqlTable("user_daily_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dateStr: varchar("dateStr", { length: 10 }).notNull(), // YYYY-MM-DD
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserDailyNote = typeof userDailyNotes.$inferSelect;
export type InsertUserDailyNote = typeof userDailyNotes.$inferInsert;

// ─── CRM Conversations (Unified Inbox) ───────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // Linked to users table if they are an enrolled client
  leadId: int("leadId"), // Linked to leads table if they are a prospect
  contactPhone: varchar("contactPhone", { length: 64 }), // The primary identifier for SMS
  contactEmail: varchar("contactEmail", { length: 320 }),
  platform: mysqlEnum("platform", [
    "sms",
    "whatsapp",
    "apple_business",
    "webchat",
    "gmb",
    "facebook",
    "instagram",
  ]).default("sms").notNull(),
  status: mysqlEnum("status", ["open", "closed", "snoozed"])
    .default("open")
    .notNull(),
  assignedToId: int("assignedToId"), // The admin user ID handling this chat
  unreadCount: int("unreadCount").default(0).notNull(),
  botActive: boolean("botActive").default(true).notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;

// ─── CRM Messages ────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound", "system"]).notNull(),
  senderName: varchar("senderName", { length: 255 }), 
  content: text("content"), // The message body
  mediaUrl: varchar("mediaUrl", { length: 1000 }), // URL for MMS (images, PDFs, VCFs)
  twilioSid: varchar("twilioSid", { length: 128 }), // To track delivery status via Twilio API
  status: mysqlEnum("status", [
    "queued",
    "sent",
    "delivered",
    "failed",
    "received",
  ]).default("received").notNull(),
  isAutomated: boolean("isAutomated").default(false).notNull(), // Was this sent by Gemini/System?
  isInternal: boolean("isInternal").default(false).notNull(), // Team whisper
  scheduledAt: timestamp("scheduledAt"), // Future scheduled message
  shortLinkId: varchar("shortLinkId", { length: 255 }), // Short.io link ID for click tracking
  hasClicked: boolean("hasClicked").default(false).notNull(), // Has the user clicked the short link
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;

// ─── CRM Call Logs ───────────────────────────────────────────────────────────
export const callLogs = mysqlTable("call_logs", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId"), // Optionally link to a conversation thread
  userId: int("userId"), // Link to user if known
  leadId: int("leadId"), // Link to lead if known
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  fromNumber: varchar("fromNumber", { length: 64 }).notNull(),
  toNumber: varchar("toNumber", { length: 64 }).notNull(),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  recordingUrl: varchar("recordingUrl", { length: 1000 }), // Twilio MP3 URL
  transcript: text("transcript"), // Full AI transcript
  aiSummary: text("aiSummary"), // Gemini's actionable summary
  twilioCallSid: varchar("twilioCallSid", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CallLog = typeof callLogs.$inferSelect;

// ─── Phase 5: CRM Campaigns (One-time blasts) ────────────────────────────────
export const campaigns = mysqlTable("campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  targetTagId: int("targetTagId"), // Leaving for compatibility, might map to user segments later
  messageBody: text("messageBody").notNull(), // The content of the SMS
  mediaUrl: varchar("mediaUrl", { length: 1000 }), // URL for MMS (images, PDFs, VCFs)
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "completed", "failed"])
    .default("draft")
    .notNull(),
  scheduledAt: timestamp("scheduledAt"), // When to send (null if immediate/draft)
  sentCount: int("sentCount").default(0).notNull(),
  failedCount: int("failedCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Campaign = typeof campaigns.$inferSelect;

// ─── Phase 5: CRM Sequences (Drip Automation) ────────────────────────────────
export const sequences = mysqlTable("sequences", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), 
  triggerTagId: int("triggerTagId"), // Optional: Tag that automatically triggers this sequence
  isActive: boolean("isActive").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Sequence = typeof sequences.$inferSelect;

export const sequenceSteps = mysqlTable("sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepOrder: int("stepOrder").notNull(), // 1, 2, 3...
  delayHours: int("delayHours").default(0).notNull(), // Wait X hours after the PREVIOUS step (or enrollment if step 1)
  messageBody: text("messageBody").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SequenceStep = typeof sequenceSteps.$inferSelect;

export const sequenceEnrollments = mysqlTable("sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: varchar("sequenceId", { length: 255 }).notNull(),
  userId: int("userId"),
  leadId: int("leadId"),
  currentStepId: int("currentStepId").default(0).notNull(), // Links to sequence_steps.id (null if completed)
  nextExecutionAt: timestamp("nextExecutionAt"), // When the current step should be sent
  
  // Dummy columns added to bypass drizzle-kit rename prompts in CI
  subscriberId: int("subscriberId"),
  currentStep: int("currentStep"),
  lastEmailedAt: timestamp("lastEmailedAt"),

  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"])
    .default("active")
    .notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SequenceEnrollment = typeof sequenceEnrollments.$inferSelect;

// ─── AI Knowledge Base ───────────────────────────────────────────────────────
export const aiKnowledge = mysqlTable("ai_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 128 }).notNull(), // Policy, Pricing, General
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AiKnowledge = typeof aiKnowledge.$inferSelect;
export type InsertAiKnowledge = typeof aiKnowledge.$inferInsert;



export const messageTemplates = mysqlTable("message_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MessageTemplate = typeof messageTemplates.$inferSelect;


// ── Calories & Fitness Tracking ───────────────────────────────────────────────
export const calorieLogs = mysqlTable("calorie_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dateStr: varchar("dateStr", { length: 10 }).notNull(), // YYYY-MM-DD
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack", "drink"]).default("snack").notNull(),
  foodName: varchar("foodName", { length: 500 }).notNull(),
  calories: int("calories").default(0).notNull(),
  protein: int("protein").default(0).notNull(),
  carbs: int("carbs").default(0).notNull(),
  fat: int("fat").default(0).notNull(),
  fiber: int("fiber").default(0).notNull(),
  imageUrl: varchar("imageUrl", { length: 1000 }), // If they snapped a photo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalorieLog = typeof calorieLogs.$inferSelect;
export type InsertCalorieLog = typeof calorieLogs.$inferInsert;

export const fitnessLogs = mysqlTable("fitness_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dateStr: varchar("dateStr", { length: 10 }).notNull(), // YYYY-MM-DD
  exerciseName: varchar("exerciseName", { length: 500 }).notNull(),
  sets: int("sets").default(1).notNull(),
  reps: int("reps").default(0).notNull(),
  weight: int("weight").default(0).notNull(), // in lbs or kg
  durationMinutes: int("durationMinutes").default(0).notNull(),
  caloriesBurned: int("caloriesBurned"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FitnessLog = typeof fitnessLogs.$inferSelect;
export type InsertFitnessLog = typeof fitnessLogs.$inferInsert;

export const workoutVideos = mysqlTable("workout_videos", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  videoUrl: varchar("videoUrl", { length: 1000 }).notNull(), // YouTube/Vimeo
  category: varchar("category", { length: 100 }).notNull(), // e.g. "Upper Body", "Cardio"
  intervalsJson: text("intervalsJson"), // JSON string of [{ startTime, endTime, title, description }]
  order: int("order").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WorkoutVideo = typeof workoutVideos.$inferSelect;
export type InsertWorkoutVideo = typeof workoutVideos.$inferInsert;

// --- DUMMY EXPORTS TO BYPASS STATIC WEBPACK ERRORS FOR LEGACY CRM CODE ---
export const vacationQuotes = mysqlTable("dummy_vq", { id: int("id") });
export const flightDeals = mysqlTable("dummy_fd", { id: int("id") });
export const appIntegrations = mysqlTable("dummy_ai", { id: int("id") });
export const trips = mysqlTable("dummy_trips", { id: int("id") });
export const tripItineraryItems = mysqlTable("dummy_tii", { id: int("id") });
export const systemSettings = mysqlTable("dummy_ss", { id: int("id") });
export const tags = mysqlTable("dummy_tags", { id: int("id") });
export const userTags = mysqlTable("dummy_ut", { id: int("id") });
export const reviews = mysqlTable("dummy_reviews", { id: int("id") });
export const reviewInvites = mysqlTable("dummy_ri", { id: int("id") });
export const clientLeads = mysqlTable("dummy_cl", { id: int("id") });

