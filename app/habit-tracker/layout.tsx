"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, Activity } from "lucide-react";
import HabitTrackerInstallPrompt from "@/components/HabitTrackerInstallPrompt";

export default function HabitTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/habit-tracker",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      name: "Macros",
      href: "/habit-tracker/calories",
      icon: Utensils,
      exact: false,
    },
    {
      name: "Fitness",
      href: "/habit-tracker/fitness",
      icon: Activity,
      exact: false,
    },
  ];

  const isActive = (item: typeof navItems[number]) =>
    item.exact ? pathname === item.href : pathname?.startsWith(item.href);

  return (
    <>
      <style jsx global>{`
        .habit-tracker-top-nav {
          display: none;
        }
        @media (orientation: landscape) and (max-height: 600px) {
          .habit-tracker-nav {
            display: none !important;
          }
          .habit-tracker-top-nav {
            display: flex !important;
          }
          .habit-tracker-content {
            padding-top: 3.25rem !important;
            padding-bottom: 0.5rem !important;
          }
          .habit-tracker-root {
            min-height: unset !important;
          }
        }
      `}</style>
      <div className="habit-tracker-root min-h-screen bg-[#faf5f5]">
        {/* Compact top tabs for landscape */}
        <nav className="habit-tracker-top-nav fixed top-0 left-0 right-0 bg-white border-b border-[#f0e8e4] shadow-sm z-50 px-3 py-2 safe-area-pb">
          <div className="max-w-md mx-auto flex items-center justify-between gap-1">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? "bg-[#c9a96e] text-white shadow-sm"
                      : "text-[#8a9a8a] hover:bg-[#faf5f5]"
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="habit-tracker-content pb-24">
          {children}
        </div>

        <HabitTrackerInstallPrompt />

        {/* Bottom Navigation */}
        <nav className="habit-tracker-nav fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0e8e4] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 px-6 py-3 safe-area-pb">
          <div className="max-w-md mx-auto flex items-center justify-between">
            {navItems.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center w-16 gap-1 group"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                      active
                        ? "bg-[#c9a96e] text-white shadow-md scale-110"
                        : "text-[#8a9a8a] group-hover:bg-[#faf5f5] group-hover:text-[#2d3b2d]"
                    }`}
                  >
                    <Icon size={active ? 20 : 22} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  <span
                    className={`text-[10px] font-bold transition-colors ${
                      active ? "text-[#c9a96e]" : "text-[#8a9a8a]"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}