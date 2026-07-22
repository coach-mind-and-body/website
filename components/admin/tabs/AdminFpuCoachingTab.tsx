"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const FPU_SESSION_LABELS = [
  "Foundation & Financial Clarity",
  "Accountability & Action Plan",
  "Integration & Your Path Forward",
];

export function AdminFpuCoachingTab() {
  const { data: fpuClients, refetch: refetchFpu } = trpc.fpu.adminListCoaching.useQuery();
  const [fpuNotes, setFpuNotes] = useState<Record<number, string>>({});
  const [expandedFpu, setExpandedFpu] = useState<number | null>(null);

  const fpuCompleteSession = trpc.fpu.adminCompleteSession.useMutation({
    onSuccess: () => {
      toast.success("Session marked complete!");
      refetchFpu();
    },
    onError: (e) => toast.error(e.message),
  });

  const fpuUpdateNotes = trpc.fpu.adminUpdateNotes.useMutation({
    onSuccess: () => toast.success("Notes saved!"),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <h2
        className="font-bold text-2xl mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        FPU 1:1 Coaching Clients
      </h2>
      {fpuClients && fpuClients.length > 0 ? (
        <div className="space-y-3">
          {fpuClients.map((client) => {
            const isExpanded = expandedFpu === client.order.id;
            const completedCount = client.sessions.filter((s) => s.completedAt).length;

            return (
              <div key={client.order.id} className="rounded-xl overflow-hidden" style={{ background: "oklch(1 0 0)" }}>
                <button
                  onClick={() => setExpandedFpu(isExpanded ? null : client.order.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {client.order.clientName || "Unknown Client"}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>
                        {client.order.clientEmail}
                      </span>
                      <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {completedCount}/3 sessions complete
                      </span>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp size={18} style={{ color: "oklch(0.52 0.015 50)" }} />
                  ) : (
                    <ChevronDown size={18} style={{ color: "oklch(0.52 0.015 50)" }} />
                  )}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
                    {Array.from({ length: 3 }, (_, i) => {
                      const sessionNum = i + 1;
                      const session = client.sessions.find((s) => s.sessionNumber === sessionNum);
                      if (!session) return null;
                      const isCompleted = !!session.completedAt;

                      return (
                        <div
                          key={session.id}
                          className="p-4 rounded-xl mt-3"
                          style={{ background: "oklch(0.96 0.025 50)", border: "1px solid oklch(0.90 0.015 80)" }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-bold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                                Session {sessionNum}: {FPU_SESSION_LABELS[i]}
                              </p>
                              <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                                {isCompleted
                                  ? `Completed ${new Date(session.completedAt!).toLocaleDateString()}`
                                  : "Not yet completed"}
                              </p>
                            </div>
                            {!isCompleted && (
                              <button
                                onClick={() =>
                                  fpuCompleteSession.mutate({
                                    sessionId: session.id,
                                    notes: fpuNotes[session.id] || session.adminNotes || undefined,
                                  })
                                }
                                disabled={fpuCompleteSession.isPending}
                                className="text-xs px-3 py-1.5 rounded-full font-semibold"
                                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                              >
                                {fpuCompleteSession.isPending ? "Saving..." : "Mark Complete"}
                              </button>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-bold block mb-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                              Coach Notes
                            </label>
                            <textarea
                              value={fpuNotes[session.id] ?? session.adminNotes ?? ""}
                              onChange={(e) => setFpuNotes((prev) => ({ ...prev, [session.id]: e.target.value }))}
                              rows={3}
                              className="w-full text-sm rounded-lg p-2 resize-none"
                              style={{
                                background: "oklch(1 0 0)",
                                border: "1px solid oklch(0.90 0.015 80)",
                                color: "oklch(0.20 0.015 50)",
                              }}
                              placeholder="Session notes..."
                            />
                            <button
                              onClick={() =>
                                fpuUpdateNotes.mutate({
                                  sessionId: session.id,
                                  notes: fpuNotes[session.id] ?? session.adminNotes ?? "",
                                })
                              }
                              disabled={fpuUpdateNotes.isPending}
                              className="mt-2 text-xs px-3 py-1.5 rounded-full font-semibold"
                              style={{ background: "oklch(0.20 0.015 50)", color: "oklch(1 0 0)" }}
                            >
                              {fpuUpdateNotes.isPending ? "Saving..." : "Save Notes"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No FPU coaching clients yet.
        </p>
      )}
    </div>
  );
}
