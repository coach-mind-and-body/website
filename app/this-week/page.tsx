import { redirect } from "next/navigation";
import { FindYourself } from "@/components/weekly-pairs/FindYourself";
import { PairBoard } from "@/components/weekly-pairs/PairBoard";
import { getMemberToken } from "@/lib/weekly-pairs/auth";
import { APP_NAME } from "@/lib/weekly-pairs/config";
import { activeMembers, getOrCreateWeek, memberByToken, weekBoard } from "@/lib/weekly-pairs/db";
import { weekRangeLabel } from "@/lib/weekly-pairs/week";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const token = await getMemberToken();
  if (token) {
    const you = await memberByToken(token);
    if (you?.active) redirect("/this-week/me");
  }

  const week = await getOrCreateWeek();
  const roster = await activeMembers();
  const board = await weekBoard(week, roster);
  const matched = week.status === "matched" && board.groups.length > 0;

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-5 pb-16 pt-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-800">
        {APP_NAME}
      </p>
      <h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-tight">
        {matched ? "This week's pairs" : "Who's in this week?"}
      </h1>
      <p className="mt-2 text-stone-600">{weekRangeLabel(week.weekStart)}</p>

      <div className="mt-6">
        <FindYourself people={roster.map((p) => ({ id: p.id, name: p.name }))} />
      </div>

      {matched ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
            Everyone
          </h2>
          <PairBoard groups={board.groups} roster={roster} />
          <p className="mt-5 text-sm text-stone-500">
            Text your person to pick a time. That part stays in the group thread.
          </p>
        </div>
      ) : (
        <p className="mt-6 text-center text-sm text-stone-500">
          {board.inThisWeek.length} in so far · {board.pending.length} still to check in
        </p>
      )}
    </div>
  );
}
