import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Check, Info, Calendar as CalendarIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "wouter";

type LocalHabit = {
  id: number;
  title: string;
  isActive: boolean;
};

type LocalLog = {
  userHabitId: number;
  dateStr: string;
  completed: boolean;
};

export default function HabitTracker() {
  usePageTitle({
    title: "Habit Tracker | Mind & Body Reset",
    description: "Track your daily habits and reclaim your wellness journey. Access anywhere with an account, or track locally on your device.",
    keywords: "habit tracker, daily habits, wellness tracker, mind body reset"
  });

  const { user, isAuthenticated } = useAuth();
  
  // Data State
  const [localHabits, setLocalHabits] = useState<LocalHabit[]>([]);
  const [localLogs, setLocalLogs] = useState<LocalLog[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // TRPC
  const { data: templates } = trpc.habit.getTemplates.useQuery(undefined, { enabled: !isAuthenticated });
  const { data: userSyncData, refetch: refetchUserSync } = trpc.habit.getUserHabits.useQuery(undefined, { enabled: isAuthenticated });
  const toggleLogMutation = trpc.habit.toggleLog.useMutation({
    onSuccess: () => refetchUserSync(),
    onError: (e) => toast.error(e.message)
  });
  
  // Initialize Local Storage if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const storedHabits = localStorage.getItem("mbr_habits");
      const storedLogs = localStorage.getItem("mbr_habit_logs");
      
      if (storedHabits) {
        setLocalHabits(JSON.parse(storedHabits));
      } else if (templates) {
        const initialHabits = templates.map(t => ({ id: t.id, title: t.title, isActive: true }));
        setLocalHabits(initialHabits);
        localStorage.setItem("mbr_habits", JSON.stringify(initialHabits));
      }

      if (storedLogs) {
        setLocalLogs(JSON.parse(storedLogs));
      }
    }
  }, [isAuthenticated, templates]);

  const activeHabits = isAuthenticated ? (userSyncData?.habits || []) : localHabits;
  const logs = isAuthenticated ? (userSyncData?.logs || []) : localLogs;

  const toggleLog = (habitId: number, dateStr: string) => {
    const isCompleted = isLogCompleted(habitId, dateStr);
    const newCompleted = !isCompleted;

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
    return logs.some(l => l.userHabitId === habitId && l.dateStr === dateStr && l.completed);
  };

  // Generate 7 days
  const days = Array.from({ length: 7 }).map((_, i) => subDays(currentDate, 3 - i));

  return (
    <div className="min-h-screen text-gray-900 pb-20" style={{ background: "#faf5f5" }}>
      {/* Banner */}
      {!isAuthenticated && (
        <div className="py-2 px-4 text-center text-sm flex items-center justify-center gap-2" style={{ background: "#c9a96e", color: "white" }}>
          <Info size={16} />
          <span>You are tracking on this device only. <Link href="/login" className="underline font-bold">Sign in</Link> to sync across all devices!</span>
        </div>
      )}

      {/* Header */}
      <div className="pt-12 pb-8 px-6 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
            My Daily Reset
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Track your habits, celebrate your wins, and build momentum. Small daily shifts lead to massive transformations.
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden p-6 md:p-8" style={{ border: "1px solid #f0e8e4" }}>
          
          {/* Date Navigator */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b" style={{ borderColor: "#f0e8e4" }}>
            <Button variant="ghost" onClick={() => setCurrentDate(subDays(currentDate, 7))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
              &larr; Prev Week
            </Button>
            <div className="font-bold text-lg flex items-center gap-2" style={{ color: "#2d3b2d" }}>
              <CalendarIcon size={20} style={{ color: "#c9a96e" }} />
              {format(days[0], "MMM d")} - {format(days[6], "MMM d, yyyy")}
            </div>
            <Button variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 7))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
              Next Week &rarr;
            </Button>
          </div>

          {/* Tracker Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <div className="col-span-1"></div>
                {days.map(day => {
                  const isToday = isSameDay(day, new Date());
                  return (
                    <div key={day.toISOString()} className="text-center">
                      <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#8a9a8a" }}>{format(day, "EEE")}</div>
                      <div className={`text-sm font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full`} style={{ background: isToday ? "#c9a96e" : "transparent", color: isToday ? "white" : "#2d3b2d" }}>
                        {format(day, "d")}
                      </div>
                    </div>
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
                    <div className="col-span-1 font-semibold text-sm pr-2 leading-tight" style={{ color: "#2d3b2d" }}>
                      {habit.title}
                    </div>
                    {days.map(day => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const completed = isLogCompleted(habit.id, dateStr);
                      return (
                        <div key={dateStr} className="flex justify-center">
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
