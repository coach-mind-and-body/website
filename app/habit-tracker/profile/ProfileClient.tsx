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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { useWebPush } from "@/hooks/useWebPush";
import { usePageTitle } from "@/hooks/usePageTitle";
import { toast } from "sonner";

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
        {/* Account card */}
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

        {/* Notifications */}
        <section
          className="bg-white rounded-3xl p-5 shadow-sm"
          style={{ border: "1px solid #f0e8e4" }}
        >
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#8a9a8a] mb-4">
            Notifications
          </h2>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isSubscribed ? (
                <BellRing size={20} style={{ color: "#c9a96e" }} />
              ) : (
                <Bell size={20} style={{ color: "#8a9a8a" }} />
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                  Challenge Notifications
                </p>
                <p className="text-xs text-gray-500">
                  Get notified when a new challenge drops.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={isSubscribed ? "outline" : "default"}
              disabled={isSubscribed || isSubscribing || !isSupported}
              onClick={subscribeToPush}
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
        </section>

        {/* Privacy — signed-in only */}
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
                    Allow coaches to view your progress and notes.
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

        {/* Quick links */}
        <section
          className="bg-white rounded-3xl overflow-hidden shadow-sm"
          style={{ border: "1px solid #f0e8e4" }}
        >
          <h2 className="font-bold text-sm uppercase tracking-wide text-[#8a9a8a] px-5 pt-5 pb-2">
            More
          </h2>
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
