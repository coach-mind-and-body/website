import { redirect } from "next/navigation";
import { switchPerson } from "@/app/this-week/actions";
import { PairBoard } from "@/components/weekly-pairs/PairBoard";
import { RsvpButtons } from "@/components/weekly-pairs/RsvpButtons";
import { getMemberToken } from "@/lib/weekly-pairs/auth";
import { APP_NAME } from "@/lib/weekly-pairs/config";
import { activeMembers, getOrCreateWeek, memberByToken, weekBoard } from "@/lib/weekly-pairs/db";
import { andList } from "@/lib/weekly-pairs/format";
import { weekRangeLabel } from "@/lib/weekly-pairs/week";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const token = await getMemberToken();
  if (!token) redirect("/this-week");
  const you = await memberByToken(token);
  if (!you || !you.active) redirect("/this-week");

  const week = await getOrCreateWeek();
  const roster = await activeMembers();
  const board = await weekBoard(week, roster);
  const mine = board.people.find((p) => p.id === you.id);
  const current = mine?.rsvp?.status ?? null;
  const myGroup = board.groups.find((g) => g.memberIds.includes(you.id));
  const partners = (myGroup?.memberIds ?? [])
    .map((id) => roster.find((m) => m.id === id))
    .filter((m) => m && m.id !== you.id)
    .map((m) => m!.name);
  const othersIn = board.inThisWeek.filter((p) => p.id !== you.id).map((p) => p.name);

  const matched = week.status === "matched" && board.groups.length > 0;
  let headline = "Are you in this week?";
  let detail = "Check in here. When everyone who's coaching has answered, names get shuffled into random pairs.";
  if (current === "out") {
    headline = "You're out this week.";
    detail = "You won't be in the shuffle. You can change this if you become available.";
  } else if (matched && myGroup) {
    headline = `You're with ${andList(partners)}.`;
    detail = "Text them to pick a time. That's the only part that stays in the group thread.";
  } else if (matched && current === "in") {
    headline = "You're in, but you missed this shuffle.";
    detail = "Ask for a rematch if you should be included.";
  } else if (current === "in") {
    headline = "You're in this week.";
    detail =
      othersIn.length > 0
        ? `${board.inThisWeek.length} people in so far, including you. You'll get a random partner when matching runs — not first-come.`
        : "You're the first one in. You'll get a random partner once others check in and matching runs.";
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-5 pb-16 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
        {APP_NAME}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-tight">Hi, {you.name}.</h1>
      <p className="mt-2 text-stone-600">{weekRangeLabel(week.weekStart)}</p>

      <div className="card mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          This week
        </p>
        <p className="mt-2 font-display text-3xl leading-tight">{headline}</p>
        <p className="mt-2 text-sm text-stone-600">{detail}</p>
        <div className="mt-5">
          <RsvpButtons token={you.token} current={current} />
        </div>
      </div>

      {matched ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Everyone
          </h2>
          <PairBoard groups={board.groups} roster={roster} youId={you.id} />
        </div>
      ) : current === "in" && othersIn.length > 0 ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Also in
          </h2>
          <ul className="flex flex-wrap gap-2">
            {othersIn.map((name) => (
              <li key={name} className="rounded-full bg-white px-3 py-1.5 text-sm">
                {name}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form action={switchPerson} className="mt-10 text-center">
        <button type="submit" className="text-sm text-stone-500 underline">
          Not {you.name}? Switch person
        </button>
      </form>
    </div>
  );
}
