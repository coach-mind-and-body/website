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

type LocalNote = {
  dateStr: string;
  note: string;
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
  const [localNotes, setLocalNotes] = useState<LocalNote[]>([]);
  
  const [currentDate, setCurrentDate] = useState(new Date()); // For week navigation
  const [selectedDate, setSelectedDate] = useState(new Date()); // For mobile view & notes

  // TRPC
  const { data: templates } = trpc.habit.getTemplates.useQuery(undefined, { enabled: !isAuthenticated });
  const { data: userSyncData, refetch: refetchUserSync } = trpc.habit.getUserHabits.useQuery(undefined, { enabled: isAuthenticated });
  
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
  
  // Initialize Local Storage if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      const storedHabits = localStorage.getItem("mbr_habits");
      const storedLogs = localStorage.getItem("mbr_habit_logs");
      const storedNotes = localStorage.getItem("mbr_daily_notes");
      
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
  const isSelectedDate = (day: Date) => isSameDay(day, selectedDate);

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
      <div className="pt-8 pb-8 px-6 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105">
            <img src="/logo-wide.jpg" alt="Mind & Body Reset" className="h-16 md:h-20 mx-auto object-contain rounded-xl shadow-sm" />
          </Link>
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
                    <div className="col-span-1 font-semibold text-sm pr-2 leading-tight" style={{ color: "#2d3b2d" }}>
                      {habit.title}
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
                    <span className={`font-semibold text-left pr-4 ${completed ? 'text-white' : 'text-[#2d3b2d]'}`}>{habit.title}</span>
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-inner ${completed ? 'bg-white/20' : 'bg-white border border-[#e8e8e8]'}`}>
                      <Check size={18} strokeWidth={completed ? 3 : 0} className={completed ? 'text-white' : 'text-transparent'} />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Daily Notes Section (Both Mobile & Desktop) */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="mt-10 pt-8 border-t" 
            style={{ borderColor: "#f0e8e4" }}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl md:text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                  Daily Notes
                </h3>
                <p className="text-sm text-gray-500 mt-1">Reflect on your day, track your wins, or jot down thoughts for {format(selectedDate, "MMM d")}.</p>
              </div>
            </div>
            
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
                disabled={saveNoteMutation.isPending || (!isAuthenticated && false)} 
                className="rounded-full px-8 py-6 shadow-md hover:shadow-lg transition-all" 
                style={{ background: "#c9a96e", color: "white" }}
              >
                {saveNoteMutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </motion.div>

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
