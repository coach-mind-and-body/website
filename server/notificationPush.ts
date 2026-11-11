import { eq } from "drizzle-orm";
import { CLIENT_INTAKE_ADMIN_PATH } from "@shared/clientIntake";
import { enrollments, moduleProgress } from "../drizzle/schema";
import { apnsConfigFromEnv, sendApnsAlerts, type ApnsConfig, type ApnsData, type ApnsSendResult } from "./apns";
import { deleteDeviceTokens, tokensForAdmins, tokensForUser } from "./apnsDevices";
import { getDb } from "./db";
import {
  NOTIFICATION_CATEGORY,
  formAssignedAlert,
  formPushRecipients,
  intakeAlert,
} from "./notificationCategories";

type SendFn = (input: {
  config: ApnsConfig | null;
  tokens: string[];
  alert: { title: string; body: string };
  data: ApnsData;
}) => Promise<ApnsSendResult>;

export function intakePushData(): ApnsData {
  return {
    tab: "admin",
    url: CLIENT_INTAKE_ADMIN_PATH,
    category: NOTIFICATION_CATEGORY.coachIntake,
  };
}

export function formPushData(formId: number): ApnsData {
  return {
    tab: "form",
    url: "/habit-tracker",
    category: NOTIFICATION_CATEGORY.homeworkForm,
    formId,
    mutableContent: true,
  };
}

async function pushAndForget(
  send: SendFn,
  config: ApnsConfig | null,
  tokens: string[],
  alert: { title: string; body: string },
  data: ApnsData,
  forget: (tokens: string[]) => Promise<void>
) {
  const result = await send({ config, tokens, alert, data });
  if (result.removed.length) await forget(result.removed);
}

/** Lee Anne's iPhone, same admin device tokens as a new client message. Email still sends on its own. */
export async function notifyAdminsOfIntake(
  input: { name: string },
  io?: {
    tokens?: () => Promise<string[]>;
    send?: SendFn;
    forgetTokens?: (tokens: string[]) => Promise<void>;
    config?: ApnsConfig | null;
  }
): Promise<void> {
  const config = io && "config" in io ? (io.config ?? null) : apnsConfigFromEnv();
  try {
    const tokens = await (io?.tokens ?? tokensForAdmins)();
    await pushAndForget(
      io?.send ?? sendApnsAlerts,
      config,
      tokens,
      intakeAlert(input.name),
      intakePushData(),
      io?.forgetTokens ?? deleteDeviceTokens
    );
  } catch (err) {
    console.error("[APNs] intake notify failed:", err instanceof Error ? err.message : "error");
  }
}

export async function notifyClientsOfForm(
  input: { formId: number; title: string; userIds: number[] },
  io?: {
    tokensForUser?: (userId: number) => Promise<string[]>;
    send?: SendFn;
    forgetTokens?: (tokens: string[]) => Promise<void>;
    config?: ApnsConfig | null;
  }
): Promise<void> {
  const config = io && "config" in io ? (io.config ?? null) : apnsConfigFromEnv();
  const alert = formAssignedAlert(input.title);
  const data = formPushData(input.formId);
  const userIds = [...new Set(input.userIds)];
  for (const userId of userIds) {
    try {
      const tokens = await (io?.tokensForUser ?? tokensForUser)(userId);
      await pushAndForget(
        io?.send ?? sendApnsAlerts,
        config,
        tokens,
        alert,
        data,
        io?.forgetTokens ?? deleteDeviceTokens
      );
    } catch (err) {
      console.error("[APNs] form notify failed:", err instanceof Error ? err.message : "error");
    }
  }
}

/** After a form is published. Failures stay in the log so publishing still succeeds. */
export async function notifyPublishedForm(input: {
  formId: number;
  title: string;
  moduleId: number | null;
  programTags: readonly string[];
  listed: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const enrollmentRows = await db
    .select({ userId: enrollments.userId, program: enrollments.program, status: enrollments.status })
    .from(enrollments);
  const unlockRows =
    input.moduleId == null
      ? []
      : await db
          .select({ userId: moduleProgress.userId, moduleId: moduleProgress.moduleId })
          .from(moduleProgress)
          .where(eq(moduleProgress.moduleId, input.moduleId));
  const userIds = formPushRecipients({
    moduleId: input.moduleId,
    programTags: input.programTags,
    listed: input.listed,
    enrollments: enrollmentRows,
    unlocks: unlockRows,
  });
  if (!userIds.length) return;
  await notifyClientsOfForm({ formId: input.formId, title: input.title, userIds });
}
