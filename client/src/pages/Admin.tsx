import { useState, useEffect } from "react";
import { Users, BookOpen, CreditCard, BarChart3, ChevronDown, ChevronUp, Bell, Link2, Link2Off, Calendar, Video, UserPlus, Layers, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminClientSessions from "@/components/AdminClientSessions";
import AdminPaymentsTab from "@/components/AdminPaymentsTab";
import { AdminDepositsTab } from "@/components/admin/AdminDepositsTab";
import { AdminSettingsTab } from "@/components/admin/AdminSettingsTab";
import { AdminPageEditorTab } from "@/components/admin/AdminPageEditorTab";
import { AdminEngagementHub } from "@/components/admin/AdminEngagementHub";
import PageEditorTab from "@/components/PageEditorTab";
import ProgramBuilderTab from "@/components/ProgramBuilderTab";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { BRAND } from "../../../shared/brand";
import { getLoginUrl } from "@/const";
import { usePageTitle } from "@/hooks/usePageTitle";

type AdminTab = "overview" | "clients" | "leads" | "fpu" | "fpugroup" | "programbuilder" | "engagement" | "blog" | "deposits" | "settings" | "pageeditor";

export default function Admin() {
  usePageTitle({
    title: "Admin Dashboard | Mind and Body Reset",
    description: "Mind & Body Reset administration dashboard for managing content, users, and site settings.",
    keywords: "admin dashboard, site management"
  });
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [expandedEnrollment, setExpandedEnrollment] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState<Record<number, string>>({});

  const { data: enrollments, refetch: refetchEnrollments } = trpc.enrollment.adminList.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: leadsData, refetch: refetchLeads } = trpc.leads.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: blogData } = trpc.blog.list.useQuery({ limit: 50 }, { enabled: isAuthenticated && user?.role === "admin" });
  const blogPosts = blogData?.posts;
  const { data: fpuClients, refetch: refetchFpu } = trpc.fpu.adminListCoaching.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: fpuLeads, refetch: refetchFpuLeads } = trpc.fpu.adminListLeads.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const [fpuNotes, setFpuNotes] = useState<Record<number, string>>({});
  const [expandedFpu, setExpandedFpu] = useState<number | null>(null);
  const deleteFpuLead = trpc.fpu.adminDeleteLead.useMutation({
    onSuccess: () => { toast.success("Lead deleted!"); refetchFpuLeads(); },
    onError: (e) => toast.error(e.message),
  });
  const fpuCompleteSession = trpc.fpu.adminCompleteSession.useMutation({
    onSuccess: () => { toast.success("Session marked complete!"); refetchFpu(); },
    onError: (e) => toast.error(e.message),
  });
  const fpuUpdateNotes = trpc.fpu.adminUpdateNotes.useMutation({
    onSuccess: () => toast.success("Notes saved!"),
    onError: (e) => toast.error(e.message),
  });

  const sendBalanceReminder = trpc.enrollment.adminSendBalanceReminder.useMutation({
    onSuccess: (data) => toast.success(`Balance reminder sent to ${data.sentTo}!`),
    onError: (e) => toast.error(e.message),
  });

  const completeSession = trpc.enrollment.completeSession.useMutation({
    onSuccess: () => { toast.success("Session marked complete!"); refetchEnrollments(); },
    onError: (e) => toast.error(e.message),
  });

  const updateLead = trpc.leads.updateStatus.useMutation({
    onSuccess: () => { toast.success("Lead updated!"); refetchLeads(); },
    onError: (e) => toast.error(e.message),
  });

  const { data: gcalStatus, refetch: refetchGcal } = trpc.googleCalendar.status.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });

  // Manual enrollment creation
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollPaymentType, setEnrollPaymentType] = useState<"full" | "deposit">("deposit");
  const [enrollPaymentStatus, setEnrollPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const adminCreateEnrollment = trpc.enrollment.adminCreate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowEnrollModal(false);
      setEnrollEmail("");
      refetchEnrollments();
    },
    onError: (e) => toast.error(e.message),
  });

  const disconnectGcal = async () => {
    try {
      await fetch("/api/auth/google-calendar/disconnect", { method: "DELETE", credentials: "include" });
      toast.success("Google Calendar disconnected");
      refetchGcal();
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  // Handle gcal query param feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get("gcal");
    if (gcal === "connected") { toast.success("Google Calendar connected!"); refetchGcal(); }
    if (gcal === "error") toast.error("Google Calendar connection failed. Please try again.");
    if (gcal) { const url = new URL(window.location.href); url.searchParams.delete("gcal"); window.history.replaceState({}, "", url.toString()); }
  }, []);

  const TABS: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={16} /> },
    { id: "clients", label: "Clients", icon: <Users size={16} /> },
    { id: "leads", label: "Leads", icon: <Bell size={16} /> },
    { id: "fpu", label: "FPU Coaching", icon: <Video size={16} /> },
    { id: "fpugroup", label: "FPU Sign-Ups", icon: <UserPlus size={16} /> },
    { id: "programbuilder", label: "Program Builder", icon: <Layers size={16} /> },
    { id: "engagement", label: "Engagement Hub", icon: <Target size={16} /> },
    { id: "pageeditor", label: "Edit Financial Peace", icon: <BookOpen size={16} /> },
    { id: "blog", label: "Blog", icon: <BookOpen size={16} /> },
    { id: "deposits", label: "Payments", icon: <CreditCard size={16} /> },
    { id: "settings", label: "Settings", icon: <Link2 size={16} /> },
  ];

  // Add FPU Group Sign-Ups count to overview
  const fpuGroupSignUpCount = fpuLeads?.length ?? 0;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.12 0.01 160)" }}><div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.72 0.12 75)" }} /></div>;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.12 0.01 160)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.97 0.008 10)" }}>Access Denied</h1>
          <p style={{ color: "oklch(0.60 0.02 160)" }}>This area is for Lee Anne only.</p>
          <a href={getLoginUrl()} className="mt-4 inline-block text-sm underline" style={{ color: "oklch(0.72 0.12 75)" }}>Sign in to continue</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.12 0.01 160)" }}>
      {/* Admin header */}
      <header className="border-b" style={{ background: "oklch(0.18 0.02 160)", borderColor: "oklch(0.28 0.02 160)" }}>
        <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="w-8 h-8 rounded-full object-cover" />
            <span className="font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)", fontSize: "1rem" }}>
              Admin Portal
            </span>
          </a>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
              {user?.name?.[0] ?? "A"}
            </div>
            <span className="text-xs font-semibold hidden sm:block" style={{ color: "oklch(0.65 0.02 160)" }}>{user?.name}</span>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Tab nav */}
        <div className="flex flex-wrap gap-2 mb-8 pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all" style={{
              background: tab === t.id ? "oklch(0.72 0.12 75)" : "oklch(0.22 0.02 160)",
              color: tab === t.id ? "oklch(0.22 0.02 160)" : "oklch(0.65 0.02 160)",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Active Clients", value: enrollments?.filter(e => e.status === "active").length ?? 0, icon: <Users size={18} /> },
                { label: "FPU Clients", value: fpuClients?.length ?? 0, icon: <Video size={18} /> },
                { label: "New Leads", value: leadsData?.filter(l => l.status === "new").length ?? 0, icon: <Bell size={18} /> },
                { label: "Blog Posts", value: blogPosts?.length ?? 0, icon: <BookOpen size={18} /> },
                { label: "Total Enrollments", value: enrollments?.length ?? 0, icon: <CreditCard size={18} /> },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-5" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: "oklch(0.72 0.12 75)" }}>{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>{stat.value}</div>
                  <div className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
            {/* Recent leads */}
            <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.97 0.008 10)" }}>Recent Leads</h3>
            <div className="space-y-2">
              {(leadsData ?? []).slice(0, 5).map((lead: { id: number; name: string; email: string; status: string; phone: string | null; notes: string | null; createdAt: Date }) => (
                <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "oklch(0.97 0.008 10)" }}>{lead.name}</p>
                    <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>{lead.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                    background: lead.status === "new" ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
                    color: lead.status === "new" ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
                  }}>{lead.status}</span>
                </div>
              ))}
              {!leadsData?.length && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No leads yet.</p>}
            </div>
          </div>
        )}

        {/* Manual Enrollment Modal */}
        <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
          <DialogContent style={{ background: "oklch(0.18 0.02 160)", border: "1px solid oklch(0.30 0.02 160)" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "oklch(0.97 0.008 10)" }}>Manually Enroll a Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm" style={{ color: "oklch(0.65 0.02 160)" }}>Enter their email to create an enrollment and 6 coaching sessions. If they don't have an account yet, one will be created automatically and they'll receive a welcome email to set their password.</p>
              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Client Email</Label>
                <Input
                  type="email"
                  placeholder="client@email.com"
                  value={enrollEmail}
                  onChange={e => setEnrollEmail(e.target.value)}
                  className="mt-1"
                  style={{ background: "oklch(0.22 0.02 160)", borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.97 0.008 10)" }}
                />
              </div>
              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Payment Plan</Label>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => setEnrollPaymentType("deposit")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentType === "deposit" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentType === "deposit" ? "oklch(0.18 0.02 160)" : "oklch(0.72 0.12 75)",
                    }}
                  >Deposit ($200)</button>
                  <button
                    onClick={() => setEnrollPaymentType("full")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentType === "full" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentType === "full" ? "oklch(0.18 0.02 160)" : "oklch(0.72 0.12 75)",
                    }}
                  >Full Payment ($597)</button>
                </div>
              </div>
              <div>
                <Label style={{ color: "oklch(0.80 0.02 160)" }}>Payment Status</Label>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => setEnrollPaymentStatus("paid")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentStatus === "paid" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentStatus === "paid" ? "oklch(0.18 0.02 160)" : "oklch(0.72 0.12 75)",
                    }}
                  >Paid (Outside Stripe)</button>
                  <button
                    onClick={() => setEnrollPaymentStatus("unpaid")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentStatus === "unpaid" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentStatus === "unpaid" ? "oklch(0.18 0.02 160)" : "oklch(0.72 0.12 75)",
                    }}
                  >Unpaid (Collect Later)</button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollModal(false)} style={{ borderColor: "oklch(0.35 0.02 160)", color: "oklch(0.80 0.02 160)" }}>Cancel</Button>
              <Button
                onClick={() => adminCreateEnrollment.mutate({ 
                  clientEmail: enrollEmail, 
                  paymentType: enrollPaymentType, 
                  depositPaid: enrollPaymentStatus === "paid", 
                  balancePaid: enrollPaymentStatus === "paid" && enrollPaymentType === "full" 
                })}
                disabled={!enrollEmail || adminCreateEnrollment.isPending}
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
              >
                {adminCreateEnrollment.isPending ? "Creating..." : "Create Enrollment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clients */}
        {tab === "clients" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Client Enrollments</h2>
              <button
                onClick={() => setShowEnrollModal(true)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
              >
                <UserPlus size={16} />
                Enroll Client Manually
              </button>
            </div>
            <div className="space-y-4">
              {(enrollments ?? []).map(enrollment => (
                <div key={enrollment.id} className="rounded-xl overflow-hidden" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setExpandedEnrollment(expandedEnrollment === enrollment.id ? null : enrollment.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                        {(enrollment.clientName ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "oklch(0.97 0.008 10)" }}>{enrollment.clientName ?? `Client #${enrollment.userId}`}</p>
                        <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>
                          {enrollment.clientEmail ? `${enrollment.clientEmail} · ` : ""}{enrollment.paymentType === "full" ? "Paid in Full" : "Deposit"} · Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {enrollment.paymentType === "deposit" && !enrollment.balancePaid && (
                        <button
                          onClick={(e) => { e.stopPropagation(); sendBalanceReminder.mutate({ enrollmentId: enrollment.id }); }}
                          disabled={sendBalanceReminder.isPending}
                          className="text-xs px-3 py-1 rounded-full font-bold border transition-all hover:opacity-80"
                          style={{ borderColor: "oklch(0.72 0.12 75)", color: "oklch(0.72 0.12 75)", background: "transparent" }}
                          title="Send $397 balance reminder email to client"
                        >
                          {sendBalanceReminder.isPending ? "Sending..." : "Send Balance Reminder"}
                        </button>
                      )}
                      {enrollment.paymentType === "deposit" && enrollment.balancePaid && (
                        <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}>Paid in Full</span>
                      )}
                      <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                        background: enrollment.status === "active" ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
                        color: enrollment.status === "active" ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
                      }}>{enrollment.status}</span>
                      {expandedEnrollment === enrollment.id ? <ChevronUp size={16} style={{ color: "oklch(0.60 0.02 160)" }} /> : <ChevronDown size={16} style={{ color: "oklch(0.60 0.02 160)" }} />}
                    </div>
                  </button>
                  {expandedEnrollment === enrollment.id && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "oklch(0.30 0.02 160)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-2" style={{ color: "oklch(0.60 0.02 160)" }}>Session Management</p>
                      <AdminClientSessions
                        enrollmentId={enrollment.id}
                        gcalConnected={!!gcalStatus?.connected}
                      />
                    </div>
                  )}
                </div>
              ))}
              {!enrollments?.length && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No enrollments yet.</p>}
            </div>
          </div>
        )}

        {/* Leads */}
        {tab === "leads" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Discovery Call Leads</h2>
            <div className="space-y-3">
              {(leadsData ?? []).map((lead: { id: number; name: string; email: string; status: "new" | "contacted" | "enrolled" | "not_a_fit"; phone: string | null; notes: string | null; createdAt: Date }) => (
                <div key={lead.id} className="rounded-xl p-5" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>{lead.name}</p>
                      <p className="text-xs mb-1" style={{ color: "oklch(0.60 0.02 160)" }}>{lead.email}</p>
                      {lead.phone && <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>{lead.phone}</p>}
                      {lead.notes && <p className="text-xs mt-2 italic" style={{ color: "oklch(0.65 0.02 160)" }}>"{lead.notes}"</p>}
                      <p className="text-xs mt-2" style={{ color: "oklch(0.50 0.02 160)" }}>
                        {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <select
                      value={lead.status}
                      onChange={e => updateLead.mutate({ id: lead.id, status: e.target.value as "new" | "contacted" | "enrolled" | "not_a_fit" })}
                      className="text-xs rounded-lg px-2 py-1.5 font-bold"
                      style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.42 0.02 160)" }}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="enrolled">Enrolled</option>
                      <option value="not_a_fit">Not a Fit</option>
                    </select>
                  </div>
                </div>
              ))}
              {!leadsData?.length && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No leads yet.</p>}
            </div>
          </div>
        )}

        {/* FPU Coaching */}
        {tab === "fpu" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>FPU 1:1 Coaching Clients</h2>
            {!fpuClients?.length && (
              <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No FPU coaching clients yet.</p>
            )}
            <div className="space-y-4">
              {(fpuClients ?? []).map(({ order, sessions }) => (
                <div key={order.id} className="rounded-xl overflow-hidden" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <button
                    className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setExpandedFpu(expandedFpu === order.id ? null : order.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                        {(order.clientName ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "oklch(0.97 0.008 10)" }}>{order.clientName ?? `Client #${order.id}`}</p>
                        <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>
                          {order.clientEmail} · Purchased {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}>
                        {sessions.filter(s => s.completedAt).length}/{sessions.length} sessions done
                      </span>
                      {expandedFpu === order.id ? <ChevronUp size={16} style={{ color: "oklch(0.60 0.02 160)" }} /> : <ChevronDown size={16} style={{ color: "oklch(0.60 0.02 160)" }} />}
                    </div>
                  </button>
                  {expandedFpu === order.id && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: "oklch(0.30 0.02 160)" }}>
                      <p className="text-xs font-bold uppercase tracking-widest mt-4 mb-3" style={{ color: "oklch(0.60 0.02 160)" }}>Sessions</p>
                      <div className="space-y-3">
                        {sessions.map(session => (
                          <div key={session.id} className="rounded-lg p-4" style={{ background: "oklch(0.28 0.02 160)" }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Video size={14} style={{ color: "oklch(0.72 0.12 75)" }} />
                                <span className="text-sm font-semibold" style={{ color: "oklch(0.97 0.008 10)" }}>Session {session.sessionNumber}</span>
                                {session.completedAt && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}>Completed {new Date(session.completedAt).toLocaleDateString()}</span>
                                )}
                              </div>
                              {!session.completedAt && (
                                <button
                                  onClick={() => fpuCompleteSession.mutate({ sessionId: session.id, notes: fpuNotes[session.id] })}
                                  disabled={fpuCompleteSession.isPending}
                                  className="text-xs px-3 py-1.5 rounded-full font-bold"
                                  style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={2}
                              placeholder="Coach notes for this session…"
                              value={fpuNotes[session.id] ?? session.adminNotes ?? ""}
                              onChange={e => setFpuNotes(prev => ({ ...prev, [session.id]: e.target.value }))}
                              className="w-full text-xs rounded-lg px-3 py-2 resize-none"
                              style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.38 0.02 160)" }}
                            />
                            <button
                              onClick={() => fpuUpdateNotes.mutate({ sessionId: session.id, notes: fpuNotes[session.id] ?? session.adminNotes ?? "" })}
                              disabled={fpuUpdateNotes.isPending}
                              className="mt-2 text-xs px-3 py-1 rounded-full font-semibold"
                              style={{ background: "oklch(0.35 0.02 160)", color: "oklch(0.72 0.12 75)" }}
                            >
                              Save Notes
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FPU Group Sign-Ups */}
        {tab === "fpugroup" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>FPU Group Sign-Ups</h2>
            {fpuLeads && fpuLeads.length > 0 ? (
              <div className="space-y-3">
                {fpuLeads.map((lead: { id: number; name: string; email: string; createdAt: Date }) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(0.22 0.02 160)" }}>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>{lead.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>{lead.email}</span>
                        <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>Signed up {new Date(lead.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteFpuLead.mutate({ id: lead.id })}
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
              <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No FPU group sign-ups yet.</p>
            )}
          </div>
        )}

        {/* Edit Financial Peace Page */}
        {tab === "pageeditor" && (
          <PageEditorTab />
        )}

        {/* Program Builder */}
        {tab === "programbuilder" && (
          <ProgramBuilderTab />
        )}

        {/* Engagement Hub */}
        {tab === "engagement" && (
          <AdminEngagementHub />
        )}

        {/* Blog */}
        {tab === "blog" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Blog Posts</h2>
              <a href="/admin/blog/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                + New Post
              </a>
            </div>
            <div className="space-y-3">
              {(blogPosts ?? []).map((post: { id: number; slug: string; title: string; category: string | null; published: boolean; publishedAt: Date | null }) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>{post.title}</p>
                    <div className="flex items-center gap-3">
                      {post.category && <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>{post.category}</span>}
                      <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                      background: post.published ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
                      color: post.published ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
                    }}>{post.published ? "Published" : "Draft"}</span>
                    <a href={`/admin/blog/${post.id}`} className="text-xs underline" style={{ color: "oklch(0.72 0.12 75)" }}>Edit</a>
                    <a href={`/health-wellness-blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "oklch(0.55 0.02 160)" }}>View</a>
                  </div>
                </div>
              ))}
              {!blogPosts?.length && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No blog posts yet. Create your first one!</p>}
            </div>
          </div>
        )}

        {/* Settings / Integrations */}
        {tab === "settings" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Settings & Integrations</h2>
            <div className="rounded-2xl p-6" style={{ background: "oklch(0.22 0.02 160)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "oklch(0.28 0.02 160)" }}>
                    <Calendar size={22} style={{ color: "oklch(0.72 0.12 75)" }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>Google Calendar</h3>
                    <p className="text-sm mb-2" style={{ color: "oklch(0.60 0.02 160)" }}>
                      Connect your Google Calendar to auto-create sessions with Google Meet links when you schedule client appointments.
                    </p>
                    {gcalStatus?.connected ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}>
                          ✓ Connected{gcalStatus.email ? ` as ${gcalStatus.email}` : ""}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>Not connected</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {gcalStatus?.connected ? (
                    <button
                      onClick={disconnectGcal}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                      style={{ background: "oklch(0.35 0.08 20)", color: "oklch(0.90 0.02 20)" }}
                    >
                      <Link2Off size={14} /> Disconnect
                    </button>
                  ) : (
                    <a
                      href="/api/auth/google-calendar/connect"
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                      style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}
                    >
                      <Link2 size={14} /> Connect Google Calendar
                    </a>
                  )}
                </div>
              </div>
              {gcalStatus?.connected && (
                <div className="mt-5 pt-5 border-t" style={{ borderColor: "oklch(0.30 0.02 160)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "oklch(0.60 0.02 160)" }}>What happens when connected</p>
                  <ul className="space-y-1.5">
                    {[
                      "When you schedule a session, a Google Calendar event is automatically created",
                      "A Google Meet link is generated and shared with the client",
                      "Both you and the client receive a calendar invite",
                      "Join Meet buttons appear in both your admin portal and the client portal",
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs" style={{ color: "oklch(0.70 0.02 160)" }}>
                        <Video size={12} className="mt-0.5 flex-shrink-0" style={{ color: "oklch(0.72 0.12 75)" }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Deposits/Payments */}
        {tab === "deposits" && <AdminPaymentsTab />}
      </div>
    </div>
  );
}
