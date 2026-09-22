import { getOrCreateWeek, patchWeek, weekBoard } from "./db";
import { emailConfigured, notifyMember, rsvpReminderCopy, smsConfigured } from "./reminders";
import { memberUrl } from "./url";
import { isoNow } from "./week";

export async function cronTick() {
  const week = await getOrCreateWeek();
  const board = await weekBoard(week);
  const now = new Date();
  const denver = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    weekday: "short",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = denver.find((p) => p.type === "weekday")?.value;
  const hour = Number(denver.find((p) => p.type === "hour")?.value ?? 0);

  const did: string[] = [];
  if (week.status === "open" && weekday === "Sun" && hour >= 17 && !week.reminderSentAt) {
    const targets = board.pending.filter((m) => m.email || m.phone);
    for (const member of targets) {
      const link = await memberUrl(member.token);
      await notifyMember(member, await rsvpReminderCopy(member, link));
    }
    await patchWeek(week.id, { reminderSentAt: isoNow() });
    did.push("sunday-reminder");
  }

  if (week.status === "open" && weekday === "Tue" && hour >= 9 && !week.nudgeSentAt) {
    const targets = board.pending.filter((m) => m.email || m.phone);
    for (const member of targets) {
      const link = await memberUrl(member.token);
      await notifyMember(member, await rsvpReminderCopy(member, link));
    }
    await patchWeek(week.id, { nudgeSentAt: isoNow() });
    did.push("tuesday-nudge");
  }

  return { ok: true, did, email: emailConfigured(), sms: smsConfigured() };
}
