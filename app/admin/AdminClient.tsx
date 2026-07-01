"use client";


import { useState, useEffect } from "react";
import { Users, BookOpen, CreditCard, BarChart3, ChevronDown, ChevronUp, Bell, Link2, Link2Off, Calendar, Video, UserPlus, Layers, Target, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminClientSessions from "@/components/AdminClientSessions";
import AdminPaymentsTab from "@/components/AdminPaymentsTab";
import { AdminEngagementHub } from "@/components/admin/AdminEngagementHub";
import PageEditorTab from "@/components/PageEditorTab";
import ProgramBuilderTab from "@/components/ProgramBuilderTab";
import AdminClientHabits from "@/components/AdminClientHabits";
import AdminModuleAssignment from "@/components/AdminModuleAssignment";
import { AdminContactsTab } from "@/components/admin/AdminContactsTab";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { BRAND } from "@shared/brand";
import { getLoginUrl } from "@/lib/const";

type AdminTab = "overview" | "contacts" | "snackhack" | "fpu" | "fpugroup" | "programbuilder" | "engagement" | "blog" | "deposits" | "settings" | "pageeditor";

export default function Admin() {
  
  const { user, loading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [expandedEnrollment, setExpandedEnrollment] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState<Record<number, string>>({});
  const [blogTab, setBlogTab] = useState<"published" | "scheduled" | "drafts">("published");

  const { data: enrollments, refetch: refetchEnrollments } = trpc.enrollment.adminListAllUsers.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: leadsData, refetch: refetchLeads } = trpc.leads.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: blogPosts } = trpc.blog.adminList.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  
  const publishedPosts = blogPosts?.filter(p => p.published) ?? [];
  const scheduledPosts = blogPosts?.filter(p => !p.published && p.scheduledAt) ?? [];
  const draftPosts = blogPosts?.filter(p => !p.published && !p.scheduledAt) ?? [];
  const currentBlogPosts = blogTab === "published" ? publishedPosts : blogTab === "scheduled" ? scheduledPosts : draftPosts;
  const { data: fpuClients, refetch: refetchFpu } = trpc.fpu.adminListCoaching.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: fpuLeads, refetch: refetchFpuLeads } = trpc.fpu.adminListLeads.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: snackHackLeads, refetch: refetchSnackHackLeads } = trpc.leadgen.adminListSnackHack.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const deleteSnackHackLead = trpc.leadgen.adminDeleteSnackHack.useMutation({
    onSuccess: () => { toast.success("Snack Hack lead removed"); refetchSnackHackLeads(); },
    onError: (e) => toast.error(e.message),
  });
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
    { id: "contacts", label: "Contacts", icon: <Users size={16} /> },
    { id: "snackhack", label: "Snack Hack Leads", icon: <Cookie size={16} /> },
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
                { label: "Snack Hack Leads", value: snackHackLeads?.length ?? 0, icon: <Cookie size={18} /> },
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

        {/* Contacts */}
        {tab === "contacts" && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowEnrollModal(true)}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.02 160)" }}
              >
                <UserPlus size={16} />
                Enroll Reclaim Client Manually
              </button>
            </div>
            <AdminContactsTab gcalConnected={!!gcalStatus?.connected} />
          </div>
        )}

        {/* Snack Hack Leads */}
        {tab === "snackhack" && (
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>
                  Late Night Snack Hack Leads
                </h2>
                <p className="text-sm max-w-xl" style={{ color: "oklch(0.60 0.02 160)" }}>
                  Sign-ups from{" "}
                  <a href="/snack-hack" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                    mindandbodyresetcoach.com/snack-hack
                  </a>
                  . These are real email captures — each person received the free PDF guide.
                </p>
              </div>
              <div className="rounded-xl px-5 py-4 text-center" style={{ background: "oklch(0.22 0.02 160)", minWidth: "140px" }}>
                <div className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>
                  {snackHackLeads?.length ?? 0}
                </div>
                <div className="text-xs mt-1" style={{ color: "oklch(0.60 0.02 160)" }}>Total sign-ups</div>
              </div>
            </div>

            {snackHackLeads && snackHackLeads.length > 0 ? (
              <div className="space-y-3">
                {snackHackLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(0.22 0.02 160)" }}>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>
                        {lead.firstName?.trim() || "—"}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <a href={`mailto:${lead.email}`} className="text-xs underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                          {lead.email}
                        </a>
                        <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>
                          {new Date(lead.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteSnackHackLead.mutate({ id: lead.id })}
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
              <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No Snack Hack sign-ups yet.</p>
            )}
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}>Blog Posts</h2>
              <a href="/admin/blog/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.22 0.02 160)" }}>
                + New Post
              </a>
            </div>

            <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "oklch(0.28 0.02 160)" }}>
              {(["published", "scheduled", "drafts"] as const).map(bt => (
                <button
                  key={bt}
                  onClick={() => setBlogTab(bt)}
                  className={`pb-2 text-sm font-bold transition-all ${blogTab === bt ? "border-b-2" : "opacity-60"}`}
                  style={{ 
                    borderColor: blogTab === bt ? "oklch(0.72 0.12 75)" : "transparent",
                    color: blogTab === bt ? "oklch(0.97 0.008 10)" : "oklch(0.65 0.02 160)"
                  }}
                >
                  {bt === "published" ? "Published" : bt === "scheduled" ? "Scheduled" : "Drafts"}
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.60 0.02 160)" }}>
                    {bt === "published" ? publishedPosts.length : bt === "scheduled" ? scheduledPosts.length : draftPosts.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {currentBlogPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(0.22 0.02 160)" }}>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.97 0.008 10)" }}>{post.title}</p>
                    <div className="flex items-center gap-3">
                      {post.category && <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>{post.category}</span>}
                      <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>
                        {post.published && post.publishedAt 
                          ? new Date(post.publishedAt).toLocaleDateString() 
                          : post.scheduledAt 
                          ? `Scheduled for ${new Date(post.scheduledAt).toLocaleDateString()}` 
                          : "Draft"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                      background: post.published ? "oklch(0.92 0.04 148)" : post.scheduledAt ? "oklch(0.35 0.04 75)" : "oklch(0.93 0.06 75)",
                      color: post.published ? "oklch(0.38 0.10 148)" : post.scheduledAt ? "oklch(0.90 0.10 75)" : "oklch(0.45 0.12 65)",
                    }}>
                      {post.published ? "Published" : post.scheduledAt ? "Scheduled" : "Draft"}
                    </span>
                    <a href={`/admin/blog/${post.id}`} className="text-xs underline" style={{ color: "oklch(0.72 0.12 75)" }}>Edit</a>
                    {post.published && (
                      <a href={`/health-wellness-blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "oklch(0.55 0.02 160)" }}>View</a>
                    )}
                  </div>
                </div>
              ))}
              {!currentBlogPosts.length && <p className="text-sm" style={{ color: "oklch(0.55 0.02 160)" }}>No {blogTab} posts yet.</p>}
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
