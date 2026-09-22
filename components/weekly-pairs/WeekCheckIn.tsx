import { adminSetRsvp } from "@/app/this-week/actions";
import type { MemberRsvp } from "@/lib/weekly-pairs/db";

export function WeekCheckIn({ people }: { people: MemberRsvp[] }) {
  return (
    <ul className="divide-y divide-stone-200">
      {people.map((person) => {
        const status = person.rsvp?.status ?? null;
        return (
          <li key={person.id} className="flex items-center justify-between gap-3 py-2.5">
            <p className="min-w-0 truncate font-medium">{person.name}</p>
            <div className="flex shrink-0 gap-1">
              <RsvpChip memberId={person.id} value="in" current={status} label="In" />
              <RsvpChip memberId={person.id} value="out" current={status} label="Out" />
              {status ? (
                <RsvpChip memberId={person.id} value="clear" current={status} label="Clear" />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RsvpChip({
  memberId,
  value,
  current,
  label,
}: {
  memberId: number;
  value: "in" | "out" | "clear";
  current: "in" | "out" | null;
  label: string;
}) {
  const on =
    (value === "in" && current === "in") || (value === "out" && current === "out");
  return (
    <form action={adminSetRsvp}>
      <input type="hidden" name="memberId" value={memberId} />
      <input type="hidden" name="status" value={value} />
      <button
        type="submit"
        className={`h-8 rounded-full px-2.5 text-sm font-semibold ${
          on
            ? value === "in"
              ? "bg-[#2d3b2d] text-[#fcfaf9]"
              : "bg-[#2d3b2d] text-[#fcfaf9]"
            : "bg-white text-stone-600 ring-1 ring-stone-200"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
