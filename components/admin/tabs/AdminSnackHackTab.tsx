"use client";

import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AdminSnackHackTab() {
  const { data: snackHackLeads, refetch: refetchSnackHackLeads } = trpc.leadgen.adminListSnackHack.useQuery();
  const deleteSnackHackLead = trpc.leadgen.adminDeleteSnackHack.useMutation({
    onSuccess: () => {
      toast.success("Snack Hack lead removed");
      refetchSnackHackLeads();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2
            className="font-bold text-2xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Late Night Snack Hack Leads
          </h2>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
            Sign-ups from{" "}
            <a
              href="/snack-hack"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "oklch(0.72 0.12 75)" }}
            >
              mindandbodyresetcoach.com/snack-hack
            </a>
            . These are real email captures — each person received the free PDF guide.
          </p>
        </div>
        <div className="rounded-xl px-5 py-4 text-center" style={{ background: "oklch(1 0 0)", minWidth: "140px" }}>
          <div
            className="text-3xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            {snackHackLeads?.length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
            Unique emails in DB
          </div>
        </div>
      </div>
      <p className="text-xs mb-4 rounded-lg px-3 py-2" style={{ background: "oklch(0.97 0.02 80)", color: "oklch(0.40 0.02 50)" }}>
        This count is <strong>unique emails saved in our database</strong>. Meta Ads Lead events can be higher
        (duplicate downloads, browser + CAPI double-counting without full dedupe, test events, or leads that
        fired the pixel before the DB write succeeded).
      </p>

      {snackHackLeads && snackHackLeads.length > 0 ? (
        <div className="space-y-3">
          {snackHackLeads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "oklch(1 0 0)" }}
            >
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
                  {lead.firstName?.trim() || "—"}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`mailto:${lead.email}`} className="text-xs underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                    {lead.email}
                  </a>
                  <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {new Date(lead.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove this Snack Hack lead? This cannot be undone.")) {
                    deleteSnackHackLead.mutate({ id: lead.id });
                  }
                }}
                disabled={deleteSnackHackLead.isPending}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{ background: "oklch(0.95 0.06 10)", color: "oklch(0.45 0.12 10)" }}
              >
                {deleteSnackHackLead.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No Snack Hack sign-ups yet.
        </p>
      )}
    </div>
  );
}
