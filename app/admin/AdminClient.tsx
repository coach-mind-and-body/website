"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useWebPush } from "@/hooks/useWebPush";
import { useInboxNewMessageAlerts } from "@/hooks/useInboxNewMessageAlerts";
import AdminPaymentsTab from "@/components/AdminPaymentsTab";
import { AdminEngagementHub } from "@/components/admin/AdminEngagementHub";
import { AdminPillNav } from "@/components/admin/AdminPillNav";
import { AdminMessagingSettingsTab } from "@/components/admin/AdminMessagingSettingsTab";
import { AdminOverviewTab } from "@/components/admin/tabs/AdminOverviewTab";
import { AdminProgramsTab } from "@/components/admin/tabs/AdminProgramsTab";
import { AdminPeopleTab } from "@/components/admin/tabs/AdminPeopleTab";
import { AdminLibraryTab } from "@/components/admin/tabs/AdminLibraryTab";
import { AdminMarketingTab } from "@/components/admin/tabs/AdminMarketingTab";
import { AdminManualEnrollModal, type EnrollModalSeed } from "@/components/admin/tabs/AdminManualEnrollModal";
import { AdminSprintTab } from "@/components/admin/AdminSprintTab";
import { TABS } from "@/components/admin/tabs/adminTypes";
import { marketingSection, resolveAdminSearch, type AdminSectionId } from "@/lib/adminNav";
import type { ProgramId } from "@shared/programs";
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
  const preview = process.env.NODE_ENV !== "production" && searchParams.get("preview") === "1";
  const resolved = resolveAdminSearch(searchParams.toString());
  const tab = resolved.tab;
  const marketingView = marketingSection(new URLSearchParams(resolved.search).get("section"));

  const setTab = (newTab: AdminSectionId) => {
    const params = new URLSearchParams();
    params.set("tab", newTab);
    if (preview) params.set("preview", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollSeed, setEnrollSeed] = useState<EnrollModalSeed | null>(null);
  const [presetPrograms, setPresetPrograms] = useState<ProgramId[] | null>(null);
  const openEnroll = (seed: EnrollModalSeed | null = null, programs: ProgramId[] | null = null) => {
    setEnrollSeed(seed);
    setPresetPrograms(programs);
    setShowEnrollModal(true);
  };
  const isAdmin = isAuthenticated && user?.role === "admin";
  const { unread, alertsOn, enableAlerts } = useInboxNewMessageAlerts(isAdmin);
  const { isSupported: pushSupported, isSubscribed: pushOn, isSubscribing, subscribeToPush } = useWebPush();
  const navItems = TABS.map((item) => (item.id === "overview" ? { ...item, badge: unread } : item));

  const openMessages = () => {
    setTab("overview");
    window.setTimeout(() => {
      const banner = document.getElementById("admin-unread-banner");
      const list = document.getElementById("admin-messages");
      (banner ?? list)?.scrollIntoView({ block: "center" });
    }, 60);
  };

  const { data: gcalStatus, refetch: refetchGcal } = trpc.googleCalendar.status.useQuery(undefined, {
    enabled: isAdmin && (tab === "people" || tab === "settings"),
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
    if (!resolved.changed) return;
    router.replace(`${pathname}?${resolved.search}`);
  }, [pathname, resolved.changed, resolved.search, router]);

  useEffect(() => {
    if (tab !== "overview" || !resolved.search.includes("focus=month")) return;
    document.getElementById("this-month")?.scrollIntoView({ block: "start" });
  }, [resolved.search, tab]);

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
    if (!loading && !isAuthenticated && !preview) {
      window.location.href = getLoginUrl();
    }
  }, [loading, isAuthenticated, preview]);

  if (loading && !preview) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.985 0.008 80)" }}>
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "oklch(0.72 0.12 75)" }}
        />
      </div>
    );
  }

  if (!preview && (!isAuthenticated || user?.role !== "admin")) {
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
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={openMessages}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
              style={{ background: unread > 0 ? "oklch(0.52 0.2 25)" : "oklch(0.96 0.025 50)", color: unread > 0 ? "white" : "oklch(0.35 0.04 50)", border: unread > 0 ? "none" : "1px solid oklch(0.90 0.015 80)" }}
            >
              Messages
              {unread > 0 ? (
                <span className="min-w-5 rounded-full bg-white px-1.5 text-center text-[11px] leading-5" style={{ color: "oklch(0.42 0.16 25)" }}>
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </button>
            {isAdmin && !alertsOn && (
              <button
                type="button"
                onClick={enableAlerts}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full"
                style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.35 0.04 50)", border: "1px solid oklch(0.90 0.015 80)" }}
              >
                <Bell size={13} />
                Allow alerts
              </button>
            )}
            {pushSupported && !pushOn && (
              <button
                type="button"
                onClick={() => void subscribeToPush()}
                disabled={isSubscribing}
                aria-busy={isSubscribing}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-70"
                style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.35 0.04 50)", border: "1px solid oklch(0.90 0.015 80)" }}
              >
                <Bell size={13} />
                {isSubscribing ? "Turning on…" : "Notify me"}
              </button>
            )}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
              >
                {user?.name?.[0] ?? "A"}
              </div>
              <span className="text-xs font-semibold hidden sm:block" style={{ color: "oklch(0.42 0.015 50)" }}>
                {user?.name ?? (preview ? "Preview" : "")}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div
        className={`container mx-auto px-4 md:px-6 lg:px-8 py-8 ${
          tab === "marketing" && marketingView === "newsletters" ? "max-w-7xl" : "max-w-6xl"
        }`}
      >
        <div className="mb-8">
          <AdminPillNav label="Admin" activeId={tab} onSelect={(id) => setTab(id as AdminSectionId)} items={navItems} />
        </div>

        {preview && (
          <p className="text-sm mb-6" style={{ color: "oklch(0.52 0.015 50)" }}>
            Preview sample. Sign in to load the live portal.
          </p>
        )}

        {tab === "overview" && (
          <>
            <AdminOverviewTab
              onEnrollLead={(lead) =>
                openEnroll({
                  name: lead.name,
                  email: lead.email,
                  phone: lead.phone,
                })
              }
            />
            <div id="this-month" className="mt-12 scroll-mt-6">
              <AdminSprintTab />
            </div>
          </>
        )}

        {tab === "people" && (
          <AdminPeopleTab gcalConnected={!!gcalStatus?.connected} onEnroll={openEnroll} preview={preview} />
        )}
        {tab === "programs" && <AdminProgramsTab onEnroll={(program) => openEnroll(null, [program])} />}
        {tab === "library" && <AdminLibraryTab />}
        {tab === "marketing" && <AdminMarketingTab />}
        {tab === "engagement" && <AdminEngagementHub />}
        {tab === "deposits" && <AdminPaymentsTab />}
        {tab === "settings" && (
          <AdminMessagingSettingsTab gcalStatus={gcalStatus} disconnectGcal={disconnectGcal} />
        )}
      </div>

      <AdminManualEnrollModal
        open={showEnrollModal}
        seed={enrollSeed}
        presetPrograms={presetPrograms}
        onOpenChange={(next) => {
          setShowEnrollModal(next);
          if (!next) {
            setEnrollSeed(null);
            setPresetPrograms(null);
          }
        }}
      />
    </div>
  );
}
