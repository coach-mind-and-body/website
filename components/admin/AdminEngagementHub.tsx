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
      <div className="flex flex-wrap gap-3 mb-8 border-b pb-4" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
        <button 
          onClick={() => setActiveTab("updates")}
          className="px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow"
          style={{
            background: activeTab === "updates" ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
            color: activeTab === "updates" ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
            border: activeTab === "updates" ? "none" : "1px solid oklch(0.90 0.015 80)"
          }}
        >
          Coach Updates & Announcements
        </button>
        <button 
          onClick={() => setActiveTab("challenges")}
          className="px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow"
          style={{
            background: activeTab === "challenges" ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
            color: activeTab === "challenges" ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
            border: activeTab === "challenges" ? "none" : "1px solid oklch(0.90 0.015 80)"
          }}
        >
          Global Challenges
        </button>
        <button 
          onClick={() => setActiveTab("habits")}
          className="px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow"
          style={{
            background: activeTab === "habits" ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
            color: activeTab === "habits" ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
            border: activeTab === "habits" ? "none" : "1px solid oklch(0.90 0.015 80)"
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
