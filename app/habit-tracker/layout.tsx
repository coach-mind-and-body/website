"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, Activity } from "lucide-react";

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
      name: "Food Tracker",
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

  return (
    <div className="min-h-screen bg-[#faf5f5]">
      {/* Main Content */}
      <div className="pb-24">
        {children}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f0e8e4] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 px-6 py-3 safe-area-pb">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname?.startsWith(item.href);
              
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center w-16 gap-1 group"
              >
                <div 
                  className={`flex items-center justify-center w-12 h-8 rounded-full transition-all duration-300 ${
                    isActive 
                      ? "bg-[#c9a96e] text-white shadow-md scale-110" 
                      : "text-[#8a9a8a] group-hover:bg-[#faf5f5] group-hover:text-[#2d3b2d]"
                  }`}
                >
                  <Icon size={isActive ? 20 : 22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span 
                  className={`text-[10px] font-bold transition-colors ${
                    isActive ? "text-[#c9a96e]" : "text-[#8a9a8a]"
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
  );
}
