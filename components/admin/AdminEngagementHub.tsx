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
      <p className="text-gray-400 mb-8">Manage the daily habits, global challenges, and send push notifications to your users.</p>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab("updates")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "updates" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
        >
          Coach Updates & Announcements
        </button>
        <button 
          onClick={() => setActiveTab("challenges")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "challenges" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
        >
          Global Challenges
        </button>
        <button 
          onClick={() => setActiveTab("habits")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "habits" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"}`}
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
