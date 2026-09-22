"use client";

import { useFormStatus } from "react-dom";
import { setRsvp } from "@/app/this-week/actions";

export function RsvpButtons({
  token,
  current,
}: {
  token: string;
  current: "in" | "out" | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <form action={setRsvp}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="status" value="in" />
        <Submit
          active={current === "in"}
          activeClass="bg-[#2d3b2d] text-[#fcfaf9]"
          idleClass="bg-[#2d3b2d]/10 text-[#2d3b2d] ring-1 ring-[#2d3b2d]/20"
        >
          I&apos;m in
        </Submit>
      </form>
      <form action={setRsvp}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="status" value="out" />
        <Submit
          active={current === "out"}
          activeClass="bg-[#2d3b2d] text-[#fcfaf9]"
          idleClass="bg-white text-stone-600 ring-1 ring-stone-200"
        >
          I&apos;m out
        </Submit>
      </form>
    </div>
  );
}

function Submit({
  children,
  active,
  activeClass,
  idleClass,
}: {
  children: React.ReactNode;
  active: boolean;
  activeClass: string;
  idleClass: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-16 w-full rounded-2xl text-lg font-semibold transition disabled:opacity-70 ${
        active ? activeClass : idleClass
      }`}
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
