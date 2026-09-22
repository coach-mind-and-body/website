import { switchPerson } from "@/app/this-week/actions";
import { FindYourself } from "@/components/weekly-pairs/FindYourself";
import { PairBoard } from "@/components/weekly-pairs/PairBoard";
import { RsvpButtons } from "@/components/weekly-pairs/RsvpButtons";
import { WeekRoster } from "@/components/weekly-pairs/WeekRoster";
import { getMemberToken } from "@/lib/weekly-pairs/auth";
import { APP_NAME } from "@/lib/weekly-pairs/config";
import { activeMembers, getOrCreateWeek, memberByToken, weekBoard } from "@/lib/weekly-pairs/db";
import { weekRangeLabel } from "@/lib/weekly-pairs/week";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = await getMemberToken();
  const you = token ? await memberByToken(token) : null;
  const signedIn = Boolean(you?.active);

  const week = await getOrCreateWeek();
  const roster = await activeMembers();
  const board = await weekBoard(week, roster);
  const matched = week.status === "matched" && board.groups.length > 0;
  const mine = signedIn ? board.people.find((p) => p.id === you!.id) : null;
  const current = mine?.rsvp?.status ?? null;

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-5 pb-16 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
        {APP_NAME}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight">
        {matched ? "This week's pairs" : "Who's in this week?"}
      </h1>
      <p className="mt-2 text-stone-600">{weekRangeLabel(week.weekStart)}</p>

      {signedIn ? (
        <div className="card mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Hi, {you!.name}
          </p>
          <p className="mt-2 font-display text-3xl leading-tight">
            {current === "in"
              ? "You're in this week."
              : current === "out"
                ? "You're out this week."
                : "Are you in this week?"}
          </p>
          <p className="mt-2 text-sm text-stone-600">
            {matched
              ? "Pairs are below. You can still change in or out — Lee Anne may rematch."
              : "Check in, then you'll see everyone else's in/out on this same page."}
          </p>
          <div className="mt-5">
            <RsvpButtons token={you!.token} current={current} />
          </div>
        </div>
      ) : (
        <div className="mt-6">
          <FindYourself people={roster.map((p) => ({ id: p.id, name: p.name }))} />
        </div>
      )}

      {matched ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Everyone
          </h2>
          <PairBoard groups={board.groups} roster={roster} youId={you?.id ?? null} />
          <p className="mt-5 text-sm text-stone-500">
            Text your person to pick a time. That part stays in the group thread.
          </p>
        </div>
      ) : null}

      <WeekRoster
        inThisWeek={board.inThisWeek}
        outThisWeek={board.outThisWeek}
        pending={board.pending}
      />

      {signedIn ? (
        <form action={switchPerson} className="mt-10 text-center">
          <button type="submit" className="text-sm text-stone-500 underline">
            Not {you!.name}? Switch person
          </button>
        </form>
      ) : null}
    </div>
  );
}
