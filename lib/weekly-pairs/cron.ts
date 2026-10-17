import { getOrCreateWeek, patchWeek, weekBoard } from "./db";
import { emailConfigured, notifyMember, rsvpReminderCopy, smsConfigured } from "./reminders";
import { memberUrl } from "./url";
import { currentPeriodStart, denverYmd, isoNow, periodEnd } from "./week";

let remindedFor: string | null = null;

/** Sunday at 5pm Denver, on the last day of the round. One send, then nothing until the next round. */
export function isPairsReminderWindow(now = new Date()) {
  const denver = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = denver.find((p) => p.type === "weekday")?.value;
  const hour = Number(denver.find((p) => p.type === "hour")?.value ?? 0);
  if (weekday !== "Sun" || hour < 17) return false;
  return denverYmd(now) === periodEnd(currentPeriodStart(now));
}

export async function cronTick(now = new Date()) {
  const quiet = { ok: true, did: [] as string[], email: emailConfigured(), sms: smsConfigured() };
  if (!isPairsReminderWindow(now)) return quiet;
  if (!quiet.email && !quiet.sms) return quiet;

  const start = currentPeriodStart(now);
  if (remindedFor === start) return quiet;

  const week = await getOrCreateWeek(start);
  if (week.status !== "open" || week.reminderSentAt) {
    remindedFor = start;
    return quiet;
  }

  const board = await weekBoard(week);
  await patchWeek(week.id, { reminderSentAt: isoNow() });
  remindedFor = start;
  const targets = board.pending.filter((m) => m.email || m.phone);
  for (const member of targets) {
    const link = await memberUrl(member.token);
    await notifyMember(member, await rsvpReminderCopy(member, link, week.weekStart));
  }
  return { ok: true, did: ["sunday-reminder"], email: quiet.email, sms: quiet.sms };
}
