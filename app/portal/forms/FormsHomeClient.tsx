"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getLoginUrl } from "@/lib/const";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";

const STATUS: Record<string, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  reviewed: "Reviewed",
};

export default function FormsHomeClient() {
  const { loading, isAuthenticated } = useAuth();
  const forms = trpc.forms.listMine.useQuery(undefined, { enabled: isAuthenticated });
  const library = trpc.forms.myLibrary.useQuery(undefined, { enabled: isAuthenticated });

  useEffect(() => {
    if (!loading && !isAuthenticated) window.location.href = getLoginUrl();
  }, [loading, isAuthenticated]);

  return (
    <main className="min-h-screen px-4 py-6" style={{ background: "#faf5f5" }}>
      <div className="mx-auto max-w-lg">
        <Link href="/portal" className="text-sm font-bold" style={{ color: "#c9a96e" }}>← Portal</Link>
        <h1 className="mt-3 text-4xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
          Worksheets
        </h1>
        <p className="mt-2 text-base" style={{ color: "#5a6b5a" }}>
          Forms and pages for the programs you are enrolled in with {BRAND.coachName}.
        </p>
        <div className="mt-6 space-y-3">
          {(forms.data ?? []).map((form) => (
            <Link key={form.id} href={`/portal/forms/${form.id}`} className="block rounded-2xl bg-white p-4" style={{ border: "1px solid #f0e8e4" }}>
              <p className="text-lg font-semibold" style={{ color: "#2d3b2d" }}>{form.title}</p>
              <p className="mt-1 text-sm font-bold" style={{ color: "#c9a96e" }}>
                {form.kind === "handout" ? "Read" : STATUS[form.status] ?? form.status}
              </p>
            </Link>
          ))}
          {(library.data ?? []).map((item) => (
            <Link key={item.id} href={`/portal/library/${item.kind}/${item.refId}`} className="block rounded-2xl bg-white p-4" style={{ border: "1px solid #f0e8e4" }}>
              <p className="text-lg font-semibold" style={{ color: "#2d3b2d" }}>{item.title}</p>
              <p className="mt-1 text-sm" style={{ color: "#8a9a8a" }}>
                {item.pages.length} {item.pages.length === 1 ? "page" : "pages"} · swipe to read
              </p>
            </Link>
          ))}
          {forms.data && library.data && forms.data.length === 0 && library.data.length === 0 ? (
            <p className="text-base" style={{ color: "#8a9a8a" }}>Nothing is published for your programs yet.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
