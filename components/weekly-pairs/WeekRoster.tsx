import type { MemberRsvp } from "@/lib/weekly-pairs/db";

function Column({
  label,
  people,
  empty,
}: {
  label: string;
  people: MemberRsvp[];
  empty: string;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
        {label} · {people.length}
      </p>
      {people.length === 0 ? (
        <p className="text-sm text-stone-400">{empty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {people.map((p) => (
            <li key={p.id} className="rounded-full bg-white px-3 py-1.5 text-sm">
              {p.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeekRoster({
  inThisWeek,
  outThisWeek,
  pending,
  inLabel = "In this week",
  outLabel = "Out this week",
}: {
  inThisWeek: MemberRsvp[];
  outThisWeek: MemberRsvp[];
  pending: MemberRsvp[];
  inLabel?: string;
  outLabel?: string;
}) {
  return (
    <div className="mt-8 space-y-6">
      <Column label={inLabel} people={inThisWeek} empty="Nobody has checked in yet." />
      <Column label={outLabel} people={outThisWeek} empty="Nobody has marked out." />
      <Column label="Still to check in" people={pending} empty="Everyone has answered." />
    </div>
  );
}
