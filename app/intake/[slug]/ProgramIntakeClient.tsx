"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { ProgramIntakeForm } from "@/components/program-intake/ProgramIntakeForm";
import { BRAND } from "@shared/brand";
import { PROGRAMS, type ProgramId } from "@shared/programs";

export default function ProgramIntakeClient({ program }: { program: ProgramId }) {
  const label = PROGRAMS[program].label;
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        <p className="text-xs font-bold tracking-[0.16em]" style={{ color: "oklch(0.46 0.08 75)" }}>
          {label.toUpperCase()}
        </p>
        <h1
          className="mt-2 text-4xl leading-tight md:text-5xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          A few details before you start
        </h1>
        <p className="mt-3 text-base" style={{ color: "oklch(0.42 0.015 50)" }}>
          For {BRAND.coachFullName}. This signs you up for {label}.
        </p>
        <div className="mt-8 rounded-3xl px-5 py-7 sm:px-8" style={{ background: "oklch(1 0 0)" }}>
          <ProgramIntakeForm program={program} />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
