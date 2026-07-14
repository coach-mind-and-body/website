"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, Trash2, Camera, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { usePageTitle } from "@/hooks/usePageTitle";
import Link from "next/link";

export default function CalorieTrackerClient() {
  usePageTitle({
    title: "Calorie Tracker | Mind & Body Reset",
    description: "Track your meals and macros easily.",
  });

  const { isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const utils = trpc.useUtils();

  const { data: logs, refetch } = trpc.calories.getLogs.useQuery(
    { dateStr },
    { enabled: isAuthenticated }
  );

  const addLogMutation = trpc.calories.addLog.useMutation({
    onSuccess: () => {
      toast.success("Meal logged!");
      refetch();
      utils.habit.getUserHabits.invalidate();
      setIsAdding(false);
      resetForm();
    },
    onError: (e) => toast.error(e.message)
  });

  const deleteLogMutation = trpc.calories.deleteLog.useMutation({
    onSuccess: () => {
      toast.success("Log deleted!");
      refetch();
      utils.habit.getUserHabits.invalidate();
    },
    onError: (e) => toast.error(e.message)
  });

  const analyzeImageMutation = trpc.calories.analyzeFoodImage.useMutation({
    onSuccess: (data) => {
      setFoodName(data.foodName);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFat(data.fat.toString());
      setFiber(data.fiber.toString());
      toast.success("AI estimated macros successfully!");
    },
    onError: (e) => toast.error(e.message)
  });

  const analyzeTextMutation = trpc.calories.analyzeFoodText.useMutation({
    onSuccess: (data) => {
      setFoodName(data.foodName);
      setCalories(data.calories.toString());
      setProtein(data.protein.toString());
      setCarbs(data.carbs.toString());
      setFat(data.fat.toString());
      setFiber(data.fiber.toString());
      toast.success("AI estimated macros successfully!");
    },
    onError: (e) => toast.error(e.message)
  });

  const [isAdding, setIsAdding] = useState(false);
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack" | "drink">("snack");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [userHint, setUserHint] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFoodName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setUserHint("");
  };

  const handleSave = () => {
    if (!foodName) return toast.error("Please enter a food name");
    addLogMutation.mutate({
      dateStr,
      mealType,
      foodName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      carbs: parseInt(carbs) || 0,
      fat: parseInt(fat) || 0,
      fiber: parseInt(fiber) || 0,
    });
  };

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      toast.info("Analyzing image...");
      analyzeImageMutation.mutate({ imageBase64: base64, userHint });
    };
    reader.readAsDataURL(file);
  };

  const totalCalories = logs?.reduce((acc, log) => acc + log.calories, 0) || 0;
  const totalProtein = logs?.reduce((acc, log) => acc + log.protein, 0) || 0;
  const totalCarbs = logs?.reduce((acc, log) => acc + log.carbs, 0) || 0;
  const totalFat = logs?.reduce((acc, log) => acc + log.fat, 0) || 0;
  const totalFiber = logs?.reduce((acc, log) => acc + log.fiber, 0) || 0;

  return (
    <div className="min-h-screen text-gray-900 pb-20" style={{ background: "#faf5f5" }}>
      {!isAuthenticated && (
        <div className="py-2 px-4 text-center text-sm flex items-center justify-center gap-2 relative" style={{ background: "#c9a96e", color: "white" }}>
          <Info size={16} />
          <span>You must <Link href="/login?returnTo=/habit-tracker/calories" className="underline font-bold">Sign in</Link> to use the Calorie Tracker.</span>
        </div>
      )}

      {/* Header */}
      <div className="pt-8 pb-4 px-6 max-w-4xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
          Nutrition Tracker
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 space-y-6">
        
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

        {/* Macros Summary */}
        <div className="bg-white rounded-3xl shadow-md p-6 border relative overflow-hidden" style={{ borderColor: "#f0e8e4" }}>
          <div className="absolute top-0 left-0 w-full h-2" style={{ background: "linear-gradient(90deg, #c9a96e 0%, #e8c99a 100%)" }} />
          <h3 className="text-center text-gray-500 font-semibold mb-6">Daily Summary</h3>
          
          <div className="flex justify-center items-center mb-8">
            <div className="w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center shadow-inner" style={{ borderColor: "#fcfaf9" }}>
              <span className="text-3xl font-bold" style={{ color: "#2d3b2d" }}>{totalCalories}</span>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kcal</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-blue-50 p-2 md:p-3 rounded-2xl">
              <div className="text-lg md:text-xl font-bold text-blue-700">{totalProtein}g</div>
              <div className="text-[10px] md:text-xs font-bold text-blue-400 uppercase">Protein</div>
            </div>
            <div className="bg-orange-50 p-2 md:p-3 rounded-2xl">
              <div className="text-lg md:text-xl font-bold text-orange-700">{totalCarbs}g</div>
              <div className="text-[10px] md:text-xs font-bold text-orange-400 uppercase">Carbs</div>
            </div>
            <div className="bg-yellow-50 p-2 md:p-3 rounded-2xl">
              <div className="text-lg md:text-xl font-bold text-yellow-700">{totalFat}g</div>
              <div className="text-[10px] md:text-xs font-bold text-yellow-500 uppercase">Fat</div>
            </div>
            <div className="bg-green-50 p-2 md:p-3 rounded-2xl">
              <div className="text-lg md:text-xl font-bold text-green-700">{totalFiber}g</div>
              <div className="text-[10px] md:text-xs font-bold text-green-500 uppercase">Fiber</div>
            </div>
          </div>
        </div>

        {/* Add Meal Button */}
        {!isAdding && isAuthenticated && (
          <Button 
            onClick={() => setIsAdding(true)} 
            className="w-full rounded-2xl py-6 text-lg font-bold shadow-md hover:shadow-lg transition-all"
            style={{ background: "#c9a96e", color: "white" }}
          >
            <Plus size={24} className="mr-2" /> Log Food/Drink
          </Button>
        )}

        {/* Add Meal Form */}
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
                <h3 className="font-bold text-xl" style={{ color: "#2d3b2d" }}>Log Food/Drink</h3>
                <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-gray-600">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* AI Snap Section */}
              <div className="mb-6 p-4 rounded-2xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center gap-3" style={{ borderColor: "#e8c99a" }}>
                <p className="text-sm font-semibold text-gray-600 text-center">AI Auto-Log</p>
                <input 
                  type="text" 
                  placeholder="Optional hint: '1 cup of rice'" 
                  value={userHint} 
                  onChange={(e) => setUserHint(e.target.value)}
                  className="w-full max-w-sm p-2 rounded-xl border text-sm text-center focus:outline-none focus:ring-1 focus:ring-[#c9a96e]"
                />
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleImageCapture} />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzeImageMutation.isPending}
                  className="rounded-full shadow-sm"
                  style={{ background: "#2d3b2d", color: "white" }}
                >
                  {analyzeImageMutation.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <Camera size={18} className="mr-2" />}
                  Snap & Analyze
                </Button>
                <p className="text-xs text-gray-400 text-center">Snap a pic of your food, and AI will estimate the macros. You can tweak them before saving!</p>
              </div>

              {/* Manual Form */}
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {(["breakfast", "lunch", "dinner", "snack", "drink"] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setMealType(type)}
                      className={`py-2 px-3 rounded-xl text-sm font-bold capitalize transition-colors flex-1 min-w-[30%] ${mealType === type ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                      style={{ background: mealType === type ? "#c9a96e" : undefined }}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Food/Drink Name</label>
                    <button 
                      onClick={() => {
                        if (!foodName) {
                          toast.error("Please enter a food name to estimate");
                          return;
                        }
                        analyzeTextMutation.mutate({ foodName });
                      }}
                      disabled={analyzeTextMutation.isPending || !foodName}
                      className="text-xs font-bold text-[#c9a96e] hover:opacity-80 transition-opacity flex items-center gap-1 disabled:opacity-50"
                    >
                      {analyzeTextMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : "✨"} Auto-fill Macros
                    </button>
                  </div>
                  <input type="text" value={foodName} onChange={e => setFoodName(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="e.g. Grilled Chicken Salad" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Calories</label>
                    <input type="number" value={calories} onChange={e => setCalories(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-[#c9a96e]" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-400 uppercase mb-1 block">Protein (g)</label>
                    <input type="number" value={protein} onChange={e => setProtein(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-400" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-orange-400 uppercase mb-1 block">Carbs (g)</label>
                    <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-yellow-500 uppercase mb-1 block">Fat (g)</label>
                    <input type="number" value={fat} onChange={e => setFat(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-yellow-500" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-500 uppercase mb-1 block">Fiber (g)</label>
                    <input type="number" value={fiber} onChange={e => setFiber(e.target.value)} className="w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="0" />
                  </div>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={addLogMutation.isPending}
                  className="w-full rounded-2xl py-6 text-lg font-bold mt-4 shadow-md"
                  style={{ background: "#2d3b2d", color: "white" }}
                >
                  {addLogMutation.isPending ? "Saving..." : "Save Food/Drink"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Logged Meals List */}
        {logs && logs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-bold text-xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
              Today's Food/Drink
            </h3>
            
            {logs.map(log => (
              <div key={log.id} className="bg-white p-5 rounded-2xl shadow-sm border flex items-center justify-between" style={{ borderColor: "#f0e8e4" }}>
                <div>
                  <div className="text-xs font-bold uppercase mb-1" style={{ color: "#c9a96e" }}>{log.mealType}</div>
                  <h4 className="font-bold text-[#2d3b2d]">{log.foodName}</h4>
                  <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-3">
                    <span>{log.calories} kcal</span>
                    <span className="text-blue-500">{log.protein}p</span>
                    <span className="text-orange-500">{log.carbs}c</span>
                    <span className="text-yellow-600">{log.fat}f</span>
                    <span className="text-green-600">{log.fiber}fb</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteLogMutation.mutate({ id: log.id, dateStr })}
                  className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
