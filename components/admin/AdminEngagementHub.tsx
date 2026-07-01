import { useState } from "react";
import AdminHabitsTab from "@/components/AdminHabitsTab";
import { AdminChallengesTab } from "@/components/admin/AdminChallengesTab";
import { AdminUpdatesTab } from "@/components/admin/AdminUpdatesTab";

export function AdminEngagementHub() {
  const [activeTab, setActiveTab] = useState<"updates" | "challenges" | "habits">("updates");

  return (
    <div>
      <h2 className="font-bold text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
        Engagement Hub
      </h2>
      <p className="mb-8" style={{ color: "oklch(0.52 0.015 50)" }}>Manage the daily habits, global challenges, and send push notifications to your users.</p>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b pb-4" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
        <button 
          onClick={() => setActiveTab("updates")}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            background: activeTab === "updates" ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
            color: activeTab === "updates" ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
          }}
        >
          Coach Updates & Announcements
        </button>
        <button 
          onClick={() => setActiveTab("challenges")}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            background: activeTab === "challenges" ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
            color: activeTab === "challenges" ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
          }}
        >
          Global Challenges
        </button>
        <button 
          onClick={() => setActiveTab("habits")}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all"
          style={{
            background: activeTab === "habits" ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
            color: activeTab === "habits" ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
          }}
        >
          Daily Habits Tracker
        </button>
      </div>

      <div>
        {activeTab === "updates" && <AdminUpdatesTab />}
        {activeTab === "challenges" && <AdminChallengesTab />}
        {activeTab === "habits" && <AdminHabitsTab />}
      </div>
    </div>
  );
}
