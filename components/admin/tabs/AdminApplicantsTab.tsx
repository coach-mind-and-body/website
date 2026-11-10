"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdminClientWorkspace } from "../AdminClientWorkspace";

type AdminApplicantsTabProps = {
  onEnroll: (person?: { name: string; email: string; phone?: string | null; applicationId: number }) => void;
};

export function AdminApplicantsTab({ onEnroll }: AdminApplicantsTabProps) {
  const { data, isLoading } = trpc.enrollment.adminListHolidayApplications.useQuery();
  const [openEmail, setOpenEmail] = useState<string | null>(null);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h2
            className="font-bold text-2xl"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Metabolic Coaching applicants
          </h2>
          <p className="text-sm mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
            People who applied on the holiday page. Accept opens the same enroll window, with Metabolic Coaching
            already checked. You can add other programs before you confirm.
          </p>
        </div>
          <button
            type="button"
            onClick={() => onEnroll()}
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          Enroll someone
        </button>
      </div>

      {isLoading && (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Loading applications…
        </p>
      )}

      {!isLoading && (data ?? []).length === 0 && (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No applications yet. They show up here when someone applies on the holiday page.
        </p>
      )}

      <div className="space-y-3">
        {(data ?? []).map((application) => {
          const accepted = application.status === "accepted";
          return (
            <article
              key={application.id}
              className="p-4 rounded-xl"
              style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {application.fullName}
                    </h3>
                    <span
                      className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: accepted ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
                        color: accepted ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
                      }}
                    >
                      {accepted ? "Enrolled" : "Waiting"}
                    </span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {application.email} · {application.phone} ·{" "}
                    {new Date(application.createdAt).toLocaleDateString("en-US", { timeZone: "America/Denver" })}
                  </p>
                  {application.flags.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {application.flags.map((flag) => (
                        <li key={flag} className="text-xs" style={{ color: "oklch(0.45 0.12 50)" }}>
                          Worth a look: {flag}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-sm mt-3" style={{ color: "oklch(0.30 0.015 50)" }}>
                    {application.whyCoaching}
                  </p>
                  <p className="text-sm mt-2" style={{ color: "oklch(0.42 0.015 50)" }}>
                    Hopes: {application.hopes}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setOpenEmail(application.email)}
                    className="text-sm font-semibold px-4 py-2 rounded-lg"
                    style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.30 0.015 50)", border: "1px solid oklch(0.90 0.015 80)" }}
                  >
                    Their program
                  </button>
                  {!accepted && (
                  <button
                    type="button"
                    onClick={() =>
                      onEnroll({
                        name: application.fullName,
                        email: application.email,
                        phone: application.phone,
                        applicationId: application.id,
                      })
                    }
                    className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg"
                    style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                  >
                    Accept
                  </button>
                )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog open={!!openEmail} onOpenChange={(open) => !open && setOpenEmail(null)}>
        <DialogContent
          aria-describedby={undefined}
          className="w-[96vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto"
          style={{ background: "oklch(0.96 0.025 50)" }}
        >
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Cormorant Garamond', serif" }}>Their program</DialogTitle>
          </DialogHeader>
          {openEmail && <AdminClientWorkspace email={openEmail} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
