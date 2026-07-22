"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AdminFpuGroupTab() {
  const { data: fpuLeads, refetch: refetchFpuLeads } = trpc.fpu.adminListLeads.useQuery();
  const deleteFpuLead = trpc.fpu.adminDeleteLead.useMutation({
    onSuccess: () => {
      toast.success("Lead deleted!");
      refetchFpuLeads();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <h2
        className="font-bold text-2xl mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        FPU Group Sign-Ups
      </h2>
      {fpuLeads && fpuLeads.length > 0 ? (
        <div className="space-y-3">
          {fpuLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "oklch(1 0 0)" }}
            >
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
                  {lead.name}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>
                    {lead.email}
                  </span>
                  <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    Signed up {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Delete this FPU sign-up? This cannot be undone.")) {
                    deleteFpuLead.mutate({ id: lead.id });
                  }
                }}
                disabled={deleteFpuLead.isPending}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{ background: "oklch(0.95 0.06 10)", color: "oklch(0.45 0.12 10)" }}
              >
                {deleteFpuLead.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No FPU group sign-ups yet.
        </p>
      )}
    </div>
  );
}
