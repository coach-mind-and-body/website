"use client";

import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import AdminPaymentsTab from "@/components/AdminPaymentsTab";
import { AdminEngagementHub } from "@/components/admin/AdminEngagementHub";
import PageEditorTab from "@/components/PageEditorTab";
import ProgramBuilderTab from "@/components/ProgramBuilderTab";
import { AdminContactsTab } from "@/components/admin/AdminContactsTab";
import { AdminMessagingSettingsTab } from "@/components/admin/AdminMessagingSettingsTab";
import AdminCrmAutomationsTab from "@/components/admin/AdminCrmAutomationsTab";
import { AdminOverviewTab } from "@/components/admin/tabs/AdminOverviewTab";
import { AdminSnackHackTab } from "@/components/admin/tabs/AdminSnackHackTab";
import { AdminFpuCoachingTab } from "@/components/admin/tabs/AdminFpuCoachingTab";
import { AdminFpuGroupTab } from "@/components/admin/tabs/AdminFpuGroupTab";
import { AdminBlogTab } from "@/components/admin/tabs/AdminBlogTab";
import { AdminCommonFilesTab } from "@/components/admin/tabs/AdminCommonFilesTab";
import { AdminManualEnrollModal } from "@/components/admin/tabs/AdminManualEnrollModal";
import { ADMIN_TAB_IDS, TABS, type AdminTab } from "@/components/admin/tabs/adminTypes";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { BRAND } from "@shared/brand";
import { getLoginUrl } from "@/lib/const";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function Admin() {
  const { user, loading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as AdminTab | null;
  const tab =
    tabParam && ADMIN_TAB_IDS.includes(tabParam) ? tabParam : "overview";

  const setTab = (newTab: AdminTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    router.push(`${pathname}?${params.toString()}`);
  };

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const isAdmin = isAuthenticated && user?.role === "admin";

  const { data: gcalStatus, refetch: refetchGcal } = trpc.googleCalendar.status.useQuery(undefined, {
    enabled: isAdmin && (tab === "contacts" || tab === "settings"),
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcal = params.get("gcal");
    if (gcal === "connected") {
      toast.success("Google Calendar connected!");
      refetchGcal();
    }
    if (gcal === "error") toast.error("Google Calendar connection failed. Please try again.");
    if (gcal) {
      const url = new URL(window.location.href);
      url.searchParams.delete("gcal");
      window.history.replaceState({}, "", url.toString());
    }
  }, [refetchGcal]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "oklch(0.72 0.12 75)" }}
        />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "oklch(0.20 0.015 50)" }}>
            Access Denied
          </h1>
          <p style={{ color: "oklch(0.52 0.015 50)" }}>This area is for Lee Anne only.</p>
          <a href={getLoginUrl()} className="mt-4 inline-block text-sm underline" style={{ color: "oklch(0.72 0.12 75)" }}>
            Sign in to continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.985 0.008 80)" }}>
      <header className="border-b" style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.985 0.008 80)" }}>
        <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={BRAND.logoUrl} alt={BRAND.name} className="w-8 h-8 rounded-full object-cover" />
            <span
              className="font-bold text-sm"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)", fontSize: "1rem" }}
            >
              Admin Portal
            </span>
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
              >
                {user?.name?.[0] ?? "A"}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: "oklch(0.42 0.015 50)" }}>
                {user?.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-3 mb-8 pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shadow-sm hover:shadow"
                style={{
                  background: tab === t.id ? "oklch(0.72 0.12 75)" : "oklch(0.96 0.025 50)",
                  color: tab === t.id ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
                  border: tab === t.id ? "none" : "1px solid oklch(0.90 0.015 80)",
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {tab === "overview" && <AdminOverviewTab />}

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

        {tab === "snackhack" && <AdminSnackHackTab />}
        {tab === "fpu" && <AdminFpuCoachingTab />}
        {tab === "fpugroup" && <AdminFpuGroupTab />}
        {tab === "pageeditor" && <PageEditorTab />}
        {tab === "programbuilder" && <ProgramBuilderTab />}
        {tab === "engagement" && <AdminEngagementHub />}
        {tab === "blog" && <AdminBlogTab />}
        {tab === "settings" && (
          <AdminMessagingSettingsTab gcalStatus={gcalStatus} disconnectGcal={disconnectGcal} />
        )}
        {tab === "crm-automations" && <AdminCrmAutomationsTab />}
        {tab === "deposits" && <AdminPaymentsTab />}
        {tab === "filelibrary" && <AdminCommonFilesTab />}
      </div>

      <AdminManualEnrollModal open={showEnrollModal} onOpenChange={setShowEnrollModal} />
    </div>
  );
}
