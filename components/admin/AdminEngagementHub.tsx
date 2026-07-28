import { useState } from "react";
import AdminHabitsTab from "@/components/AdminHabitsTab";
import { AdminChallengesTab } from "@/components/admin/AdminChallengesTab";
import { AdminUpdatesTab } from "@/components/admin/AdminUpdatesTab";
import { AdminHabitCoachBoard } from "@/components/admin/AdminHabitCoachBoard";
import { AdminPodcastsTab } from "@/components/admin/AdminPodcastsTab";
import AdminVideosClient from "@/app/admin/videos/AdminVideosClient";

type Tab = "updates" | "challenges" | "habits" | "videos" | "coach" | "podcasts";

export function AdminEngagementHub() {
  const [activeTab, setActiveTab] = useState<Tab>("updates");

  const tabs: { id: Tab; label: string }[] = [
    { id: "updates", label: "Coach Updates" },
    { id: "challenges", label: "Challenges" },
    { id: "podcasts", label: "Podcasts" },
    { id: "habits", label: "Templates & Packs" },
    { id: "coach", label: "Coach Board" },
    { id: "videos", label: "Workout Videos" },
  ];

  return (
    <div>
      <h2 className="font-bold text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
        Habit Tracker
      </h2>
      <p className="mb-8" style={{ color: "oklch(0.52 0.015 50)" }}>
        Daily ritual product: challenges, templates, packs, coach visibility, and push cadence.
      </p>

      <div className="flex flex-wrap gap-3 mb-8 border-b pb-4" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow"
            style={{
              background: activeTab === t.id ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
              color: activeTab === t.id ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
              border: activeTab === t.id ? "none" : "1px solid oklch(0.90 0.015 80)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "updates" && <AdminUpdatesTab />}
        {activeTab === "challenges" && <AdminChallengesTab />}
        {activeTab === "podcasts" && <AdminPodcastsTab />}
        {activeTab === "habits" && <AdminHabitsTab />}
        {activeTab === "coach" && <AdminHabitCoachBoard />}
        {activeTab === "videos" && <AdminVideosClient />}
      </div>
    </div>
  );
}
