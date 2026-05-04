import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  CreditCard, DollarSign, Clock, AlertCircle, CheckCircle2,
  ExternalLink, Loader2, Filter,
} from "lucide-react";

const STATUS_CONFIG = {
  paid: { label: "Paid", color: "oklch(0.38 0.10 148)", bg: "oklch(0.25 0.04 148)", icon: <CheckCircle2 size={14} /> },
  pending: { label: "Pending", color: "oklch(0.72 0.12 75)", bg: "oklch(0.30 0.04 75)", icon: <Clock size={14} /> },
  failed: { label: "Failed", color: "oklch(0.72 0.07 10)", bg: "oklch(0.30 0.04 10)", icon: <AlertCircle size={14} /> },
} as const;

export default function AdminPaymentsTab() {
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "failed">("all");

  const { data: stats, isLoading: loadingStats } = trpc.payment.adminStats.useQuery();
  const { data: payments, isLoading: loadingPayments } = trpc.payment.adminList.useQuery(
    statusFilter === "all" ? undefined : { status: statusFilter }
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>
          Payments
        </h2>
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold"
          style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)", border: "1px solid oklch(0.35 0.02 160)" }}
        >
          <ExternalLink size={12} /> Stripe Dashboard
        </a>
      </div>

      {/* Stats cards */}
      {loadingStats ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin" size={24} style={{ color: "oklch(0.72 0.12 75)" }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<DollarSign size={18} />}
            label="Total Revenue"
            value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`}
            highlight
          />
          <StatCard
            icon={<CheckCircle2 size={18} />}
            label="Paid"
            value={String(stats?.paidCount ?? 0)}
          />
          <StatCard
            icon={<Clock size={18} />}
            label="Pending"
            value={String(stats?.pendingCount ?? 0)}
          />
          <StatCard
            icon={<AlertCircle size={18} />}
            label="Failed"
            value={String(stats?.failedCount ?? 0)}
          />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        <Filter size={14} style={{ color: "oklch(0.55 0.02 160)" }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)" }}>Filter:</span>
        {(["all", "paid", "pending", "failed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: statusFilter === f ? "oklch(0.72 0.12 75)" : "oklch(0.22 0.02 160)",
              color: statusFilter === f ? "oklch(0.22 0.02 160)" : "oklch(0.65 0.02 160)",
            }}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Payments table */}
      {loadingPayments ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin" size={24} style={{ color: "oklch(0.72 0.12 75)" }} />
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ background: "oklch(0.22 0.02 160)" }}>
          <CreditCard size={32} className="mx-auto mb-3" style={{ color: "oklch(0.45 0.02 160)" }} />
          <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>
            {statusFilter === "all" ? "No payments yet. Payments will appear here once clients enroll." : `No ${statusFilter} payments found.`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.22 0.02 160)" }}>
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)", borderBottom: "1px solid oklch(0.30 0.02 160)" }}>
            <div className="col-span-3">Client</div>
            <div className="col-span-3">Session ID</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Table rows */}
          {payments.map(p => {
            const cfg = STATUS_CONFIG[p.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
            return (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center transition-all"
                style={{ borderBottom: "1px solid oklch(0.25 0.02 160)" }}
              >
                <div className="col-span-3">
                  <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.97 0.008 10)" }}>
                    {p.clientName === "Pending" ? "—" : p.clientName ?? "Unknown"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "oklch(0.55 0.02 160)" }}>
                    {p.clientEmail === "pending@pending.com" ? "" : p.clientEmail ?? ""}
                  </p>
                </div>
                <div className="col-span-3">
                  <p className="text-xs font-mono truncate" style={{ color: "oklch(0.55 0.02 160)" }}>
                    {p.stripeSessionId.slice(0, 24)}...
                  </p>
                </div>
                <div className="col-span-2">
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon} {cfg.label}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="text-xs" style={{ color: "oklch(0.65 0.02 160)" }}>
                    {new Date(p.createdAt).toLocaleDateString("en-US", { timeZone: "America/Denver", month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.45 0.02 160)" }}>
                    {new Date(p.createdAt).toLocaleTimeString("en-US", { timeZone: "America/Denver", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <div className="col-span-2 text-right">
                  {p.stripePaymentIntentId && (
                    <a
                      href={`https://dashboard.stripe.com/payments/${p.stripePaymentIntentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)" }}
                    >
                      <ExternalLink size={11} /> View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: highlight ? "oklch(0.28 0.04 75)" : "oklch(0.22 0.02 160)",
        border: `1px solid ${highlight ? "oklch(0.72 0.12 75)" : "oklch(0.30 0.02 160)"}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span style={{ color: highlight ? "oklch(0.72 0.12 75)" : "oklch(0.55 0.02 160)" }}>{icon}</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)" }}>{label}</span>
      </div>
      <p className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: highlight ? "oklch(0.72 0.12 75)" : "oklch(0.97 0.008 10)" }}>
        {value}
      </p>
    </div>
  );
}
