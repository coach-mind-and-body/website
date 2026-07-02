"use client";

import React from "react";
import { MessageSquare } from "lucide-react";

export default function InboxDefaultPage() {
  return (
    <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-slate-50/50 p-12 text-center h-full">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <MessageSquare className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Your Inbox</h3>
      <p className="text-slate-500 max-w-sm">
        Select a conversation from the left to view messages, or start a new chat.
      </p>
    </div>
  );
}
