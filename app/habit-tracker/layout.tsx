"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Utensils,
  Activity,
  Headphones,
  UserRound,
  ChefHat,
} from "lucide-react";
import HabitTrackerInstallPrompt from "@/components/HabitTrackerInstallPrompt";
import HabitPodcastMiniPlayer from "@/components/HabitPodcastMiniPlayer";
import { HabitPodcastPlayerProvider } from "@/contexts/HabitPodcastPlayerContext";
import CoachNavButton from "@/components/habit/CoachNavButton";

/** Light frosted glass with soft rose tint so it reads against the cream app */
const glassStyle = {
  background: "rgba(245, 228, 224, 0.55)",
  backdropFilter: "blur(22px) saturate(1.5)",
  WebkitBackdropFilter: "blur(22px) saturate(1.5)",
} as const;

export default function HabitTrackerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Habits",
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
      name: "Recipes",
      href: "/habit-tracker/recipes",
      icon: ChefHat,
      exact: false,
    },
    {
      name: "Fitness",
      href: "/habit-tracker/fitness",
      icon: Activity,
      exact: false,
    },
    {
      name: "Profile",
      href: "/habit-tracker/profile",
      icon: UserRound,
      exact: false,
    },
  ];

  const podcastHref = "/habit-tracker/podcasts";
  const podcastActive = pathname?.startsWith(podcastHref) ?? false;
  const coachHref = "/habit-tracker/coach";
  const coachActive = pathname?.startsWith(coachHref) ?? false;

  const isActive = (item: (typeof navItems)[number]) => {
    if (!pathname) return false;
    // Recipes hub: vault, this-week meal plan, and shop share one tab
    if (item.href === "/habit-tracker/recipes") {
      return (
        pathname.startsWith("/habit-tracker/recipes") ||
        pathname.startsWith("/habit-tracker/meal-plan") ||
        pathname.startsWith("/habit-tracker/shop")
      );
    }
    return item.exact ? pathname === item.href : pathname.startsWith(item.href);
  };

  return (
    <HabitPodcastPlayerProvider>
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
        {/* Compact top tabs for landscape — icons only */}
        <nav className="habit-tracker-top-nav fixed top-0 left-0 right-0 z-50 px-3 py-2">
          <div className="max-w-md mx-auto flex items-center gap-2">
            <div
              className="flex-1 flex items-center justify-around gap-0.5 px-2 py-1.5 rounded-full border border-white/40 shadow-[0_4px_20px_rgba(45,59,45,0.08)]"
              style={glassStyle}
            >
              {navItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.name}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center justify-center w-10 h-9 rounded-full transition-all ${
                      active
                        ? "bg-[#2d3b2d] text-white shadow-sm"
                        : "text-[#6b7a6b] hover:bg-white/40 hover:text-[#2d3b2d]"
                    }`}
                  >
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  </Link>
                );
              })}
            </div>
            <CoachNavButton active={coachActive} compact />
            <Link
              href={podcastHref}
              aria-label="Podcast"
              aria-current={podcastActive ? "page" : undefined}
              className={`flex items-center justify-center w-11 h-11 rounded-full border border-white/40 shadow-[0_4px_20px_rgba(45,59,45,0.08)] transition-all ${
                podcastActive
                  ? "bg-[#2d3b2d] text-white"
                  : "text-[#6b7a6b] hover:text-[#2d3b2d]"
              }`}
              style={podcastActive ? undefined : glassStyle}
            >
              <Headphones size={20} strokeWidth={podcastActive ? 2.5 : 2} />
            </Link>
          </div>
        </nav>

        {/* Extra bottom padding: glass nav + docked mini player when playing */}
        <div className="habit-tracker-content pb-52">{children}</div>

        <HabitTrackerInstallPrompt variant="auto" />
        <HabitPodcastMiniPlayer />

        {/* Bottom Navigation — light rose glass pill + separate podcast circle */}
        <nav
          className="habit-tracker-nav fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{
            paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
            paddingLeft: "0.75rem",
            paddingRight: "0.75rem",
          }}
        >
          <div className="pointer-events-auto w-full max-w-md flex items-center gap-2.5">
            <div
              className="flex-1 flex items-center justify-around px-1.5 py-1.5 rounded-full border border-white/45 shadow-[0_8px_32px_rgba(45,59,45,0.12)]"
              style={glassStyle}
            >
              {navItems.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.name}
                    aria-current={active ? "page" : undefined}
                    className="flex items-center justify-center flex-1 py-0.5 group"
                  >
                    <div
                      className={`flex items-center justify-center w-12 h-10 rounded-full transition-all duration-300 ${
                        active
                          ? "bg-[#2d3b2d] text-white shadow-md scale-105"
                          : "text-[#6b7a6b] group-hover:bg-white/45 group-hover:text-[#2d3b2d]"
                      }`}
                    >
                      <Icon size={22} strokeWidth={active ? 2.4 : 2} />
                    </div>
                  </Link>
                );
              })}
            </div>

            <CoachNavButton active={coachActive} />
            <Link
              href={podcastHref}
              aria-label="Podcast"
              aria-current={podcastActive ? "page" : undefined}
              className={`flex items-center justify-center w-[3.25rem] h-[3.25rem] shrink-0 rounded-full border border-white/45 shadow-[0_8px_32px_rgba(45,59,45,0.12)] transition-all duration-300 ${
                podcastActive
                  ? "bg-[#2d3b2d] text-white scale-105 shadow-md"
                  : "text-[#6b7a6b] hover:text-[#2d3b2d] hover:scale-105"
              }`}
              style={podcastActive ? undefined : glassStyle}
            >
              <Headphones size={22} strokeWidth={podcastActive ? 2.4 : 2} />
            </Link>
          </div>
        </nav>
      </div>
    </HabitPodcastPlayerProvider>
  );
}
