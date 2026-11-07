"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ClientIntakeForm } from "@/components/client-intake/ClientIntakeForm";
import { ClientIntakeShareBox } from "@/components/client-intake/ClientIntakeShareBox";
import { formatPhoneDisplay } from "@/lib/phone";
import { clientIntakeAnswerLines, formatClientIntakeText, type MenopauseStatus } from "@shared/clientIntake";

export function AdminClientIntakeTab() {
  const [showForm, setShowForm] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const { data: intakes, isLoading, error, refetch } = trpc.clientIntake.list.useQuery();
  const remove = trpc.clientIntake.remove.useMutation({
    onSuccess: () => {
      toast.success("Intake removed");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  async function copyAnswers(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Answers copied");
    } catch {
      toast.error("Couldn't copy the answers.");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className="mb-2 text-2xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Client intakes
          </h2>
          <p className="max-w-xl text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            Send the link before a session, or fill the same questions out here while you are with a client.
            A finished form from the link also lands in your email.
          </p>
        </div>
        <div className="rounded-xl px-5 py-4 text-center" style={{ background: "oklch(1 0 0)", minWidth: "140px" }}>
          <div
            className="text-3xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            {isLoading ? "…" : (intakes?.length ?? 0)}
          </div>
          <div className="mt-1 text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
            Saved intakes
          </div>
        </div>
      </div>

      <div className="mb-6">
        <ClientIntakeShareBox />
      </div>

      <div className="mb-8">
        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          className="rounded-full px-5 py-2.5 text-sm font-bold"
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          {showForm ? "Close the form" : "Fill out an intake here"}
        </button>
        {showForm && (
          <div className="mt-4 rounded-2xl p-5 sm:p-7" style={{ background: "oklch(1 0 0)" }}>
            <ClientIntakeForm
              mode="portal"
              onSaved={() => {
                toast.success("Intake saved");
                setShowForm(false);
                refetch();
              }}
            />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-sm" style={{ color: "oklch(0.45 0.14 25)" }}>
          {error.message}
        </p>
      ) : isLoading ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Loading intakes…
        </p>
      ) : intakes && intakes.length > 0 ? (
        <div className="space-y-3">
          {intakes.map((intake) => {
            const answers = {
              ...intake,
              menopause: intake.menopause as MenopauseStatus,
              phone: formatPhoneDisplay(intake.phone),
            };
            const lines = clientIntakeAnswerLines(answers);
            const open = openId === intake.id;
            const when = new Date(intake.createdAt).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "America/Denver",
            });
            return (
              <article key={intake.id} className="rounded-xl p-4" style={{ background: "oklch(1 0 0)" }}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {intake.name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                      <a href={`mailto:${intake.email}`} className="underline" style={{ color: "oklch(0.55 0.1 75)" }}>
                        {intake.email}
                      </a>
                      <a href={`tel:${intake.phone}`}>{formatPhoneDisplay(intake.phone)}</a>
                      <span>{when} MT</span>
                      <span>{intake.source === "portal" ? "Entered here" : "From the link"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : intake.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.35 0.04 50)" }}
                    >
                      {open ? "Hide answers" : "Read answers"}
                    </button>
                    <button
                      type="button"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (confirm(`Remove ${intake.name}'s intake? This cannot be undone.`)) {
                          remove.mutate({ id: intake.id });
                        }
                      }}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold"
                      style={{ background: "oklch(0.95 0.06 10)", color: "oklch(0.45 0.12 10)" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="mt-4 border-t pt-4" style={{ borderColor: "oklch(0.93 0.015 80)" }}>
                    <button
                      type="button"
                      onClick={() => void copyAnswers(formatClientIntakeText(answers))}
                      className="mb-4 text-xs font-semibold underline"
                      style={{ color: "oklch(0.55 0.1 75)" }}
                    >
                      Copy answers
                    </button>
                    <dl className="space-y-4">
                      {lines.map((line) => (
                        <div key={line.label}>
                          <dt className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                            {line.label}
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold" style={{ color: "oklch(0.22 0.015 50)" }}>
                            {line.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No intakes yet. Send the link, or fill one out while you are with a client.
        </p>
      )}
    </div>
  );
}
