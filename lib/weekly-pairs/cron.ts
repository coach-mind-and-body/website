import { getOrCreateWeek, patchWeek, weekBoard } from "./db";
import { emailConfigured, notifyMember, rsvpReminderCopy, smsConfigured } from "./reminders";
import { memberUrl } from "./url";
import { addDays, currentPeriodStart, denverYmd, isoNow, periodEnd } from "./week";

export async function cronTick(now = new Date()) {
  const week = await getOrCreateWeek(currentPeriodStart(now));
  const board = await weekBoard(week);
  const denver = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = denver.find((p) => p.type === "weekday")?.value;
  const hour = Number(denver.find((p) => p.type === "hour")?.value ?? 0);
  const today = denverYmd(now);
  const lastDay = today === periodEnd(week.weekStart);
  const firstWeek = today < addDays(week.weekStart, 7);

  const did: string[] = [];
  if (week.status === "open" && weekday === "Sun" && hour >= 17 && lastDay && !week.reminderSentAt) {
    const targets = board.pending.filter((m) => m.email || m.phone);
    for (const member of targets) {
      const link = await memberUrl(member.token);
      await notifyMember(member, await rsvpReminderCopy(member, link, week.weekStart));
    }
    await patchWeek(week.id, { reminderSentAt: isoNow() });
    did.push("sunday-reminder");
  }

  if (week.status === "open" && weekday === "Tue" && hour >= 9 && firstWeek && !week.nudgeSentAt) {
    const targets = board.pending.filter((m) => m.email || m.phone);
    for (const member of targets) {
      const link = await memberUrl(member.token);
      await notifyMember(member, await rsvpReminderCopy(member, link, week.weekStart));
    }
    await patchWeek(week.id, { nudgeSentAt: isoNow() });
    did.push("tuesday-nudge");
  }

  return { ok: true, did, email: emailConfigured(), sms: smsConfigured() };
}
