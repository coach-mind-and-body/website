"use client";

import { useState } from "react";
import { claimIdentity } from "@/app/this-week/actions";

type Person = { id: number; name: string };

export function FindYourself({ people }: { people: Person[] }) {
  const [picked, setPicked] = useState<Person | null>(null);

  if (picked) {
    return (
      <div className="card">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
          Confirm
        </p>
        <p className="mt-2 font-display text-3xl leading-tight">Are you {picked.name}?</p>
        <p className="mt-2 text-sm text-stone-600">
          Only continue if that&apos;s you. This device will remember, and only you can mark
          in or out from here.
        </p>
        <form action={claimIdentity} className="mt-5">
          <input type="hidden" name="memberId" value={picked.id} />
          <button className="btn-primary w-full" type="submit">
            Yes, I&apos;m {picked.name}
          </button>
        </form>
        <button
          type="button"
          className="mt-3 w-full text-sm text-stone-500 underline"
          onClick={() => setPicked(null)}
        >
          No, go back
        </button>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
        Tap your name
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              className="flex min-h-14 w-full items-center rounded-2xl border border-stone-200 bg-white px-3 text-left font-medium hover:border-[#2d3b2d]/40"
              onClick={() => setPicked(person)}
            >
              {person.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
