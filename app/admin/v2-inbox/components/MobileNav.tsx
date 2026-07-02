"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Phone, Star, CreditCard, MoreHorizontal } from "lucide-react";
import { useInbox } from "../InboxContext";

export function MobileNav() {
  const pathname = usePathname();
  const { setIsMobileMenuOpen } = useInbox();
  
  const isInbox = pathname === "/admin/v2-inbox" || pathname?.startsWith("/admin/v2-inbox/chat");
  const isCallHistory = pathname === "/admin/v2-inbox/call-history";
  const isReviews = pathname === "/admin/v2-inbox/reviews";
  // Assuming pay is a route or modal
  const isPay = pathname === "/admin/v2-inbox/pay";

  return (
    <div className="md:hidden border-t bg-white flex items-center justify-around py-2 px-1 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] pb-6 pt-3 shrink-0">
      <Link href="/admin/v2-inbox" className={`flex flex-col items-center gap-1 min-w-[56px] ${isInbox ? "text-brand-blue" : "text-slate-400 hover:text-slate-600"}`}>
        <Inbox className="w-6 h-6" />
        <span className="text-[10px] font-medium">Inbox</span>
      </Link>
      <Link href="/admin/v2-inbox/call-history" className={`flex flex-col items-center gap-1 min-w-[56px] ${isCallHistory ? "text-brand-blue" : "text-slate-400 hover:text-slate-600"}`}>
        <Phone className="w-6 h-6" />
        <span className="text-[10px] font-medium">Calls</span>
      </Link>
      <Link href="/admin/v2-inbox/reviews" className={`flex flex-col items-center gap-1 min-w-[56px] ${isReviews ? "text-brand-blue" : "text-slate-400 hover:text-slate-600"}`}>
        <Star className="w-6 h-6" />
        <span className="text-[10px] font-medium">Reviews</span>
      </Link>
      <Link href="/admin/v2-inbox/pay" className={`flex flex-col items-center gap-1 min-w-[56px] ${isPay ? "text-brand-blue" : "text-slate-400 hover:text-slate-600"}`}>
        <CreditCard className="w-6 h-6" />
        <span className="text-[10px] font-medium">Pay</span>
      </Link>
      <Link href="/admin/v2-inbox/more" className={`flex flex-col items-center gap-1 min-w-[56px] ${pathname === '/admin/v2-inbox/more' ? 'text-brand-blue' : 'text-slate-400 hover:text-slate-600'}`}>
        <MoreHorizontal className="w-6 h-6" />
        <span className="text-[10px] font-medium">More</span>
      </Link>
    </div>
  );
}
