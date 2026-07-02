"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import {
  Inbox, User, Users, LayoutDashboard, Clock, Phone,
  Star, Megaphone, Target, Workflow, Brain, Settings,
  MoreHorizontal, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useInbox } from "../InboxContext";
import { useInboxPollInterval } from "@/lib/useInboxPollInterval";

function NavButton({ icon: Icon, label, badge, active, href }: any) {
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && <Badge variant="secondary" className="ml-auto text-[10px] h-5 rounded-full flex shrink-0 items-center justify-center">{badge}</Badge>}
    </>
  );
  const className = `flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active ? "bg-slate-200 text-slate-900" : "text-slate-600 hover:bg-slate-100"}`;
  
  return (
    <Link href={href || "#"} className={className}>
      {content}
    </Link>
  );
}

export default function InboxSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const pollInterval = useInboxPollInterval(5000, 15000);
  const { data: conversations = [] } = trpc.messaging.listConversations.useQuery(undefined, {
    refetchInterval: pollInterval
  });

  const unreadCount = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const unassignedCount = conversations.filter(c => !c.assignedToId).length;
  const myMessagesCount = conversations.filter(c => c.assignedToId === user?.id).length;
  const { 
    isMobileMenuOpen, setIsMobileMenuOpen,
    setTemplatesModalOpen
  } = useInbox();

  const primaryLinks = (
    <div className="p-2 space-y-6">
      <div>
        <p className="px-2 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Conversations</p>
        <div className="space-y-1" onClick={() => setIsMobileMenuOpen(false)}>
          <NavButton icon={Inbox} label="Inbox" badge={unreadCount > 0 ? unreadCount.toString() : undefined} active={pathname === '/admin/v2-inbox' || pathname?.startsWith('/admin/v2-inbox/chat')} href="/admin/v2-inbox" />
          <NavButton icon={User} label="Unassigned" badge={unassignedCount > 0 ? unassignedCount.toString() : undefined} href="/admin/v2-inbox?filter=unassigned" />
          <NavButton icon={Users} label="My Messages" badge={myMessagesCount > 0 ? myMessagesCount.toString() : undefined} href="/admin/v2-inbox?filter=mine" />
          <NavButton icon={LayoutDashboard} label="Contacts" active={pathname === '/admin/v2-inbox/contacts'} href="/admin/v2-inbox/contacts" />
          <NavButton icon={Clock} label="Reminders" active={pathname === '/admin/v2-inbox/reminders'} href="/admin/v2-inbox/reminders" />
          <NavButton icon={Phone} label="Call History" active={pathname === '/admin/v2-inbox/call-history'} href="/admin/v2-inbox/call-history" />
          <NavButton icon={Megaphone} label="Campaigns" active={pathname === '/admin/v2-inbox/campaigns'} href="/admin/v2-inbox/campaigns" />
        </div>
      </div>
    </div>
  );

  const secondaryLinks = (
    <div className="p-2 space-y-6">
      <div>
        <p className="px-2 text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">More Features</p>
        <div className="space-y-1">
          <button onClick={() => setTemplatesModalOpen(true)} className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100">
             <FileText className="h-4 w-4 shrink-0" />
             <span className="flex-1 text-left truncate">Message Templates</span>
          </button>
          <NavButton icon={Star} label="Reviews" active={pathname === '/admin/v2-inbox/reviews'} href="/admin/v2-inbox/reviews" />
          <NavButton icon={Target} label="Sequences" active={pathname === '/admin/v2-inbox/sequences'} href="/admin/v2-inbox/sequences" />
          <NavButton icon={Workflow} label="Pipeline" active={pathname === '/admin/v2-inbox/pipeline'} href="/admin/v2-inbox/pipeline" />
          <NavButton icon={Brain} label="AI Training" active={pathname === '/admin/v2-inbox/ai-training'} href="/admin/v2-inbox/ai-training" />
          <NavButton icon={Settings} label="Settings" active={pathname === '/admin/v2-inbox/settings'} href="/admin/v2-inbox/settings" />
        </div>
      </div>
    </div>
  );

  const sidebarContentDesktop = (
    <>
      <Link href="/admin" className="p-4 flex items-center justify-center md:justify-start gap-2 border-b h-14 hover:bg-muted/50 transition-colors text-slate-600 hover:text-slate-900 group shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-1"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
        <span className="font-semibold text-sm">Back to Admin</span>
      </Link>
      
      <ScrollArea className="flex-1">
        {primaryLinks}
        <div className="px-4"><div className="border-t border-slate-200"></div></div>
        {secondaryLinks}
      </ScrollArea>
      
      <div className="p-4 border-t shrink-0">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={undefined} />
            <AvatarFallback>CS</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium leading-none truncate">{user?.name || "Carter Seitz"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || "info@coachmindandbody.com"}</p>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (Always visible on large screens) */}
      <div className="hidden xl:flex w-16 md:w-[220px] border-r flex-col bg-muted/20 shrink-0 h-full">
        {sidebarContentDesktop}
      </div>

      {/* Mobile Hamburger Menu (Sheet 1) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 bg-white border-r flex flex-col">
          <SheetHeader className="h-[60px] border-b flex items-center justify-between px-4 bg-white sticky top-0 z-10 shrink-0">
            <SheetTitle className="text-xl font-bold text-slate-900 text-left w-full">Messenger</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-auto pb-20 flex flex-col">
            {primaryLinks}
            <div className="px-4"><div className="border-t border-slate-200"></div></div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              {secondaryLinks}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
