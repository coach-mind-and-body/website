"use client";

import React from "react";
import Link from "next/link";
import { Activity, FileText, Workflow, LayoutDashboard, Settings, Star, Brain } from "lucide-react";
import { useInbox } from "../InboxContext";

export default function MorePage() {
  const { setTemplatesModalOpen } = useInbox();

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-hidden md:hidden pb-20">
      <div className="flex items-center justify-center h-14 border-b shrink-0 bg-white shadow-sm sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-slate-900">More</h1>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <Link href="/admin/v2-inbox/reminders" className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium border-b">
            <Activity className="w-5 h-5 mr-3 text-slate-500" />
            Activity Feed
          </Link>
          <button onClick={() => setTemplatesModalOpen(true)} className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium border-b text-left">
            <FileText className="w-5 h-5 mr-3 text-slate-500" />
            Message Templates
          </button>
          <Link href="/admin/v2-inbox/pipeline" className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium border-b">
            <Workflow className="w-5 h-5 mr-3 text-slate-500" />
            Pipeline
          </Link>
          <Link href="/admin/v2-inbox/ai-training" className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium border-b">
            <Brain className="w-5 h-5 mr-3 text-slate-500" />
            AI Training
          </Link>
          <Link href="/admin/v2-inbox/reviews" className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium border-b">
            <Star className="w-5 h-5 mr-3 text-slate-500" />
            Reviews
          </Link>
          <Link href="/admin/v2-inbox/settings" className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium">
            <Settings className="w-5 h-5 mr-3 text-slate-500" />
            Settings
          </Link>
        </div>
        
        <div className="mt-8 bg-white rounded-xl shadow-sm border overflow-hidden">
           <Link href="/admin" className="w-full flex items-center px-4 py-4 text-slate-700 hover:bg-slate-50 font-medium">
            <LayoutDashboard className="w-5 h-5 mr-3 text-slate-500" />
            Back to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
