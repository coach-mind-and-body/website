"use client";


import { useState, useEffect } from "react";
import { Users, BookOpen, CreditCard, BarChart3, ChevronDown, ChevronUp, Bell, Link2, Link2Off, Calendar, Video, UserPlus, Layers, Target, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminClientSessions from "@/components/AdminClientSessions";
import AdminPaymentsTab from "@/components/AdminPaymentsTab";
import { AdminEngagementHub } from "@/components/admin/AdminEngagementHub";
import PageEditorTab from "@/components/PageEditorTab";
import ProgramBuilderTab from "@/components/ProgramBuilderTab";
import AdminModuleAssignment from "@/components/AdminModuleAssignment";
import { AdminContactsTab } from "@/components/admin/AdminContactsTab";
import { useInbox } from "@/components/admin/messaging/InboxContext";
import { AdminMessagingSettingsTab } from "@/components/admin/AdminMessagingSettingsTab";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { BRAND } from "@shared/brand";
import { getLoginUrl } from "@/lib/const";

import { useSearchParams, useRouter, usePathname } from "next/navigation";

type AdminTab = "overview" | "contacts" | "snackhack" | "fpu" | "fpugroup" | "programbuilder" | "engagement" | "blog" | "deposits" | "settings" | "pageeditor";

export default function Admin() {
  
  const { user, loading, isAuthenticated } = useAuth();
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const tabParam = searchParams.get("tab") as AdminTab | null;
  const tab = tabParam && ["overview", "contacts", "snackhack", "fpu", "fpugroup", "programbuilder", "engagement", "blog", "deposits", "settings", "pageeditor"].includes(tabParam) ? tabParam : "overview";
  
  const setTab = (newTab: AdminTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`${pathname}?${params.toString()}`);
  };
  const { setActiveChatMeta } = useInbox();
  const [expandedEnrollment, setExpandedEnrollment] = useState<number | null>(null);
  const [sessionNotes, setSessionNotes] = useState<Record<number, string>>({});
  const [blogTab, setBlogTab] = useState<"published" | "scheduled" | "drafts">("published");

  const { data: enrollments, refetch: refetchEnrollments } = trpc.enrollment.adminListAllUsers.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: leadsData, refetch: refetchLeads } = trpc.leads.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: activeConversations } = trpc.messaging.listConversations.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: blogPosts } = trpc.blog.adminList.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  
  const publishedPosts = blogPosts?.filter(p => p.published) ?? [];
  const scheduledPosts = blogPosts?.filter(p => !p.published && p.scheduledAt) ?? [];
  const draftPosts = blogPosts?.filter(p => !p.published && !p.scheduledAt) ?? [];
  const currentBlogPosts = blogTab === "published" ? publishedPosts : blogTab === "scheduled" ? scheduledPosts : draftPosts;
  const { data: fpuClients, refetch: refetchFpu } = trpc.fpu.adminListCoaching.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: fpuLeads, refetch: refetchFpuLeads } = trpc.fpu.adminListLeads.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: snackHackLeads, refetch: refetchSnackHackLeads } = trpc.leadgen.adminListSnackHack.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const { data: upcomingSessions } = trpc.enrollment.adminUpcomingSessions.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
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

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.008 80)" }}><div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "oklch(0.72 0.12 75)" }} /></div>;
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.20 0.015 50)" }}>Access Denied</h1>
          <p style={{ color: "oklch(0.52 0.015 50)" }}>This area is for Lee Anne only.</p>
          <a href={getLoginUrl()} className="mt-4 inline-block text-sm underline" style={{ color: "oklch(0.72 0.12 75)" }}>Sign in to continue</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      {/* Admin header */}
      <header className="border-b" style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.985 0.008 80)" }}>
        <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="w-8 h-8 rounded-full object-cover" />
            <span className="font-bold text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)", fontSize: "1rem" }}>
              Admin Portal
            </span>
          </a>
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/v2-inbox" 
              className="px-4 py-1.5 text-sm font-bold rounded-lg shadow-sm transition-transform hover:scale-105" 
              style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
            >
              Inbox V2
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
                {user?.name?.[0] ?? "A"}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: "oklch(0.42 0.015 50)" }}>{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Tab nav */}
        <div className="flex flex-wrap gap-3 mb-8 pb-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm hover:shadow" style={{
              background: tab === t.id ? "oklch(0.72 0.12 75)" : "oklch(0.96 0.025 50)",
              color: tab === t.id ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
              border: tab === t.id ? "none" : "1px solid oklch(0.90 0.015 80)"
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>Dashboard Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: "Active Clients", value: enrollments?.filter(e => e.status === "active").length ?? 0, icon: <Users size={18} /> },
                { label: "FPU Clients", value: fpuClients?.length ?? 0, icon: <Video size={18} /> },
                { label: "New Leads", value: leadsData?.filter(l => l.status === "new").length ?? 0, icon: <Bell size={18} /> },
                { label: "Snack Hack Leads", value: snackHackLeads?.length ?? 0, icon: <Cookie size={18} /> },
                { label: "Blog Posts", value: blogPosts?.length ?? 0, icon: <BookOpen size={18} /> },
                { label: "Total Enrollments", value: enrollments?.length ?? 0, icon: <CreditCard size={18} /> },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl p-5" style={{ background: "oklch(1 0 0)" }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: "oklch(0.72 0.12 75)" }}>{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>{stat.value}</div>
                  <div className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Upcoming Meetings */}
              <div>
                <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>Upcoming Meetings</h3>
                <div className="space-y-2">
                  {(upcomingSessions ?? []).map((session) => (
                    <div key={session.id} className="flex items-start justify-between p-4 rounded-xl shadow-sm" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                          {session.clientName} <span className="text-xs font-normal" style={{ color: "oklch(0.52 0.015 50)" }}>({session.clientEmail})</span>
                        </p>
                        <p className="text-xs font-bold mt-1" style={{ color: "oklch(0.72 0.12 75)" }}>Session {session.sessionNumber}</p>
                        <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                          {new Date(session.scheduledAt!).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                      {session.googleMeetLink && (
                        <a 
                          href={session.googleMeetLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                          style={{ background: "oklch(0.72 0.12 75)" }}
                        >
                          Join Meet
                        </a>
                      )}
                    </div>
                  ))}
                  {!upcomingSessions?.length && <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>No upcoming meetings.</p>}
                </div>
              </div>

              {/* Recent leads */}
              <div>
                <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>Recent Leads</h3>
                <div className="space-y-2">
                  {(leadsData ?? []).slice(0, 5).map((lead: { id: number; name: string; email: string; status: string; phone: string | null; notes: string | null; createdAt: Date }) => (
                    <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl shadow-sm" style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}>
                      <div>
                        <p className="font-semibold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>{lead.name}</p>
                        <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>{lead.email}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
                        background: lead.status === "new" ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
                        color: lead.status === "new" ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
                      }}>{lead.status}</span>
                    </div>
                  ))}
                  {!leadsData?.length && <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>No leads yet.</p>}
                </div>
              </div>

              {/* Recent Messages */}
              <div>
                <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>Recent Messages</h3>
                <div className="space-y-2">
                  {(activeConversations ?? []).slice(0, 5).map((conv: any) => (
                    <button 
                      key={conv.id} 
                      onClick={() => setActiveChatMeta({
                        conversationId: conv.id,
                        userId: conv.userId,
                        contactPhone: conv.contactPhone,
                        userName: conv.contactName || conv.contactPhone
                      })}
                      className="w-full flex items-center justify-between p-4 rounded-xl shadow-sm text-left hover:-translate-y-0.5 transition-transform" 
                      style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}
                    >
                      <div className="min-w-0 flex-1 pr-4">
                        <p className="font-semibold text-sm truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                          {conv.contactName || conv.contactPhone}
                        </p>
                        <p className="text-xs truncate" style={{ color: "oklch(0.52 0.015 50)" }}>
                          {conv.preview || "No messages"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="shrink-0 text-xs px-2 py-1 rounded-full font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
                          {conv.unreadCount} new
                        </span>
                      )}
                    </button>
                  ))}
                  {!activeConversations?.length && <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>No recent messages.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manual Enrollment Modal */}
        <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
          <DialogContent aria-describedby={undefined} style={{ background: "oklch(0.96 0.025 50)", border: "1px solid oklch(0.90 0.015 80)" }}>
            <DialogHeader>
              <DialogTitle style={{ color: "oklch(0.20 0.015 50)" }}>Manually Enroll a Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>Enter their email to create an enrollment and 6 coaching sessions. If they don't have an account yet, one will be created automatically and they'll receive a welcome email to set their password.</p>
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Client Email</Label>
                <Input
                  type="email"
                  placeholder="client@email.com"
                  value={enrollEmail}
                  onChange={e => setEnrollEmail(e.target.value)}
                  className="mt-1"
                  style={{ background: "oklch(1 0 0)", borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}
                />
              </div>
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Payment Plan</Label>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => setEnrollPaymentType("deposit")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentType === "deposit" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentType === "deposit" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                    }}
                  >Deposit ($200)</button>
                  <button
                    onClick={() => setEnrollPaymentType("full")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentType === "full" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentType === "full" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                    }}
                  >Full Payment ($597)</button>
                </div>
              </div>
              <div>
                <Label style={{ color: "oklch(0.42 0.015 50)" }}>Payment Status</Label>
                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => setEnrollPaymentStatus("paid")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentStatus === "paid" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentStatus === "paid" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                    }}
                  >Paid (Outside Stripe)</button>
                  <button
                    onClick={() => setEnrollPaymentStatus("unpaid")}
                    className="flex-1 py-2 rounded-lg text-sm font-semibold border transition-all"
                    style={{
                      background: enrollPaymentStatus === "unpaid" ? "oklch(0.72 0.12 75)" : "transparent",
                      borderColor: "oklch(0.72 0.12 75)",
                      color: enrollPaymentStatus === "unpaid" ? "oklch(0.96 0.025 50)" : "oklch(0.72 0.12 75)",
                    }}
                  >Unpaid (Collect Later)</button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEnrollModal(false)} style={{ borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.42 0.015 50)" }}>Cancel</Button>
              <Button
                onClick={() => adminCreateEnrollment.mutate({ 
                  clientEmail: enrollEmail, 
                  paymentType: enrollPaymentType, 
                  depositPaid: enrollPaymentStatus === "paid", 
                  balancePaid: enrollPaymentStatus === "paid" && enrollPaymentType === "full" 
                })}
                disabled={!enrollEmail || adminCreateEnrollment.isPending}
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
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
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
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
                <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
                  Late Night Snack Hack Leads
                </h2>
                <p className="text-sm max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Sign-ups from{" "}
                  <a href="/snack-hack" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                    mindandbodyresetcoach.com/snack-hack
                  </a>
                  . These are real email captures — each person received the free PDF guide.
                </p>
              </div>
              <div className="rounded-xl px-5 py-4 text-center" style={{ background: "oklch(1 0 0)", minWidth: "140px" }}>
                <div className="text-3xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
                  {snackHackLeads?.length ?? 0}
                </div>
                <div className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>Total sign-ups</div>
              </div>
            </div>

            {snackHackLeads && snackHackLeads.length > 0 ? (
              <div className="space-y-3">
                {snackHackLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(1 0 0)" }}>
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
              <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>No Snack Hack sign-ups yet.</p>
            )}
          </div>
        )}

        {/* FPU Group Sign-Ups */}
        {tab === "fpugroup" && (
          <div>
            <h2 className="font-bold text-2xl mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>FPU Group Sign-Ups</h2>
            {fpuLeads && fpuLeads.length > 0 ? (
              <div className="space-y-3">
                {fpuLeads.map((lead: { id: number; name: string; email: string; createdAt: Date }) => (
                  <div key={lead.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(1 0 0)" }}>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>{lead.name}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>{lead.email}</span>
                        <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>Signed up {new Date(lead.createdAt).toLocaleDateString()}</span>
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
              <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>No FPU group sign-ups yet.</p>
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
              <h2 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>Blog Posts</h2>
              <a href="/admin/blog/new" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}>
                + New Post
              </a>
            </div>

            <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "oklch(0.985 0.008 80)" }}>
              {(["published", "scheduled", "drafts"] as const).map(bt => (
                <button
                  key={bt}
                  onClick={() => setBlogTab(bt)}
                  className={`pb-2 text-sm font-bold transition-all ${blogTab === bt ? "border-b-2" : "opacity-60"}`}
                  style={{ 
                    borderColor: blogTab === bt ? "oklch(0.72 0.12 75)" : "transparent",
                    color: blogTab === bt ? "oklch(0.20 0.015 50)" : "oklch(0.42 0.015 50)"
                  }}
                >
                  {bt === "published" ? "Published" : bt === "scheduled" ? "Scheduled" : "Drafts"}
                  <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "oklch(1 0 0)", color: "oklch(0.52 0.015 50)" }}>
                    {bt === "published" ? publishedPosts.length : bt === "scheduled" ? scheduledPosts.length : draftPosts.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {currentBlogPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between p-4 rounded-xl" style={{ background: "oklch(1 0 0)" }}>
                  <div>
                    <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>{post.title}</p>
                    <div className="flex items-center gap-3">
                      {post.category && <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>{post.category}</span>}
                      <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
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
                      <a href={`/health-wellness-blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "oklch(0.52 0.015 50)" }}>View</a>
                    )}
                  </div>
                </div>
              ))}
              {!currentBlogPosts.length && <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>No {blogTab} posts yet.</p>}
            </div>
          </div>
        )}

        {/* Settings / Integrations */}
        {tab === "settings" && (
          <AdminMessagingSettingsTab 
            gcalStatus={gcalStatus} 
            disconnectGcal={disconnectGcal} 
          />
        )}

        {/* Deposits/Payments */}
        {tab === "deposits" && <AdminPaymentsTab />}
      </div>
    </div>
  );
}
