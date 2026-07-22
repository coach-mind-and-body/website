"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Flame, Plus, Pencil, Trash2, Calendar, Loader2 } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { todayMountainDateStr } from "@/lib/mountainTime";

export default function AdminClientHabits({ userId }: { userId: number }) {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.habit.adminGetClientHabits.useQuery({ userId }, { retry: false });
  
  const upsertHabitMutation = trpc.habit.adminUpsertClientHabit.useMutation({
    onSuccess: () => {
      toast.success("Habit saved!");
      utils.habit.adminGetClientHabits.invalidate({ userId });
      setIsEditingHabit(null);
      setNewHabitForm(null);
    },
    onError: (e) => toast.error(e.message)
  });

  const toggleActiveMutation = trpc.habit.adminSetClientHabitActive.useMutation({
    onSuccess: () => {
      toast.success("Habit deactivated");
      utils.habit.adminGetClientHabits.invalidate({ userId });
    }
  });

  const [isEditingHabit, setIsEditingHabit] = useState<number | null>(null);
  const [newHabitForm, setNewHabitForm] = useState<any>(null);

  if (isLoading) return <div className="text-xs text-gray-500 py-4"><Loader2 className="animate-spin h-4 w-4" /></div>;
  if (error) return <div className="text-xs py-4 text-gray-500">Client has not shared habit progress.</div>;
  if (!data) return null;

  const { habits, logs, notes, calorieLogs, fitnessLogs, stats } = data as any;
  const activeHabits = habits.filter((h: any) => h.isActive);

  // 30 day heatmap
  const todayStr = todayMountainDateStr();
  const todayDate = parseISO(`${todayStr}T12:00:00`);
  const days30 = Array.from({ length: 30 }).map((_, i) => subDays(todayDate, 29 - i));
  const completedSet = new Set(stats?.completedDates || []);

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitForm.title.trim()) return toast.error("Title required");
    upsertHabitMutation.mutate({
      userId,
      ...newHabitForm
    });
  };

  return (
    <div className="space-y-8">
      {/* Streak and Heatmap */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className={stats?.streak >= 3 ? "text-orange-500 fill-orange-500" : "text-gray-400"} size={24} />
            <h3 className="font-bold text-xl" style={{ color: "oklch(0.20 0.015 50)" }}>
              {stats?.streak || 0} Day Streak
            </h3>
          </div>
        </div>
        
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">30-Day Activity Heatmap</p>
        <div className="flex flex-wrap gap-1.5">
          {days30.map(day => {
            const yyyy = day.getFullYear();
            const mm = String(day.getMonth() + 1).padStart(2, '0');
            const dd = String(day.getDate()).padStart(2, '0');
            const dStr = `${yyyy}-${mm}-${dd}`;
            const isActive = completedSet.has(dStr);
            return (
              <div 
                key={dStr}
                title={format(day, "MMM d, yyyy")}
                className={`w-5 h-5 rounded-sm transition-all ${isActive ? 'bg-[#c9a96e] shadow-sm' : 'bg-slate-100'}`}
              />
            );
          })}
        </div>
      </div>

      {/* Habits List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500">Client Habits ({activeHabits.length})</p>
          <button 
            onClick={() => {
              setIsEditingHabit(null);
              setNewHabitForm({ title: "", type: "boolean", targetValue: 1 });
            }}
            className="flex items-center gap-1 text-xs font-bold bg-[#2d3b2d] text-white hover:opacity-90 px-3 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} /> Add Habit
          </button>
        </div>

        {newHabitForm && !newHabitForm.id && (
          <form onSubmit={handleSaveHabit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">New Custom Habit</h4>
            <input 
              type="text" placeholder="Habit Title (e.g. Drink Water)" required
              value={newHabitForm.title} onChange={e => setNewHabitForm({...newHabitForm, title: e.target.value})}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-gray-300"
            />
            <div className="flex gap-2">
              <select 
                value={newHabitForm.type} onChange={e => setNewHabitForm({...newHabitForm, type: e.target.value})}
                className="px-3 py-2 text-sm rounded-lg border bg-white flex-1"
              >
                <option value="boolean">Yes/No (Checkbox)</option>
                <option value="numeric">Number Target</option>
              </select>
              {newHabitForm.type === "numeric" && (
                <>
                  <input 
                    type="number" placeholder="Target" required min="1"
                    value={newHabitForm.targetValue || ""} onChange={e => setNewHabitForm({...newHabitForm, targetValue: Number(e.target.value)})}
                    className="w-24 px-3 py-2 text-sm rounded-lg border bg-white"
                  />
                  <input 
                    type="text" placeholder="Unit (e.g. oz)" 
                    value={newHabitForm.unit || ""} onChange={e => setNewHabitForm({...newHabitForm, unit: e.target.value})}
                    className="w-24 px-3 py-2 text-sm rounded-lg border bg-white"
                  />
                </>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setNewHabitForm(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={upsertHabitMutation.isPending} className="px-4 py-2 text-xs font-bold bg-[#c9a96e] text-white rounded-lg shadow-sm">Save Habit</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeHabits.map((habit: any) => {
            const completedLogs = logs.filter((l: any) => l.userHabitId === habit.id && l.completed);
            
            let statsText = `Completed ${completedLogs.length} times`;
            if (habit.type === "numeric") {
              const numericLogs = logs.filter((l: any) => l.userHabitId === habit.id && l.numericValue != null);
              if (numericLogs.length > 0) {
                const total = numericLogs.reduce((sum: number, l: any) => sum + (l.numericValue || 0), 0);
                const avg = Math.round(total / numericLogs.length);
                statsText = `Avg ${avg}${habit.unit || ""} / ${habit.targetValue || "?"}${habit.unit || ""}`;
              } else {
                statsText = `Target: ${habit.targetValue || "?"}${habit.unit || ""}`;
              }
            }

            const isEditing = isEditingHabit === habit.id;

            return (
              <div key={habit.id} className="p-4 rounded-xl border bg-white shadow-sm flex flex-col group relative">
                {isEditing ? (
                  <form onSubmit={handleSaveHabit} className="space-y-3">
                    <input 
                      type="text" required
                      value={newHabitForm.title} onChange={e => setNewHabitForm({...newHabitForm, title: e.target.value})}
                      className="w-full px-3 py-2 text-sm rounded-lg border"
                    />
                    <div className="flex gap-2">
                      <select 
                        value={newHabitForm.type} onChange={e => setNewHabitForm({...newHabitForm, type: e.target.value})}
                        className="px-3 py-2 text-sm rounded-lg border flex-1"
                      >
                        <option value="boolean">Yes/No</option>
                        <option value="numeric">Number</option>
                      </select>
                      {newHabitForm.type === "numeric" && (
                        <input 
                          type="number" required min="1"
                          value={newHabitForm.targetValue || ""} onChange={e => setNewHabitForm({...newHabitForm, targetValue: Number(e.target.value)})}
                          className="w-20 px-3 py-2 text-sm rounded-lg border"
                        />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsEditingHabit(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-lg">Cancel</button>
                      <button type="submit" disabled={upsertHabitMutation.isPending} className="px-3 py-1.5 text-xs font-bold bg-[#c9a96e] text-white rounded-lg">Save</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold pr-8" style={{ color: "oklch(0.20 0.015 50)" }}>{habit.title}</p>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white pl-2">
                        <button 
                          onClick={() => {
                            setIsEditingHabit(habit.id);
                            setNewHabitForm(habit);
                          }}
                          className="p-1.5 text-gray-400 hover:text-[#c9a96e] bg-slate-50 rounded-md"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("Are you sure you want to deactivate this habit? History will be saved.")) {
                              toggleActiveMutation.mutate({ userId, habitId: habit.id, isActive: false });
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 bg-slate-50 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs mt-auto" style={{ color: "oklch(0.52 0.015 50)" }}>{statsText}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legacy Notes & Health Data */}
      <div>
        <p className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Recent Notes</p>
        <div className="space-y-2">
          {notes.slice(-5).map((note: any) => (
            <div key={note.id} className="p-4 rounded-xl border bg-white shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400">{note.dateStr}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-xs text-gray-400">No notes recorded.</p>}
        </div>
      </div>

      {(calorieLogs?.length > 0 || fitnessLogs?.length > 0) && (
        <div className="pt-4 border-t border-gray-100">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Health & Fitness Check-ins</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calories */}
            <div>
              <p className="text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-widest">Recent Meals</p>
              <div className="space-y-2">
                {calorieLogs?.slice(0, 5).map((cl: any) => (
                  <div key={cl.id} className="p-3 rounded-lg border bg-white shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-800">{cl.foodName}</p>
                      <p className="text-xs font-bold text-gray-800">{cl.calories} kcal</p>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] text-gray-500 uppercase">{cl.dateStr} • {cl.mealType}</p>
                      <p className="text-[10px] text-gray-500">
                        <span className="text-blue-500">{cl.protein}p</span> • <span className="text-orange-500">{cl.carbs}c</span> • <span className="text-yellow-600">{cl.fat}f</span>
                      </p>
                    </div>
                  </div>
                ))}
                {(!calorieLogs || calorieLogs.length === 0) && <p className="text-xs text-gray-400">No meals logged.</p>}
              </div>
            </div>
            
            {/* Fitness */}
            <div>
              <p className="text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-widest">Recent Workouts</p>
              <div className="space-y-2">
                {fitnessLogs?.slice(0, 5).map((fl: any) => (
                  <div key={fl.id} className="p-3 rounded-lg border bg-white shadow-sm flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-gray-800">{fl.exerciseName}</p>
                    </div>
                    <div className="flex justify-between items-end mt-1">
                      <p className="text-[10px] text-gray-500 uppercase">{fl.dateStr}</p>
                      <p className="text-[10px] text-gray-500 flex gap-2">
                        {fl.durationMinutes > 0 && <span>{fl.durationMinutes}m</span>}
                      </p>
                    </div>
                  </div>
                ))}
                {(!fitnessLogs || fitnessLogs.length === 0) && <p className="text-xs text-gray-400">No workouts logged.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
