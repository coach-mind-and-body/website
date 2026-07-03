"use client";

import InteractiveVideoPlayer from "@/components/InteractiveVideoPlayer";

// Inside FitnessTrackerClient...
// (Wait, I can just replace the specific section. Let's look at the target file lines).
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Trash2, Dumbbell, PlayCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";

export default function FitnessTrackerClient() {
  usePageTitle({
    title: "Fitness Tracker | Mind & Body Reset",
    description: "Log your workouts and explore our video library.",
  });

  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");

  const [activeTab, setActiveTab] = useState<"log" | "videos">("log");

  const { data: logs, refetch: refetchLogs } = trpc.fitness.getLogs.useQuery(
    { dateStr },
    { enabled: isAuthenticated && activeTab === "log" }
  );

  const { data: videos } = trpc.fitness.getVideos.useQuery(undefined, {
    enabled: activeTab === "videos",
  });

  const addLogMutation = trpc.fitness.addLog.useMutation({
    onSuccess: () => {
      toast.success("Workout logged!");
      refetchLogs();
      setIsAdding(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteLogMutation = trpc.fitness.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Log deleted!");
      refetchLogs();
    },
    onError: (e) => toast.error(e.message)
  });

  const [isAdding, setIsAdding] = useState(false);
  const [exerciseName, setExerciseName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  const [weight, setWeight] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");

  const resetForm = () => {
    setExerciseName("");
    setSets("");
    setReps("");
    setWeight("");
    setDurationMinutes("");
  };

  const handleSave = () => {
    if (!exerciseName) return toast.error("Please enter an exercise name");
    addLogMutation.mutate({
      dateStr,
      exerciseName,
      sets: parseInt(sets) || 1,
      reps: parseInt(reps) || 0,
      weight: parseInt(weight) || 0,
      durationMinutes: parseInt(durationMinutes) || 0,
    });
  };

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : null;
  };

  // Group videos by category
  const videosByCategory = videos?.reduce((acc, video) => {
    if (!acc[video.category]) acc[video.category] = [];
    acc[video.category].push(video);
    return acc;
  }, {} as Record<string, typeof videos>) || {};

  return (
    <div className="min-h-screen text-gray-900 pb-20" style={{ background: "#faf5f5" }}>
      {!isAuthenticated && activeTab === "log" && (
        <div className="py-2 px-4 text-center text-sm flex items-center justify-center gap-2 relative" style={{ background: "#c9a96e", color: "white" }}>
          <Info size={16} />
          <span>You must <Link href="/login" className="underline font-bold">Sign in</Link> to log workouts.</span>
        </div>
      )}

      {/* Header */}
      <div className="pt-8 pb-4 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
          Fitness
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
        
        {/* Tabs */}
        <div className="flex bg-white rounded-full p-1 shadow-sm border" style={{ borderColor: "#f0e8e4" }}>
          <button 
            onClick={() => setActiveTab("log")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all ${activeTab === "log" ? "shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
            style={{ background: activeTab === "log" ? "#2d3b2d" : "transparent", color: activeTab === "log" ? "white" : undefined }}
          >
            <Dumbbell size={18} /> My Log
          </button>
          <button 
            onClick={() => setActiveTab("videos")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all ${activeTab === "videos" ? "shadow-md" : "text-gray-500 hover:bg-gray-50"}`}
            style={{ background: activeTab === "videos" ? "#2d3b2d" : "transparent", color: activeTab === "videos" ? "white" : undefined }}
          >
            <PlayCircle size={18} /> Video Library
          </button>
        </div>

        {/* LOG TAB */}
        {activeTab === "log" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm border" style={{ borderColor: "#f0e8e4" }}>
              <Button variant="ghost" onClick={() => setCurrentDate(subDays(currentDate, 1))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
                &larr; Prev
              </Button>
              <div className="font-bold text-lg flex items-center gap-2" style={{ color: "#2d3b2d" }}>
                <CalendarIcon size={20} style={{ color: "#c9a96e" }} />
                {isSameDay(currentDate, new Date()) ? "Today" : format(currentDate, "MMM d, yyyy")}
              </div>
              <Button variant="ghost" onClick={() => setCurrentDate(addDays(currentDate, 1))} className="rounded-full hover:opacity-80 transition-opacity" style={{ color: "#c9a96e" }}>
                Next &rarr;
              </Button>
            </div>

            {!isAdding && isAuthenticated && (
              <Button 
                onClick={() => setIsAdding(true)} 
                className="w-full rounded-2xl py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
                style={{ background: "#c9a96e", color: "white" }}
              >
                <Plus size={24} className="mr-2" /> Log Exercise
              </Button>
            )}

            <AnimatePresence>
              {isAdding && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-3xl shadow-lg border p-6 overflow-hidden" 
                  style={{ borderColor: "#f0e8e4" }}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-xl" style={{ color: "#2d3b2d" }}>Log Exercise</h3>
                    <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Exercise Name</label>
                      <input type="text" value={exerciseName} onChange={e => setExerciseName(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="e.g. Back Squat, 30 Min Run" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Sets</label>
                        <input type="number" value={sets} onChange={e => setSets(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="1" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Reps</label>
                        <input type="number" value={reps} onChange={e => setReps(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Weight (lbs/kg)</label>
                        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Duration (min)</label>
                        <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="0" />
                      </div>
                    </div>

                    <Button 
                      onClick={handleSave} 
                      disabled={addLogMutation.isPending}
                      className="w-full rounded-2xl py-6 text-lg font-bold mt-4 shadow-md"
                      style={{ background: "#2d3b2d", color: "white" }}
                    >
                      {addLogMutation.isPending ? "Saving..." : "Save Exercise"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {logs && logs.length > 0 && (
              <div className="space-y-4 mt-6">
                <h3 className="font-bold text-xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                  Today's Workout
                </h3>
                
                {logs.map(log => (
                  <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between" style={{ borderColor: "#f0e8e4" }}>
                    <div>
                      <h4 className="font-bold text-[#2d3b2d]">{log.exerciseName}</h4>
                      <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {log.sets > 0 && <span><strong>Sets:</strong> {log.sets}</span>}
                        {log.reps > 0 && <span><strong>Reps:</strong> {log.reps}</span>}
                        {log.weight > 0 && <span><strong>Weight:</strong> {log.weight}</span>}
                        {log.durationMinutes > 0 && <span><strong>Duration:</strong> {log.durationMinutes}m</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteLogMutation.mutate({ id: log.id })}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {logs?.length === 0 && !isAdding && (
               <div className="text-center py-10">
                 <Dumbbell size={48} className="mx-auto text-gray-300 mb-4" />
                 <p className="text-gray-500">No exercises logged for today.</p>
               </div>
            )}
          </motion.div>
        )}

        {/* VIDEOS TAB */}
        {activeTab === "videos" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {Object.entries(videosByCategory).map(([category, catVideos]) => (
              <div key={category} className="space-y-4">
                <h3 className="font-bold text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {catVideos.map(video => {
                    const ytId = extractYouTubeId(video.videoUrl);
                    return (
                      <div key={video.id} className="bg-white rounded-3xl overflow-hidden shadow-md border" style={{ borderColor: "#f0e8e4" }}>
                        <InteractiveVideoPlayer videoUrl={video.videoUrl} intervalsJson={video.intervalsJson} />
                        <div className="p-5">
                          <h4 className="font-bold text-lg mb-2 text-[#2d3b2d]">{video.title}</h4>
                          {video.description && (
                            <p className="text-sm text-gray-600 line-clamp-3">{video.description}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {(!videos || videos.length === 0) && (
              <div className="text-center py-12">
                <PlayCircle size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No workout videos available right now. Check back soon!</p>
              </div>
            )}
          </motion.div>
        )}

      </div>
    </div>
  );
}
