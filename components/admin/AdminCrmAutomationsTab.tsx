import { useState } from "react";
import ActivityFeed from "@/components/pages/crm/ActivityFeed";
import CallHistory from "@/components/pages/crm/CallHistory";
import Campaigns from "@/components/pages/crm/Campaigns";
import Sequences from "@/components/pages/crm/Sequences";
import AiTraining from "@/components/pages/crm/AiTraining";
import { Bell, Phone, Megaphone, Layers, Brain } from "lucide-react";

export default function AdminCrmAutomationsTab() {
  const [activeTab, setActiveTab] = useState<"activity" | "calls" | "campaigns" | "sequences" | "ai">("activity");

  const SUB_TABS = [
    { id: "activity", label: "Activity Feed", icon: <Bell size={16} /> },
    { id: "calls", label: "Call History", icon: <Phone size={16} /> },
    { id: "campaigns", label: "Campaigns", icon: <Megaphone size={16} /> },
    { id: "sequences", label: "Sequences", icon: <Layers size={16} /> },
    { id: "ai", label: "AI Training", icon: <Brain size={16} /> },
  ] as const;

  return (
    <div>
      <h2 className="font-bold text-3xl mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
        CRM & AI Automations
      </h2>
      <p className="mb-8" style={{ color: "oklch(0.52 0.015 50)" }}>
        Manage customer interactions, bulk message campaigns, messaging sequences, and coach bot AI training.
      </p>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-3 mb-8 border-b pb-4" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
        {SUB_TABS.map((subTab) => (
          <button 
            key={subTab.id}
            onClick={() => setActiveTab(subTab.id)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm hover:shadow"
            style={{
              background: activeTab === subTab.id ? "oklch(0.72 0.11 78)" : "oklch(0.96 0.025 50)",
              color: activeTab === subTab.id ? "oklch(1 0 0)" : "oklch(0.42 0.015 50)",
              border: activeTab === subTab.id ? "none" : "1px solid oklch(0.90 0.015 80)"
            }}
          >
            {subTab.icon}
            {subTab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6 border border-slate-100">
        {activeTab === "activity" && <ActivityFeed />}
        {activeTab === "calls" && <CallHistory />}
        {activeTab === "campaigns" && <Campaigns />}
        {activeTab === "sequences" && <Sequences />}
        {activeTab === "ai" && <AiTraining />}
      </div>
    </div>
  );
}
