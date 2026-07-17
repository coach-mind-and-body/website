"use client";

import { Users, BookOpen, CreditCard, Bell, Video, Cookie, Plus, RefreshCw, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useInbox } from "@/components/admin/messaging/InboxContext";
import { toast } from "sonner";

const KIND_STYLES: Record<string, { label: string; bg: string; color: string }> = {
  discovery: {
    label: "Discovery",
    bg: "oklch(0.93 0.06 75)",
    color: "oklch(0.45 0.12 65)",
  },
  reclaim: {
    label: "RECLAIM",
    bg: "oklch(0.92 0.04 148)",
    color: "oklch(0.38 0.10 148)",
  },
  fpu: {
    label: "FPU",
    bg: "oklch(0.93 0.04 250)",
    color: "oklch(0.40 0.10 250)",
  },
  other: {
    label: "Other",
    bg: "oklch(0.94 0.01 50)",
    color: "oklch(0.45 0.02 50)",
  },
};

export function AdminOverviewTab() {
  const { setActiveChatMeta, setIsNewChatOpen } = useInbox();

  const { data: enrollments } = trpc.enrollment.adminListAllUsers.useQuery();
  const { data: leadsData } = trpc.leads.list.useQuery();
  const { data: activeConversations } = trpc.messaging.listConversations.useQuery();
  const { data: blogPosts } = trpc.blog.adminList.useQuery();
  const { data: fpuClients } = trpc.fpu.adminListCoaching.useQuery();
  const { data: snackHackLeads } = trpc.leadgen.adminListSnackHack.useQuery();

  const {
    data: calendar,
    isLoading: calLoading,
    isFetching: calFetching,
    refetch: refetchCalendar,
  } = trpc.googleCalendar.listAllEvents.useQuery(
    { daysPast: 3, daysAhead: 45 },
    {
      refetchInterval: () =>
        typeof document !== "undefined" && document.hidden ? false : 60_000,
      refetchOnWindowFocus: true,
    }
  );

  const syncNow = trpc.googleCalendar.syncNow.useMutation({
    onSuccess: () => {
      toast.success("Calendar synced into CRM");
      refetchCalendar();
    },
    onError: (e) => toast.error(e.message),
  });

  const now = Date.now();
  const allEvents = calendar?.events ?? [];
  const upcomingEvents = allEvents.filter((e) => new Date(e.startTime).getTime() >= now - 30 * 60 * 1000);
  const pastEvents = allEvents
    .filter((e) => new Date(e.startTime).getTime() < now - 30 * 60 * 1000)
    .slice(-5)
    .reverse();

  return (
    <div>
      <h2
        className="font-bold text-2xl mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        Dashboard Overview
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Active Clients", value: enrollments?.filter((e) => e.status === "active").length ?? 0, icon: <Users size={18} /> },
          { label: "FPU Clients", value: fpuClients?.length ?? 0, icon: <Video size={18} /> },
          { label: "New Leads", value: leadsData?.filter((l) => l.status === "new").length ?? 0, icon: <Bell size={18} /> },
          { label: "Snack Hack Leads", value: snackHackLeads?.length ?? 0, icon: <Cookie size={18} /> },
          { label: "Blog Posts", value: blogPosts?.length ?? 0, icon: <BookOpen size={18} /> },
          { label: "Total Enrollments", value: enrollments?.length ?? 0, icon: <CreditCard size={18} /> },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl p-5" style={{ background: "oklch(1 0 0)" }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: "oklch(0.72 0.12 75)" }}>
              {stat.icon}
            </div>
            <div
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
            >
              {stat.value}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Full Google Calendar feed */}
      <div className="mb-10">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-lg" style={{ color: "oklch(0.20 0.015 50)" }}>
              Google Calendar
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
              All timed meetings from your connected calendar (discovery, RECLAIM, FPU, and other) — last 3 days
              through next 45 days.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => syncNow.mutate()}
              disabled={syncNow.isPending || !calendar?.connected}
              className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
              title="Pull bookings into CRM contacts/leads"
            >
              <RefreshCw size={13} className={syncNow.isPending ? "animate-spin" : ""} />
              {syncNow.isPending ? "Syncing…" : "Sync to CRM"}
            </button>
            <button
              type="button"
              onClick={() => refetchCalendar()}
              disabled={calFetching}
              className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.42 0.015 50)", border: "1px solid oklch(0.90 0.015 80)" }}
            >
              <RefreshCw size={13} className={calFetching ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {!calendar?.connected && !calLoading && (
          <div
            className="p-4 rounded-xl text-sm"
            style={{ background: "oklch(0.97 0.02 80)", color: "oklch(0.40 0.02 50)" }}
          >
            Google Calendar is not connected. Connect it under{" "}
            <strong>Settings</strong> to see all meetings here and auto-import discovery bookings into CRM.
          </div>
        )}

        {calendar?.error && (
          <div
            className="p-4 rounded-xl text-sm mb-3"
            style={{ background: "oklch(0.95 0.04 25)", color: "oklch(0.45 0.12 25)" }}
          >
            {calendar.error}
          </div>
        )}

        {calLoading && (
          <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            Loading calendar…
          </p>
        )}

        {calendar?.connected && !calLoading && (
          <div className="space-y-2">
            {upcomingEvents.length === 0 && (
              <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
                No upcoming timed meetings in the next 45 days.
              </p>
            )}
            {upcomingEvents.map((event) => {
              const kind = KIND_STYLES[event.kind] ?? KIND_STYLES.other;
              const primaryGuest = event.guests[0];
              return (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-4 rounded-xl shadow-sm"
                  style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className="text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full"
                        style={{ background: kind.bg, color: kind.color }}
                      >
                        {kind.label}
                      </span>
                      <p className="font-semibold text-sm truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                        {event.summary}
                      </p>
                    </div>
                    <p className="text-xs font-bold" style={{ color: "oklch(0.72 0.12 75)" }}>
                      {new Date(event.startTime).toLocaleString("en-US", {
                        timeZone: "America/Denver",
                        dateStyle: "full",
                        timeStyle: "short",
                      })}{" "}
                      MT
                    </p>
                    {primaryGuest && (
                      <p className="text-xs mt-1" style={{ color: "oklch(0.42 0.015 50)" }}>
                        {primaryGuest.name ? `${primaryGuest.name} · ` : ""}
                        <a href={`mailto:${primaryGuest.email}`} className="underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                          {primaryGuest.email}
                        </a>
                        {event.guests.length > 1 ? ` +${event.guests.length - 1} more` : ""}
                      </p>
                    )}
                    {event.phone && (
                      <p className="text-xs mt-0.5" style={{ color: "oklch(0.42 0.015 50)" }}>
                        Phone:{" "}
                        <a href={`tel:${event.phone.replace(/\D/g, "")}`} className="underline">
                          {event.phone}
                        </a>
                      </p>
                    )}
                    {!primaryGuest && (
                      <p className="text-xs mt-1 italic" style={{ color: "oklch(0.55 0.015 50)" }}>
                        No guest email on this event
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {event.meetLink && (
                      <a
                        href={event.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                        style={{ background: "oklch(0.72 0.12 75)" }}
                      >
                        Join Meet
                      </a>
                    )}
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                        style={{
                          background: "oklch(0.96 0.025 50)",
                          color: "oklch(0.42 0.015 50)",
                          border: "1px solid oklch(0.90 0.015 80)",
                        }}
                        title="Open in Google Calendar"
                      >
                        <ExternalLink size={12} /> GCal
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {pastEvents.length > 0 && (
              <div className="pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "oklch(0.55 0.015 50)" }}>
                  Recently past
                </h4>
                <div className="space-y-2 opacity-80">
                  {pastEvents.map((event) => {
                    const kind = KIND_STYLES[event.kind] ?? KIND_STYLES.other;
                    const primaryGuest = event.guests[0];
                    return (
                      <div
                        key={event.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-xl"
                        style={{ background: "oklch(0.98 0.005 50)", border: "1px solid oklch(0.92 0.01 80)" }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: kind.bg, color: kind.color }}
                            >
                              {kind.label}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: "oklch(0.35 0.015 50)" }}>
                              {event.summary}
                            </span>
                          </div>
                          <p className="text-[11px] mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                            {new Date(event.startTime).toLocaleString("en-US", {
                              timeZone: "America/Denver",
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                            {primaryGuest ? ` · ${primaryGuest.name || primaryGuest.email}` : ""}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>
            Recent Leads (CRM)
          </h3>
          <div className="space-y-2">
            {(leadsData ?? []).slice(0, 8).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-4 rounded-xl shadow-sm"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {lead.name}
                  </p>
                  <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {lead.email}
                    {lead.phone ? ` · ${lead.phone}` : ""}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-bold"
                  style={{
                    background: lead.status === "new" ? "oklch(0.92 0.04 148)" : "oklch(0.93 0.06 75)",
                    color: lead.status === "new" ? "oklch(0.38 0.10 148)" : "oklch(0.45 0.12 65)",
                  }}
                >
                  {lead.status}
                </span>
              </div>
            ))}
            {!leadsData?.length && (
              <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
                No leads yet. Discovery bookings from Google Calendar will appear here after sync.
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg" style={{ color: "oklch(0.20 0.015 50)" }}>
              Recent Messages
            </h3>
            <button
              onClick={() => setIsNewChatOpen(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-transform hover:-translate-y-0.5 flex items-center gap-1"
              style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
            >
              <Plus size={14} /> New
            </button>
          </div>
          <div className="space-y-2">
            {(activeConversations ?? []).slice(0, 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() =>
                  setActiveChatMeta({
                    conversationId: conv.id,
                    userId: conv.userId,
                    contactPhone: conv.contactPhone,
                    userName: conv.userName || conv.contactPhone,
                  })
                }
                className="w-full flex items-center justify-between p-4 rounded-xl shadow-sm text-left hover:-translate-y-0.5 transition-transform"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}
              >
                <div className="min-w-0 flex-1 pr-4">
                  <p className="font-semibold text-sm truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {conv.userName || conv.contactPhone}
                  </p>
                  <p className="text-xs truncate" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {conv.lastMessagePreview || "No messages"}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span
                    className="shrink-0 text-xs px-2 py-1 rounded-full font-bold"
                    style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                  >
                    {conv.unreadCount} new
                  </span>
                )}
              </button>
            ))}
            {!activeConversations?.length && (
              <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
                No recent messages.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
