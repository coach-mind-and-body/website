import {
  addMember,
  adminLogout,
  matchThisWeek,
  removeMember,
  reopenWeek,
  sendCheckInReminders,
  sendMatchNotices,
  updateMember,
} from "@/app/this-week/actions";
import { ConfirmSubmit } from "@/components/weekly-pairs/ConfirmSubmit";
import { CopyButton } from "@/components/weekly-pairs/CopyButton";
import { PairBoard } from "@/components/weekly-pairs/PairBoard";
import { WeekCheckIn } from "@/components/weekly-pairs/WeekCheckIn";
import { APP_NAME } from "@/lib/weekly-pairs/config";
import { allMembers, getOrCreateWeek, recentWeeks, weekBoard } from "@/lib/weekly-pairs/db";
import { andList } from "@/lib/weekly-pairs/format";
import { checkInGroupText, emailConfigured, matchedGroupText, smsConfigured } from "@/lib/weekly-pairs/reminders";
import type { Member } from "@/lib/weekly-pairs/schema";
import { appUrl, memberUrl } from "@/lib/weekly-pairs/url";
import { weekRangeLabel } from "@/lib/weekly-pairs/week";

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const week = await getOrCreateWeek();
  const roster = await allMembers();
  const active = roster.filter((m) => m.active);
  const board = await weekBoard(week, active);
  const history = await recentWeeks(8);
  const checkInText = await checkInGroupText();
  const matchedText = await matchedGroupText();
  const site = await appUrl();
  const stale =
    week.status === "matched" &&
    week.matchedAt &&
    board.people.some((p) => p.rsvp && p.rsvp.respondedAt > week.matchedAt!);

  const links = await Promise.all(
    active.map(async (m) => ({ name: m.name, url: await memberUrl(m.token) }))
  );
  const linkDump = links.map((l) => `${l.name}\t${l.url}`).join("\n");

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-5 pb-20 pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
            {APP_NAME} · admin
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight">This week</h1>
          <p className="mt-1 text-stone-600">{weekRangeLabel(week.weekStart)}</p>
        </div>
        <form action={adminLogout}>
          <button className="text-sm text-stone-500 underline" type="submit">
            Log out
          </button>
        </form>
      </div>

      {notice ? (
        <p className="mt-4 rounded-2xl bg-teal-800 px-4 py-3 text-sm text-cream">{notice}</p>
      ) : null}

      {stale ? (
        <p className="mt-4 rounded-2xl bg-terracotta/15 px-4 py-3 text-sm text-terracotta">
          Someone changed their RSVP after matching. Rematch if the pairs should move.
        </p>
      ) : null}

      <section className="mt-6 grid grid-cols-3 gap-2 text-center">
        <Stat label="In" value={board.inThisWeek.length} />
        <Stat label="Out" value={board.outThisWeek.length} />
        <Stat label="Waiting" value={board.pending.length} />
      </section>

      <section className="card mt-6 space-y-4">
        <h2 className="font-display text-2xl">Who&apos;s in</h2>
        <p className="text-sm text-stone-600">
          People check themselves in. When you hit match, everyone marked in is shuffled
          into random pairs — not first-come. Odd count gets one trio.
        </p>
        <MatchButtons matched={week.status === "matched"} />
        <WeekCheckIn people={board.people} />
        <MatchButtons matched={week.status === "matched"} />
        {week.status === "matched" ? (
          <PairBoard groups={board.groups} roster={active} />
        ) : null}
      </section>

      <section className="card mt-6 space-y-4">
        <h2 className="font-display text-2xl">Reminders</h2>
        <p className="text-sm text-stone-600">
          The group link is the check-in. Copy that into the thread so people mark
          themselves in. Times still get decided in the thread after pairs are up.
        </p>
        <p className="text-xs text-stone-500">
          Email {emailConfigured() ? "is on" : "needs RESEND_API_KEY + RESEND_FROM"}. SMS{" "}
          {smsConfigured() ? "is on" : "is optional (Twilio)."}.
        </p>
        <div className="flex flex-wrap gap-2">
          <CopyButton className="btn-secondary" text={checkInText} label="Copy check-in text" />
          <CopyButton className="btn-secondary" text={matchedText} label="Copy pairs text" />
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={sendCheckInReminders}>
            <button className="btn-primary" type="submit">
              Remind people still waiting
            </button>
          </form>
          <form action={sendMatchNotices}>
            <button className="btn-secondary" type="submit">
              Email/text this week&apos;s pairs
            </button>
          </form>
        </div>
        <p className="text-xs text-stone-500">
          Sunday evening and Tuesday morning reminders also run if you point a hourly cron at{" "}
          <code className="rounded bg-stone-100 px-1">/api/cron/remind</code>.
        </p>
        <p className="text-xs text-stone-500">
          Share URL: <span className="break-all font-medium text-ink">{site}</span>
        </p>
      </section>

      <section className="card mt-6 space-y-4">
        <h2 className="font-display text-2xl">Roster</h2>
        <p className="text-sm text-stone-600">
          {active.length} active · {roster.length} total. Add the missing person here.
        </p>
        <form id="add-person" action={addMember} className="grid gap-2 sm:grid-cols-4">
          <input className="field sm:col-span-1" name="name" placeholder="Name" required />
          <input className="field sm:col-span-1" name="email" type="email" placeholder="Email" />
          <input className="field sm:col-span-1" name="phone" placeholder="Phone" />
          <button className="btn-primary" type="submit">
            Add
          </button>
        </form>
        <ul className="divide-y divide-stone-200">
          {roster.map((member) => (
            <li key={member.id} className="py-4">
              <MemberRow member={member} />
            </li>
          ))}
        </ul>
        <div>
          <p className="mb-2 text-sm font-medium">Personal links</p>
          <CopyButton className="btn-secondary mb-3" text={linkDump} label="Copy all links" />
          <ul className="space-y-1 text-sm">
            {links.map((l) => (
              <li key={l.url} className="flex items-center justify-between gap-3">
                <span className="shrink-0 font-medium">{l.name}</span>
                <span className="truncate text-stone-500">{l.url}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-2xl">Past weeks</h2>
        <ul className="mt-3 space-y-3">
          {history.map((w) => {
            if (w.id === week.id) return null;
            const groups = w.groupsJson ? JSON.parse(w.groupsJson) as { memberIds: number[] }[] : [];
            return (
              <li key={w.id} className="rounded-2xl bg-white px-4 py-3 text-sm">
                <div className="font-medium">{weekRangeLabel(w.weekStart)}</div>
                <div className="text-stone-500">
                  {w.status === "matched"
                    ? groups
                        .map((g) =>
                          andList(
                            g.memberIds
                              .map((id) => roster.find((m) => m.id === id)?.name)
                              .filter((n): n is string => Boolean(n))
                          )
                        )
                        .join(" · ")
                    : "Never matched"}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function MatchButtons({ matched }: { matched: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <form action={matchThisWeek}>
        <button className="btn-primary" type="submit">
          {matched ? "Rematch" : "Match this week"}
        </button>
      </form>
      {matched ? (
        <form action={reopenWeek}>
          <button className="btn-secondary" type="submit">
            Clear pairs
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3">
      <div className="font-display text-2xl">{value}</div>
      <div className="text-xs uppercase tracking-wider text-stone-500">{label}</div>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="space-y-2">
      <form action={updateMember} className="grid gap-2 sm:grid-cols-4">
        <input type="hidden" name="id" value={member.id} />
        <input className="field" name="name" defaultValue={member.name} required />
        <input className="field" name="email" type="email" defaultValue={member.email ?? ""} placeholder="Email" />
        <input className="field" name="phone" defaultValue={member.phone ?? ""} placeholder="Phone" />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="active" value="on" defaultChecked={member.active} />
            Active
          </label>
          <button className="btn-secondary h-10 px-3 text-sm" type="submit">
            Save
          </button>
        </div>
      </form>
      <ConfirmSubmit
        action={removeMember}
        hidden={{ id: String(member.id) }}
        label="Remove"
        confirm={`Remove ${member.name}?`}
        className="text-sm text-terracotta underline"
        confirmClassName="text-sm font-semibold text-terracotta underline"
      />
    </div>
  );
}
