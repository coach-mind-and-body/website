"use client";

import { Users, BookOpen, CreditCard, Bell, Video, Cookie, Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useInbox } from "@/components/admin/messaging/InboxContext";

export function AdminOverviewTab() {
  const { setActiveChatMeta, setIsNewChatOpen } = useInbox();

  const { data: enrollments } = trpc.enrollment.adminListAllUsers.useQuery();
  const { data: leadsData } = trpc.leads.list.useQuery();
  const { data: activeConversations } = trpc.messaging.listConversations.useQuery();
  const { data: blogPosts } = trpc.blog.adminList.useQuery();
  const { data: fpuClients } = trpc.fpu.adminListCoaching.useQuery();
  const { data: snackHackLeads } = trpc.leadgen.adminListSnackHack.useQuery();
  const { data: upcomingSessions } = trpc.enrollment.adminUpcomingSessions.useQuery();

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>
            Upcoming Meetings
          </h3>
          <div className="space-y-2">
            {(upcomingSessions ?? []).map((session) => (
              <div
                key={session.id}
                className="flex items-start justify-between p-4 rounded-xl shadow-sm"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.015 80)" }}
              >
                <div>
                  <p className="font-semibold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {session.clientName}{" "}
                    <span className="text-xs font-normal" style={{ color: "oklch(0.52 0.015 50)" }}>
                      ({session.clientEmail})
                    </span>
                  </p>
                  <p className="text-xs font-bold mt-1" style={{ color: "oklch(0.72 0.12 75)" }}>
                    Session {session.sessionNumber}
                  </p>
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
            {!upcomingSessions?.length && (
              <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
                No upcoming meetings.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>
            Recent Leads
          </h3>
          <div className="space-y-2">
            {(leadsData ?? []).slice(0, 5).map((lead) => (
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
                No leads yet.
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