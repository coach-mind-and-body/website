"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Target,
  LogOut,
  UserRound,
  Shield,
  Headphones,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { openPackPicker } from "@/components/habit/OnboardingPackModal";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useWebPush } from "@/hooks/useWebPush";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/deviceId";

export default function ProfileClient() {
  usePageTitle({
    title: "Profile | Mind & Body Reset Coaches",
    description: "Your account, notifications, and privacy settings.",
  });

  const { user, isAuthenticated, logout } = useAuth();
  const { isSupported, isSubscribed, isSubscribing, subscribeToPush } = useWebPush();

  const { data: userSyncData, refetch: refetchUserSync } = trpc.habit.getUserHabits.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: prefs, refetch: refetchPrefs } = trpc.habit.getNotificationPrefs.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const setPrefs = trpc.habit.setNotificationPrefs.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved");
      refetchPrefs();
    },
    onError: (e) => toast.error(e.message),
  });

  const trackFunnel = trpc.habit.trackFunnelEvent.useMutation();

  const toggleShareHabitsMutation = trpc.habit.toggleShareHabits.useMutation({
    onSuccess: () => {
      toast.success("Privacy settings updated");
      refetchUserSync();
    },
    onError: (e) => toast.error(e.message),
  });

  const displayName =
    user?.name?.trim() ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "Guest";
  const initial = (displayName.charAt(0) || "?").toUpperCase();

  const togglePref = (key: keyof NonNullable<typeof prefs>, value: boolean) => {
    setPrefs.mutate({ [key]: value });
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold shadow-md"
          style={{
            background: isAuthenticated
              ? "linear-gradient(135deg, #c9a96e 0%, #2d3b2d 100%)"
              : "#f0e8e4",
            color: isAuthenticated ? "white" : "#8a9a8a",
          }}
        >
          {isAuthenticated ? initial : <UserRound size={32} />}
        </div>
        <h1
          className="text-3xl font-bold mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
        >
          {isAuthenticated ? displayName : "Your Profile"}
        </h1>
        <p className="text-sm text-gray-500">
          {isAuthenticated
            ? user?.email
            : "Sign in to sync habits across devices"}
        </p>
      </motion.div>

      <div className="space-y-4">
        <section
          className="bg-white rounded-3xl p-5 shadow-sm"
          style={{ border: "1px solid #f0e8e4" }}
        >
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#8a9a8a] mb-4">
            Account
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold"
                style={{ background: "#f0e8e4", color: "#2d3b2d" }}
              >
                {isAuthenticated ? initial : "?"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                  {isAuthenticated ? "Cloud Sync Active" : "Local Device Only"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {isAuthenticated
                    ? user?.email
                    : "Sign in to save progress everywhere"}
                </p>
              </div>
            </div>
            {isAuthenticated ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={logout}
                className="text-gray-500 hover:text-red-500 shrink-0"
              >
                <LogOut size={16} className="mr-1" /> Sign Out
              </Button>
            ) : (
              <Link href="/login?returnTo=/habit-tracker/profile">
                <Button
                  size="sm"
                  className="rounded-full shrink-0"
                  style={{ background: "#2d3b2d", color: "white" }}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Push enable */}
        <section
          className="bg-white rounded-3xl p-5 shadow-sm"
          style={{ border: "1px solid #f0e8e4" }}
        >
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#8a9a8a] mb-4">
            Push delivery
          </h2>
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <BellRing size={20} style={{ color: "#c9a96e" }} />
              ) : (
                <Bell size={20} style={{ color: "#8a9a8a" }} />
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                  Device notifications
                </p>
                <p className="text-xs text-gray-500">
                  Required for evening check-ins and challenge alerts.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isSubscribed ? "outline" : "default"}
              disabled={isSubscribed || isSubscribing || !isSupported}
              onClick={() => {
                subscribeToPush();
                trackFunnel.mutate({
                  eventType: "push_enabled",
                  deviceId: getDeviceId(),
                });
              }}
              className="rounded-full shrink-0"
              style={
                !isSubscribed
                  ? { background: "#c9a96e", color: "white" }
                  : { borderColor: "#c9a96e", color: "#c9a96e" }
              }
            >
              {!isSupported
                ? "N/A"
                : isSubscribed
                  ? "Enabled"
                  : isSubscribing
                    ? "…"
                    : "Enable"}
            </Button>
          </div>

          {isAuthenticated && prefs && (
            <div className="space-y-3 pt-2 border-t" style={{ borderColor: "#f0e8e4" }}>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8a9a8a] pt-2">
                What we can send
              </p>
              {(
                [
                  {
                    key: "eveningNudgeEnabled" as const,
                    label: "Evening habit check-in",
                    desc: "If you have habits left today",
                  },
                  {
                    key: "victoryPromptEnabled" as const,
                    label: "Victory list prompt",
                    desc: "Remind you to log 3 wins",
                  },
                  {
                    key: "challengePushEnabled" as const,
                    label: "Challenge announcements",
                    desc: "New global challenges from Lee Anne",
                  },
                  {
                    key: "day1Day3Enabled" as const,
                    label: "Getting-started tips",
                    desc: "Gentle day-3 re-engage if you go quiet",
                  },
                  {
                    key: "weeklyInsightEmailEnabled" as const,
                    label: "Weekly pattern email",
                    desc: "Optional summary (when available)",
                  },
                ] as const
              ).map((row) => (
                <div
                  key={row.key}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#2d3b2d" }}>
                      {row.label}
                    </p>
                    <p className="text-xs text-gray-500">{row.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => togglePref(row.key, !prefs[row.key])}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      prefs[row.key] ? "bg-[#c9a96e]" : "bg-gray-200"
                    }`}
                    aria-label={row.label}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        prefs[row.key] ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-gray-500">
              Sign in to customize which reminders you receive.
            </p>
          )}
        </section>

        {isAuthenticated && (
          <section
            className="bg-white rounded-3xl p-5 shadow-sm"
            style={{ border: "1px solid #f0e8e4" }}
          >
            <h2 className="font-bold text-sm uppercase tracking-wide text-[#8a9a8a] mb-4 flex items-center gap-2">
              <Shield size={14} /> Privacy
            </h2>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Target size={20} style={{ color: "#c9a96e" }} />
                <div>
                  <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                    Coach Accountability
                  </p>
                  <p className="text-xs text-gray-500">
                    Allow coaches to view habits, wins, and notes.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={userSyncData?.shareHabitsWithCoach ? "default" : "outline"}
                disabled={toggleShareHabitsMutation.isPending}
                onClick={() =>
                  toggleShareHabitsMutation.mutate({
                    share: !userSyncData?.shareHabitsWithCoach,
                  })
                }
                className="rounded-full shrink-0"
                style={
                  userSyncData?.shareHabitsWithCoach
                    ? { background: "#c9a96e", color: "white" }
                    : { borderColor: "#c9a96e", color: "#c9a96e" }
                }
              >
                {userSyncData?.shareHabitsWithCoach ? "Shared" : "Private"}
              </Button>
            </div>
          </section>
        )}

        <section
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
          style={{ border: "1px solid #f0e8e4" }}
        >
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#8a9a8a] px-5 pt-5 pb-2">
            More
          </h2>
          <Link
            href="/habit-tracker?focus=victories"
            className="flex items-center justify-between px-5 py-4 hover:bg-[#faf5f5] transition-colors border-t"
            style={{ borderColor: "#f0e8e4" }}
          >
            <span className="flex items-center gap-3 font-semibold text-sm" style={{ color: "#2d3b2d" }}>
              <Sparkles size={18} style={{ color: "#c9a96e" }} />
              Victory list
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          <button
            type="button"
            onClick={() => {
              openPackPicker();
              window.location.href = "/habit-tracker";
            }}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#faf5f5] transition-colors border-t text-left"
            style={{ borderColor: "#f0e8e4" }}
          >
            <span className="flex items-center gap-3 font-semibold text-sm" style={{ color: "#2d3b2d" }}>
              <Layers size={18} style={{ color: "#c9a96e" }} />
              Change focus pack
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </button>
          <Link
            href="/habit-tracker/podcasts"
            className="flex items-center justify-between px-5 py-4 hover:bg-[#faf5f5] transition-colors border-t"
            style={{ borderColor: "#f0e8e4" }}
          >
            <span className="flex items-center gap-3 font-semibold text-sm" style={{ color: "#2d3b2d" }}>
              <Headphones size={18} style={{ color: "#c9a96e" }} />
              Lee Anne&apos;s Podcast
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </Link>
          <a
            href="/midlife-health-podcast"
            className="flex items-center justify-between px-5 py-4 hover:bg-[#faf5f5] transition-colors border-t"
            style={{ borderColor: "#f0e8e4" }}
          >
            <span className="flex items-center gap-3 font-semibold text-sm" style={{ color: "#2d3b2d" }}>
              <ExternalLink size={18} style={{ color: "#c9a96e" }} />
              Full podcast site
            </span>
            <ChevronRight size={18} className="text-gray-400" />
          </a>
          {isAuthenticated && (
            <Link
              href="/portal"
              className="flex items-center justify-between px-5 py-4 hover:bg-[#faf5f5] transition-colors border-t"
              style={{ borderColor: "#f0e8e4" }}
            >
              <span className="flex items-center gap-3 font-semibold text-sm" style={{ color: "#2d3b2d" }}>
                <UserRound size={18} style={{ color: "#c9a96e" }} />
                Client portal
              </span>
              <ChevronRight size={18} className="text-gray-400" />
            </Link>
          )}
        </section>

        <p className="text-center text-xs text-gray-400 pt-2 pb-2">
          Mind &amp; Body Reset · Habit Tracker
        </p>
      </div>
    </div>
  );
}
