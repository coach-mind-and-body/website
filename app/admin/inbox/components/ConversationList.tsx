"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { useInbox } from "../InboxContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Phone, Bell, Plane, Instagram, Facebook, MessageCircle, Smartphone, Menu } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { useInboxPollInterval } from "@/lib/useInboxPollInterval";

function formatMessageTime(dateString: string | Date | null | undefined) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return `Yesterday`;
  return `${format(date, "MMM d")}`;
}

export default function ConversationList() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const sidebarFilter = searchParams?.get("filter");
  const activeConversationId = params?.chatId ? parseInt(params.chatId as string) : null;
  
  const { setDialerPrefill, setDialerOpen, setIsMobileMenuOpen } = useInbox();
  
  const [activeTab, setActiveTab] = useState<'new'|'open'|'closed'>('open');
  const [searchQuery, setSearchQuery] = useState("");

  const utils = trpc.useContext();
  const pollInterval = useInboxPollInterval(5000, 15000);
  const { data: conversations = [] } = trpc.messaging.listConversations.useQuery(undefined, {
    refetchInterval: pollInterval
  });



  const filteredConversations = conversations.filter((c) => {
    if (sidebarFilter === "unassigned" && c.assignedToId) return false;
    if (sidebarFilter === "mine" && c.assignedToId !== user?.id) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.userName?.toLowerCase().includes(q);
      const matchPhone = c.contactPhone?.toLowerCase().includes(q);
      const matchEmail = c.contactEmail?.toLowerCase().includes(q);
      return matchName || matchPhone || matchEmail;
    }
    if (activeTab === 'new') return c.unreadCount > 0;
    if (activeTab === 'closed') return c.status === 'closed';
    return c.status !== 'closed' && c.unreadCount === 0;
  });

  return (
    <div className={`w-full md:w-[320px] lg:w-[380px] border-r flex flex-col bg-background shrink-0 min-h-0 overflow-hidden ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
      {/* Mobile Top Header */}
      <div className="flex md:hidden items-center justify-between h-14 border-b px-4 shrink-0 bg-white sticky top-0 z-10 shadow-sm">
        <Button variant="ghost" size="icon" className="-ml-2 text-slate-700" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex items-center gap-1 font-bold text-slate-900 text-lg">
          Inbox
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="-mr-1 text-slate-400">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="p-4 border-b flex flex-col gap-4 sticky md:top-0 top-14 bg-background z-10 shrink-0">
        <div className="flex gap-2">
          <Button 
            variant={activeTab === 'new' ? "default" : "outline"} 
            className={activeTab === 'new' ? "flex-1 bg-slate-900 text-white" : "flex-1"}
            onClick={() => setActiveTab('new')}
          >
            New {conversations.filter(c => c.unreadCount > 0).length > 0 && `(${conversations.filter(c => c.unreadCount > 0).length})`}
          </Button>
          <Button 
            variant={activeTab === 'open' ? "default" : "outline"} 
            className={activeTab === 'open' ? "flex-1 bg-slate-900 text-white" : "flex-1"}
            onClick={() => setActiveTab('open')}
          >
            Open
          </Button>
          <Button 
            variant={activeTab === 'closed' ? "default" : "ghost"} 
            className={activeTab === 'closed' ? "flex-1 bg-slate-900 text-white" : "flex-1"}
            onClick={() => setActiveTab('closed')}
          >
            Closed
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search for customers" 
              className="pl-9 h-9 bg-slate-50 border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => {
            setDialerPrefill("");
            setDialerOpen(true);
          }}>
            <Phone className="h-4 w-4" />
          </Button>
        </div>
        

      </div>
      
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="divide-y">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No conversations found.
            </div>
          ) : (
            filteredConversations.map((chat) => (
            <Link 
              key={chat.id} 
              href={`/admin/v2-inbox/chat/${chat.id}`}
              className={`block p-4 cursor-pointer hover:bg-muted/50 transition-colors ${activeConversationId === chat.id ? "bg-muted" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={activeConversationId === chat.id ? "bg-slate-300" : "bg-green-500 text-white"}>
                      {(chat.userName && chat.userName !== "Unknown Customer") ? chat.userName.charAt(0).toUpperCase() : (chat.contactPhone?.[0] || "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm leading-none flex items-center gap-1">
                      {chat.userName || chat.contactPhone || chat.contactEmail}
                      {chat.isPremium && <Plane className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />}
                    </p>
                    <div className="flex items-center gap-1 mt-1 text-slate-500">
                      {chat.platform === 'instagram' ? <Instagram className="w-3 h-3 text-pink-600" /> : 
                       chat.platform === 'facebook' ? <Facebook className="w-3 h-3 text-blue-600" /> : 
                       chat.platform === 'whatsapp' ? <MessageCircle className="w-3 h-3 text-green-500" /> : 
                       <Smartphone className="w-3 h-3" />}
                      <span className="text-[10px] uppercase font-semibold">
                        {chat.platform === 'sms' ? 'SMS' : chat.platform}
                      </span>
                    </div>
                  </div>
                </div>
                <span suppressHydrationWarning className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {formatMessageTime(chat.lastMessageAt)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-2">
                {chat.lastMessagePreview || "No messages yet"}
              </p>
            </Link>
          )))}
        </div>
      </div>
    </div>
  );
}
