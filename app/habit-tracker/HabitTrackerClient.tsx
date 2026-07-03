"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Check, Info, Calendar as CalendarIcon, Sparkles, Flame, Bell, BellRing, Target, LogOut, Settings, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, addDays, isSameDay, differenceInDays, parseISO } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";
import { useWebPush } from "@/hooks/useWebPush";
import { getDeviceId } from "@/lib/deviceId";

type LocalHabit = { id: number; title: string; description?: string | null; type: "boolean" | "numeric"; targetValue: number | null; unit: string | null; isActive: boolean; };

type LocalLog = {
  userHabitId: number;
  dateStr: string;
  completed: boolean;
  numericValue?: number | null;
};

type LocalNote = {
  dateStr: string;
  note: string;
};

export default function HabitTrackerClient() {
  usePageTitle({
    title: "Habit Tracker | Mind & Body Reset",
    description: "Track your daily habits and reclaim your wellness journey. Access anywhere with an account, or track locally on your device.",
    keywords: "habit tracker, daily habits, wellness tracker, mind body reset"
  });

  const { user, isAuthenticated, logout } = useAuth();
  const { isSupported, isSubscribed, isSubscribing, subscribeToPush } = useWebPush();
  
  // Data State
  const [localHabits, setLocalHabits] = useState<LocalHabit[]>([]);
  const [localLogs, setLocalLogs] = useState<LocalLog[]>([]);
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  
  const [isMounted, setIsMounted] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date()); // For week navigation
  const [selectedDate, setSelectedDate] = useState(new Date()); // For mobile view & notes
  const [isNotesExpanded, setIsNotesExpanded] = useState(false); // For expanding/collapsing daily notes
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);

  // TRPC
  const { data: templates } = trpc.habit.getTemplates.useQuery(undefined, { enabled: !isAuthenticated });
  const { data: userSyncData, refetch: refetchUserSync } = trpc.habit.getUserHabits.useQuery(undefined, { enabled: isAuthenticated });
  
  const { data: activeChallengesData } = trpc.challenges.getActiveChallenges.useQuery();
  const { data: userChallengesData, refetch: refetchUserChallenges } = trpc.challenges.getUserChallenges.useQuery({ deviceId: getDeviceId() });
  const { data: updatesData } = trpc.appUpdates.getUpdates.useQuery();
  
  const [dismissedUpdates, setDismissedUpdates] = useState<number[]>([]);

  const handleDismissUpdate = (id: number) => {
    const next = [...dismissedUpdates, id];
    setDismissedUpdates(next);
    localStorage.setItem('dismissedUpdates', JSON.stringify(next));
  };

  const [showDismissed, setShowDismissed] = useState(false);
  const joinChallengeMutation = trpc.challenges.joinChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge joined!");
      refetchUserChallenges();
    }
  });

  const toggleChallengeLogMutation = trpc.challenges.toggleChallengeLog.useMutation({
    onSuccess: () => refetchUserChallenges(),
    onError: (e) => toast.error(e.message)
  });

  const toggleLogMutation = trpc.habit.toggleLog.useMutation({
    onSuccess: () => refetchUserSync(),
    onError: (e) => toast.error(e.message)
  });

  const saveNoteMutation = trpc.habit.saveDailyNote.useMutation({
    onSuccess: () => {
      toast.success("Note saved!");
      refetchUserSync();
    },
    onError: (e) => toast.error(e.message)
  });

  const toggleShareHabitsMutation = trpc.habit.toggleShareHabits.useMutation({
    onSuccess: () => {
      toast.success("Privacy settings updated");
      refetchUserSync();
    },
    onError: (e) => toast.error(e.message)
  });
  
  // Initialize Local Storage and Mount
  useEffect(() => {
    setIsMounted(true);
    
    // Load dismissed updates
    try {
      const saved = localStorage.getItem('dismissedUpdates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDismissedUpdates(parsed);
      }
    } catch {}

    if (!isAuthenticated) {
      const storedHabits = localStorage.getItem("mbr_habits");
      const storedLogs = localStorage.getItem("mbr_habit_logs");
      const storedNotes = localStorage.getItem("mbr_daily_notes");
      
      if (storedHabits) {
        setLocalHabits(JSON.parse(storedHabits));
      } else if (templates) {
        const initialHabits: LocalHabit[] = templates.map(t => ({ id: t.id, title: t.title, description: t.description, type: t.type as "boolean" | "numeric", targetValue: t.targetValue, unit: t.unit, isActive: true }));
        setLocalHabits(initialHabits);
        localStorage.setItem("mbr_habits", JSON.stringify(initialHabits));
      }

      if (storedLogs) {
        setLocalLogs(JSON.parse(storedLogs));
      }

      if (storedNotes) {
        setLocalNotes(JSON.parse(storedNotes));
      }
    }
  }, [isAuthenticated, templates]);

  const activeHabits = isAuthenticated ? (userSyncData?.habits || []) : localHabits;
  const logs = isAuthenticated ? (userSyncData?.logs || []) : localLogs;
  const notes = isAuthenticated ? (userSyncData?.notes || []) : localNotes;

  const currentNoteDateStr = format(selectedDate, "yyyy-MM-dd");
  const currentNote = notes.find(n => n.dateStr === currentNoteDateStr)?.note || "";

  const [noteText, setNoteText] = useState("");

  // Sync noteText state when selectedDate changes
  useEffect(() => {
    setNoteText(currentNote);
  }, [currentNote, selectedDate]);

  const handleSaveNote = () => {
    if (isAuthenticated) {
      saveNoteMutation.mutate({ dateStr: currentNoteDateStr, note: noteText });
    } else {
      let newNotes = [...localNotes];
      const existingIdx = newNotes.findIndex(n => n.dateStr === currentNoteDateStr);
      if (existingIdx >= 0) {
        newNotes[existingIdx].note = noteText;
      } else {
        newNotes.push({ dateStr: currentNoteDateStr, note: noteText });
      }
      setLocalNotes(newNotes);
      localStorage.setItem("mbr_daily_notes", JSON.stringify(newNotes));
      toast.success("Note saved locally!");
    }
  };

  const [optimisticLogs, setOptimisticLogs] = useState<LocalLog[]>([]);

  const logNumericHabit = (habitId: number, dateStr: string, value: number, target: number) => {
    const isCompleted = value >= target;
    
    // Optimistic Update
    setOptimisticLogs(prev => {
      const existing = prev.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existing) {
        return prev.map(l => l === existing ? { ...l, completed: isCompleted, numericValue: value } : l);
      }
      return [...prev, { userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value }];
    });

    if (isAuthenticated) {
      toggleLogMutation.mutate({ userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value });
    } else {
      let newLogs = [...localLogs];
      const existingIdx = newLogs.findIndex(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existingIdx >= 0) {
        newLogs[existingIdx].completed = isCompleted;
        newLogs[existingIdx].numericValue = value;
      } else {
        newLogs.push({ userHabitId: habitId, dateStr, completed: isCompleted, numericValue: value });
      }
      setLocalLogs(newLogs);
      localStorage.setItem("mbr_habit_logs", JSON.stringify(newLogs));
    }
  };

  const toggleLog = (habitId: number, dateStr: string) => {
    const isCompleted = isLogCompleted(habitId, dateStr);
    const newCompleted = !isCompleted;

    // Optimistic Update
    setOptimisticLogs(prev => {
      const existing = prev.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existing) {
        return prev.map(l => l === existing ? { ...l, completed: newCompleted } : l);
      }
      return [...prev, { userHabitId: habitId, dateStr, completed: newCompleted }];
    });

    if (isAuthenticated) {
      toggleLogMutation.mutate({ userHabitId: habitId, dateStr, completed: newCompleted });
    } else {
      let newLogs = [...localLogs];
      const existingIdx = newLogs.findIndex(l => l.userHabitId === habitId && l.dateStr === dateStr);
      if (existingIdx >= 0) {
        newLogs[existingIdx].completed = newCompleted;
      } else {
        newLogs.push({ userHabitId: habitId, dateStr, completed: newCompleted });
      }
      setLocalLogs(newLogs);
      localStorage.setItem("mbr_habit_logs", JSON.stringify(newLogs));
    }
  };

  const isLogCompleted = (habitId: number, dateStr: string) => {
    const opt = optimisticLogs.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
    if (opt) return opt.completed;
    return logs.some(l => l.userHabitId === habitId && l.dateStr === dateStr && l.completed);
  };

  const getNumericValue = (habitId: number, dateStr: string) => {
    const opt = optimisticLogs.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
    if (opt && opt.numericValue !== undefined) return opt.numericValue;
    const existingLog = logs.find(l => l.userHabitId === habitId && l.dateStr === dateStr);
    return existingLog?.numericValue || 0;
  };

  const currentStreak = (() => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dStr = format(checkDate, "yyyy-MM-dd");
      const didAnyHabit = activeHabits.some(h => isLogCompleted(h.id, dStr));
      
      if (didAnyHabit) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        if (isSameDay(checkDate, new Date())) {
          checkDate = subDays(checkDate, 1);
          continue;
        } else {
          break;
        }
      }
    }
    return streak;
  })();

  // Generate 7 days
  const days = Array.from({ length: 7 }).map((_, i) => subDays(currentDate, 3 - i));
  const isSelectedDate = (day: Date) => isSameDay(day, selectedDate);

  const getChallengeProgress = (challengeId: number) => {
    const uc = userChallengesData?.challenges?.find(u => u.challengeId === challengeId);
    if (!uc) return 0;
    const logs = userChallengesData?.logs?.filter(l => l.userChallengeId === uc.id) || [];
    return logs.length;
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen text-gray-900 pb-20" style={{ background: "#faf5f5" }}>
      {/* Banner */}
      {!isAuthenticated && (
        <div className="py-2 px-4 text-center text-sm flex items-center justify-center gap-2 relative" style={{ background: "#c9a96e", color: "white" }}>
          <Info size={16} />
          <span>You are tracking on this device only. <Link href="/login" className="underline font-bold">Sign in</Link> to sync across all devices!</span>
        </div>
      )}

      {/* Header */}
      <div className="pt-8 pb-8 px-6 max-w-4xl mx-auto text-center relative">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <img src="/logo-new.jpg" alt="Mind & Body Reset" className="h-16 md:h-20 mx-auto object-contain rounded-xl shadow-sm" />
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            My Daily Reset
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Track your habits, celebrate your wins, and build momentum. Small daily shifts lead to massive transformations.
          </p>
          <div className="flex justify-center mt-6">
            <div className="flex items-center gap-2 px-5 py-2 rounded-full shadow-sm transition-all" style={{ background: currentStreak >= 3 ? "linear-gradient(135deg, #fff3cd 0%, #ffe69c 100%)" : "#fcfaf9", color: currentStreak >= 3 ? "#d97706" : "#8a9a8a", border: currentStreak >= 3 ? "1px solid #ffda6a" : "1px solid #f0e8e4", fontWeight: "bold" }}>
              <Flame size={20} className={currentStreak >= 3 ? "animate-pulse" : ""} style={{ fill: currentStreak >= 3 ? "#d97706" : "transparent" }} />
              {currentStreak} Day Streak
            </div>
          </div>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
        
        {/* Coach Updates Section */}
        {updatesData && updatesData.length > 0 && (
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                <Megaphone size={24} style={{ color: "#c9a96e" }} />
                Coach Updates
              </h3>
              {dismissedUpdates.length > 0 && (
                <button 
                  onClick={() => setShowDismissed(!showDismissed)}
                  className="text-sm font-medium transition-colors"
                  style={{ color: "#8a9a8a" }}
                >
                  {showDismissed ? "Hide Dismissed" : `View Dismissed (${dismissedUpdates.length})`}
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {updatesData.filter(u => showDismissed ? true : !dismissedUpdates.includes(u.id)).length === 0 && (
                <p className="text-gray-500 text-sm italic">You are all caught up on updates!</p>
              )}
              {updatesData.filter(u => showDismissed ? true : !dismissedUpdates.includes(u.id)).map(update => {
                let isYouTube = false;
                let videoId = null;
                let embedUrl = null;

                if (update.videoUrl) {
                  const ytMatch = update.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
                  if (ytMatch && ytMatch[1]) {
                    isYouTube = true;
                    videoId = ytMatch[1];
                  } else {
                    const vimeoMatch = update.videoUrl.match(/vimeo\.com\/(?:.*#|.*\/videos\/)?([0-9]+)/i);
                    if (vimeoMatch && vimeoMatch[1]) {
                      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`;
                    }
                  }
                }

                return (
                  <motion.div key={update.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-md overflow-hidden p-6 md:p-8 border relative" style={{ borderColor: "#f0e8e4", opacity: dismissedUpdates.includes(update.id) ? 0.6 : 1 }}>
                    {!dismissedUpdates.includes(update.id) && (
                      <button 
                        onClick={() => handleDismissUpdate(update.id)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                        title="Dismiss Update"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    )}
                    {dismissedUpdates.includes(update.id) && (
                      <div className="absolute top-4 right-4 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Dismissed
                      </div>
                    )}
                    <div className="text-xs font-bold px-2 py-1 rounded-full mb-3 inline-block" style={{ background: "#f0e8e4", color: "#8a9a8a" }}>
                      {format(new Date(update.createdAt), "MMMM d, yyyy")}
                    </div>
                    <h4 className="font-bold text-2xl mb-3" style={{ color: "#2d3b2d" }}>{update.title}</h4>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed mb-6">{update.message}</p>
                    
                    {isYouTube && videoId && (
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm bg-black" style={{ paddingTop: '56.25%' }}>
                        <iframe 
                          src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=0`} 
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {!isYouTube && embedUrl && (
                      <div className="relative w-full rounded-2xl overflow-hidden shadow-sm" style={{ paddingTop: '56.25%' }}>
                        <iframe 
                          src={embedUrl} 
                          className="absolute top-0 left-0 w-full h-full"
                          frameBorder="0" 
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Challenges Section */}
        {activeChallengesData && activeChallengesData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 md:p-8" style={{ border: "1px solid #f0e8e4" }}>
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
              <Target size={24} style={{ color: "#c9a96e" }} />
              Active Challenges
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChallengesData.map(challenge => {
                const uc = userChallengesData?.challenges?.find(u => u.challengeId === challenge.id);
                const progress = uc ? getChallengeProgress(challenge.id) : 0;
                const isJoined = !!uc;
                const percent = isJoined && progress !== null ? Math.min(100, Math.round((progress / challenge.durationDays) * 100)) : 0;
                
                const todayStr = format(new Date(), "yyyy-MM-dd");
                const logs = userChallengesData?.logs?.filter(l => l.userChallengeId === uc?.id) || [];
                const isCompletedToday = logs.some(l => l.dateStr === todayStr);

                return (
                  <div key={challenge.id} className="p-5 rounded-2xl border transition-all" style={{ background: isJoined ? "#faf5f5" : "white", borderColor: "#f0e8e4" }}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>{challenge.title}</h4>
                      {!isJoined ? (
                        <Button 
                          size="sm" 
                          onClick={() => joinChallengeMutation.mutate({ challengeId: challenge.id, deviceId: getDeviceId() })}
                          disabled={joinChallengeMutation.isPending}
                          className="rounded-full h-8" style={{ background: "#c9a96e", color: "white" }}>
                          <Plus size={16} className="mr-1" /> Join
                        </Button>
                      ) : (
                        <div className="text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1" style={{ background: isCompletedToday ? "#d4ecd4" : "#f0e8e4", color: isCompletedToday ? "#2d5a2d" : "#8a9a8a" }}>
                          {isCompletedToday ? <><Check size={12} /> Done Today</> : "Joined"}
                        </div>
                      )}
                    </div>
                    {challenge.description && <p className="text-sm text-gray-500 mb-4">{challenge.description}</p>}
                    
                    {isJoined && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-bold mb-1" style={{ color: "#8a9a8a" }}>
                            <span>{progress} of {challenge.durationDays} Days Completed</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "#f0e8e4" }}>
                            <div className="h-full transition-all duration-1000" style={{ width: `${percent}%`, background: "#c9a96e" }} />
                          </div>
                        </div>
                        
                        <Button
                          className="w-full rounded-xl font-bold border-2"
                          variant={isCompletedToday ? "outline" : "default"}
                          disabled={toggleChallengeLogMutation.isPending}
                          style={{
                            background: isCompletedToday ? "transparent" : "#c9a96e",
                            color: isCompletedToday ? "#c9a96e" : "white",
                            borderColor: "#c9a96e"
                          }}
                          onClick={() => toggleChallengeLogMutation.mutate({
                            userChallengeId: uc.id,
                            dateStr: todayStr,
                            completed: !isCompletedToday
                          })}
                        >
                          {isCompletedToday ? "Completed for Today!" : "Complete for Today"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Main Tracker Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 md:p-8" style={{ border: "1px solid #f0e8e4" }}>
          
          {/* Date Navigator */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b" style={{ borderColor: "#f0e8e4" }}>
            <Button variant="ghost" onClick={() => setCurrentDate(subDays(currentDate, 7))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
              &larr; <span className="hidden md:inline ml-1">Prev Week</span>
            </Button>
            <div className="font-bold text-lg md:text-xl flex items-center gap-2" style={{ color: "#2d3b2d" }}>
              <CalendarIcon size={20} style={{ color: "#c9a96e" }} />
              {format(days[0], "MMM d")} - {format(days[6], "MMM d, yyyy")}
            </div>
            <Button variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
              <span className="hidden md:inline mr-1">Next Week</span> &rarr;
            </Button>
          </div>

          {/* Desktop Weekly Grid View */}
          <div className="hidden md:block overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="col-span-1"></div>
                {days.map(day => {
                  const isToday = isSameDay(day, new Date());
                  const isSelected = isSelectedDate(day);
                  return (
                    <button 
                      key={day.toISOString()} 
                      onClick={() => setSelectedDate(day)}
                      className={`text-center py-2 px-1 rounded-xl transition-colors active:scale-95 ${isSelected ? 'shadow-sm' : 'hover:bg-gray-50'}`}
                      style={{ background: isSelected ? "#fcfaf9" : "transparent", border: isSelected ? "1px solid #f0e8e4" : "1px solid transparent" }}
                    >
                      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8a9a8a" }}>{format(day, "EEE")}</div>
                      <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full`} style={{ background: isToday ? "#c9a96e" : "transparent", color: isToday ? "white" : "#2d3b2d" }}>
                        {format(day, "d")}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Habits Rows */}
              <div className="space-y-4">
                {activeHabits.map((habit, index) => (
                  <motion.div 
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="grid grid-cols-8 gap-2 items-center p-2 rounded-2xl transition-colors"
                    style={{ background: "#faf5f5" }}
                  >
                    <div className="col-span-1 pr-2">
                      <div className="font-semibold text-sm leading-tight" style={{ color: "#2d3b2d" }}>
                        {habit.title}
                      </div>
                      {habit.description && (
                        <p className="text-xs font-normal text-gray-500 mt-1 leading-snug">{habit.description}</p>
                      )}
                    </div>
                    {days.map(day => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const completed = isLogCompleted(habit.id, dateStr);
                      const isSelected = isSelectedDate(day);
                      return (
                        <div key={dateStr} className={`flex justify-center rounded-xl py-1 ${isSelected ? 'bg-white/50 shadow-sm' : ''}`}>
                          <button
                            onClick={() => toggleLog(habit.id, dateStr)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                              completed 
                                ? 'text-white shadow-md scale-110' 
                                : 'bg-white text-transparent hover:scale-105'
                            }`}
                            style={{ 
                              background: completed ? "linear-gradient(135deg, #c9a96e 0%, #e8c99a 100%)" : "white",
                              border: completed ? "none" : "2px solid #f0e8e4"
                            }}
                          >
                            <Check size={20} strokeWidth={completed ? 3 : 2} className={completed ? 'opacity-100' : 'opacity-0'} />
                          </button>
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Daily List View */}
          <div className="md:hidden">
            {/* Horizontal scroll for days */}
            <div className="flex overflow-x-auto gap-2 mb-6 pb-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
              {days.map(day => {
                const isSelected = isSelectedDate(day);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-w-[64px] snap-center p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 ${isSelected ? 'shadow-md scale-105' : 'opacity-70 hover:opacity-100'}`}
                    style={{ background: isSelected ? "#faf5f5" : "transparent", border: isSelected ? "1px solid #f0e8e4" : "1px solid transparent" }}
                  >
                    <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isSelected ? 'text-[#c9a96e]' : 'text-[#8a9a8a]'}`}>
                      {format(day, "EEE")}
                    </div>
                    <div className={`text-sm font-bold w-10 h-10 flex items-center justify-center rounded-full shadow-sm`} style={{ background: isToday ? "#c9a96e" : (isSelected ? "white" : "transparent"), color: isToday ? "white" : "#2d3b2d" }}>
                      {format(day, "d")}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Vertical habits list for selected date */}
            <div className="space-y-3">
              <h3 className="font-bold text-lg mb-4 text-center" style={{ color: "#2d3b2d" }}>
                Habits for {format(selectedDate, "MMM d")}
              </h3>
              {activeHabits.map((habit, index) => {
                const completed = isLogCompleted(habit.id, currentNoteDateStr);
                
                if (habit.type === "numeric") {
                  const val = getNumericValue(habit.id, currentNoteDateStr) || 0;
                  const target = habit.targetValue || 100;
                  const pct = Math.min(100, Math.round((val / target) * 100));
                  return (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="w-full flex flex-col p-5 rounded-2xl shadow-sm transition-all"
                      style={{ background: completed ? "linear-gradient(135deg, #c9a96e 0%, #e8c99a 100%)" : "#faf5f5", border: completed ? "none" : "1px solid #f0e8e4" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 text-left pr-4">
                          <div className={`font-semibold ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.title}</div>
                          {habit.description && (
                            <div className={`text-xs mt-1 ${completed ? 'text-white/80' : 'text-gray-500'}`}>{habit.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number"
                            min={0}
                            value={val || ""}
                            onChange={(e) => logNumericHabit(habit.id, currentNoteDateStr, parseInt(e.target.value) || 0, target)}
                            className="w-16 h-8 text-center rounded-lg border focus:outline-none focus:ring-1 bg-white text-black"
                            style={{ borderColor: "#e8e8e8", outline: "none" }}
                          />
                          <span className={`text-sm font-bold ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.unit || ""}</span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full overflow-hidden mt-1" style={{ background: completed ? "rgba(255,255,255,0.3)" : "#e8e8e8" }}>
                        <div className="h-full transition-all" style={{ width: `${pct}%`, background: completed ? "white" : "#c9a96e" }} />
                      </div>
                      <div className={`text-xs text-right mt-1 font-bold ${completed ? 'text-white' : 'text-gray-500'}`}>
                        {val} / {target} {habit.unit || ""}
                      </div>
                    </motion.div>
                  )
                }

                return (
                  <motion.button
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => toggleLog(habit.id, currentNoteDateStr)}
                    className="w-full flex items-center justify-between p-5 rounded-2xl shadow-sm transition-all active:scale-95"
                    style={{ background: completed ? "linear-gradient(135deg, #c9a96e 0%, #e8c99a 100%)" : "#faf5f5", border: completed ? "none" : "1px solid #f0e8e4" }}
                  >
                    <div className="flex-1 text-left pr-4">
                      <div className={`font-semibold ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.title}</div>
                      {habit.description && (
                        <div className={`text-xs mt-1 ${completed ? 'text-white/80' : 'text-gray-500'}`}>{habit.description}</div>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner ${completed ? 'bg-white/20' : 'bg-white border border-[#e8e8e8]'}`}>
                      <Check size={18} strokeWidth={completed ? 3 : 0} className={completed ? 'text-white' : 'text-transparent'} />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Daily Notes Section (Both Mobile & Desktop) */}
          <div className="mt-8 pt-6 border-t" style={{ borderColor: "#f0e8e4" }}>
            <button 
              onClick={() => setIsNotesExpanded(!isNotesExpanded)}
              className="w-full flex items-center justify-between hover:bg-[#faf5f5] p-3 rounded-2xl transition-colors"
            >
              <div className="text-left">
                <h3 className="font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                  Daily Notes
                </h3>
                <p className="text-sm text-gray-500 mt-1">Reflect on your day, track your wins, or jot down thoughts for {format(selectedDate, "MMM d")}.</p>
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isNotesExpanded ? 'rotate-180' : ''}`} style={{ background: "#f0e8e4", color: "#2d3b2d" }}>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            
            <AnimatePresence>
              {isNotesExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 px-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="How are you feeling today?"
                      className="w-full h-32 md:h-40 p-5 rounded-2xl border focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 transition-all resize-none shadow-inner text-base"
                      style={{ borderColor: "#f0e8e4", background: "#fcfaf9", color: "#2d3b2d" }}
                    />
                    <div className="mt-4 flex justify-end">
                      <Button 
                        onClick={handleSaveNote} 
                        disabled={saveNoteMutation.isPending} 
                        className="rounded-full px-8 py-6 shadow-md hover:shadow-lg transition-all" 
                        style={{ background: "#c9a96e", color: "white" }}
                      >
                        {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Account & Preferences Section */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "#f0e8e4" }}>
            <button 
              onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
              className="w-full flex items-center justify-between hover:bg-[#faf5f5] p-3 rounded-2xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings size={20} style={{ color: "#c9a96e" }} />
                <h3 className="font-bold text-lg" style={{ color: "#2d3b2d" }}>
                  Account & Settings
                </h3>
              </div>
              <div className={`transition-transform duration-300 ${isSettingsExpanded ? 'rotate-180' : ''}`} style={{ color: "#8a9a8a" }}>
                <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L7 7L13 1"/></svg>
              </div>
            </button>
            
            <AnimatePresence>
              {isSettingsExpanded && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 px-3 pb-2 space-y-4">
                    
                    {/* Push Notifications Toggle */}
                    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#f0e8e4", background: "#fcfaf9" }}>
                      <div className="flex items-center gap-3">
                        {isSubscribed ? <BellRing size={20} style={{ color: "#c9a96e" }} /> : <Bell size={20} style={{ color: "#8a9a8a" }} />}
                        <div>
                          <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>Challenge Notifications</p>
                          <p className="text-xs text-gray-500">Get notified instantly when a new challenge drops.</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        variant={isSubscribed ? "outline" : "default"}
                        disabled={isSubscribed || isSubscribing || !isSupported}
                        onClick={subscribeToPush}
                        className="rounded-full"
                        style={!isSubscribed ? { background: "#c9a96e", color: "white" } : { borderColor: "#c9a96e", color: "#c9a96e" }}
                      >
                        {isSubscribed ? "Enabled" : "Enable"}
                      </Button>
                    </div>

                    {/* Share Habits Toggle */}
                    {isAuthenticated && (
                      <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#f0e8e4", background: "#fcfaf9" }}>
                        <div className="flex items-center gap-3">
                          <Target size={20} style={{ color: "#c9a96e" }} />
                          <div>
                            <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>Coach Accountability</p>
                            <p className="text-xs text-gray-500">Allow coaches to view your progress and notes.</p>
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          variant={userSyncData?.shareHabitsWithCoach ? "default" : "outline"}
                          disabled={toggleShareHabitsMutation.isPending}
                          onClick={() => toggleShareHabitsMutation.mutate({ share: !userSyncData?.shareHabitsWithCoach })}
                          className="rounded-full"
                          style={userSyncData?.shareHabitsWithCoach ? { background: "#c9a96e", color: "white" } : { borderColor: "#c9a96e", color: "#c9a96e" }}
                        >
                          {userSyncData?.shareHabitsWithCoach ? "Shared" : "Private"}
                        </Button>
                      </div>
                    )}

                    {/* Account Sync */}
                    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ borderColor: "#f0e8e4", background: "#fcfaf9" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                          {user?.email ? <span className="font-bold text-gray-600">{user.email.charAt(0).toUpperCase()}</span> : <span className="text-gray-400">?</span>}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>{isAuthenticated ? "Cloud Sync Active" : "Local Device Only"}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-xs">{isAuthenticated ? user?.email : "Sign in to sync across devices"}</p>
                        </div>
                      </div>
                      {isAuthenticated ? (
                        <Button size="sm" variant="ghost" onClick={logout} className="text-gray-500 hover:text-red-500">
                          <LogOut size={16} className="mr-1" /> Sign Out
                        </Button>
                      ) : (
                        <Link href="/login">
                          <Button size="sm" className="rounded-full" style={{ background: "#2d3b2d", color: "white" }}>Sign In</Button>
                        </Link>
                      )}
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-20 max-w-3xl mx-auto text-center px-4">
        <div className="rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fbeee9 0%, #faf5f5 100%)", border: "1px solid #f0e8e4" }}>
          <div className="absolute top-0 right-0 p-8 opacity-20" style={{ color: "#c9a96e" }}>
            <Sparkles size={120} />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            Ready for a Deeper Reset?
          </h2>
          <p className="mb-8 max-w-xl mx-auto text-lg relative z-10" style={{ color: "#5a6b5a" }}>
            Habits are just the beginning. Book a free discovery call to uncover what's really holding you back and learn how to rewire your mind for lasting change.
          </p>
          <div className="relative z-10">
            <Link href="/book" className="inline-block rounded-full px-8 py-4 text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105" style={{ background: "#c9a96e", color: "white" }}>
              Book Free Discovery Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
