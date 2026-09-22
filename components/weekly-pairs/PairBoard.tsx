import { andList } from "@/lib/weekly-pairs/format";
import type { PairGroup } from "@/lib/weekly-pairs/match";
import type { Member } from "@/lib/weekly-pairs/schema";

export function PairBoard({
  groups,
  roster,
  youId,
}: {
  groups: PairGroup[];
  roster: Member[];
  youId?: number | null;
}) {
  const byId = new Map(roster.map((m) => [m.id, m]));
  if (groups.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-4 py-6 text-center text-stone-600">
        Pairs will show up here once matching runs.
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {groups.map((group, i) => {
        const people = group.memberIds
          .map((id) => byId.get(id))
          .filter((m): m is Member => Boolean(m));
        const names = people.map((p) => p.name);
        const mine = youId != null && group.memberIds.includes(youId);
        const partners = people.filter((p) => p.id !== youId).map((p) => p.name);
        return (
          <li
            key={`${i}-${group.memberIds.join("-")}`}
            className={`rounded-3xl border px-5 py-4 ${
              mine
                ? "border-[#2d3b2d] bg-[#2d3b2d] text-[#fcfaf9] shadow-lg"
                : "border-stone-200 bg-white text-[#2d3b2d]"
            }`}
          >
            {mine ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fcfaf9]/70">
                  You this week
                </p>
                <p className="mt-1 font-display text-2xl leading-tight">
                  {andList(["You", ...partners])}
                </p>
                <p className="mt-2 text-sm text-[#fcfaf9]/80">
                  Text {partners.length > 1 ? "them" : partners[0] ?? "them"} to pick
                  a time. This page doesn&apos;t schedule the meeting.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2d3b2d]/70">
                  {people.length === 3 ? "Trio" : "Pair"} {i + 1}
                </p>
                <p className="mt-1 font-display text-2xl leading-tight">{andList(names)}</p>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
