"use client";

import SiteFooter from "@/components/SiteFooter";
import SiteNav from "@/components/SiteNav";
import { ClientIntakeForm } from "@/components/client-intake/ClientIntakeForm";
import { ClientIntakeShareBox } from "@/components/client-intake/ClientIntakeShareBox";
import { useAuth } from "@/hooks/use-auth";
import { INTAKE } from "@shared/clientIntake";
import { BRAND } from "@shared/brand";

export default function ClientIntakePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <SiteNav />
      <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        {isAdmin && (
          <div className="mb-8">
            <ClientIntakeShareBox />
          </div>
        )}
        <p
          className="text-xs font-bold tracking-[0.16em]"
          style={{ color: "oklch(0.46 0.08 75)" }}
        >
          {INTAKE.eyebrow}
        </p>
        <h1
          className="mt-2 text-4xl leading-tight md:text-5xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          {INTAKE.title}
        </h1>
        <p className="mt-3 text-base" style={{ color: "oklch(0.42 0.015 50)" }}>
          For {BRAND.coachFullName}. She reads this before your session.
        </p>
        <div className="mt-8 rounded-3xl px-5 py-7 sm:px-8" style={{ background: "oklch(1 0 0)" }}>
          <ClientIntakeForm mode="public" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
