"use client";

import { trpc } from "@/lib/trpc";

export default function AdminClientHabits({ userId }: { userId: number }) {
  const { data, isLoading, error } = trpc.habit.adminGetClientHabits.useQuery({ userId }, { retry: false });

  if (isLoading) return <div className="text-xs text-gray-500">Loading habit data...</div>;
  if (error) return <div className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>Client has not shared habit progress.</div>;
  if (!data) return null;

  const { habits, logs, notes, calorieLogs, fitnessLogs } = data as any;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: "oklch(0.20 0.015 50)" }}>Habits ({habits.length})</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {habits.map(habit => {
            const completedLogs = logs.filter(l => l.userHabitId === habit.id && l.completed);
            
            let statsText = `Completed ${completedLogs.length} times`;
            if (habit.type === "numeric") {
              const numericLogs = logs.filter(l => l.userHabitId === habit.id && l.numericValue != null);
              if (numericLogs.length > 0) {
                const total = numericLogs.reduce((sum, l) => sum + (l.numericValue || 0), 0);
                const avg = Math.round(total / numericLogs.length);
                statsText = `Averaging ${avg}${habit.unit || ""} across ${numericLogs.length} entries (Target: ${habit.targetValue || "?"})`;
              } else {
                statsText = "No numeric data logged yet";
              }
            }

            return (
              <div key={habit.id} className="p-3 rounded-lg border" style={{ background: "oklch(0.985 0.008 80)", borderColor: "oklch(0.90 0.015 80)" }}>
                <p className="text-sm font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>{habit.title}</p>
                <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>{statsText}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: "oklch(0.20 0.015 50)" }}>Recent Notes</p>
        <div className="space-y-2">
          {notes.slice(-5).map(note => (
            <div key={note.id} className="p-3 rounded-lg border" style={{ background: "oklch(0.985 0.008 80)", borderColor: "oklch(0.90 0.015 80)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "oklch(0.72 0.12 75)" }}>{note.dateStr}</p>
              <p className="text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>{note.note}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>No notes recorded.</p>}
        </div>
      </div>
      {(calorieLogs?.length > 0 || fitnessLogs?.length > 0) && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm font-bold mb-2" style={{ color: "oklch(0.20 0.015 50)" }}>Health & Fitness Progress</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calories */}
            <div>
              <p className="text-xs font-bold mb-2 text-gray-500 uppercase tracking-widest">Recent Meals</p>
              <div className="space-y-2">
                {calorieLogs?.slice(0, 5).map((cl: any) => (
                  <div key={cl.id} className="p-3 rounded-lg border bg-white border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{cl.foodName}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{cl.dateStr} &bull; {cl.mealType}</p>
                      </div>
                      <p className="text-xs font-bold text-gray-800">{cl.calories} kcal</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">
                      <span className="text-blue-500">{cl.protein}p</span> &bull; <span className="text-orange-500">{cl.carbs}c</span> &bull; <span className="text-yellow-600">{cl.fat}f</span> &bull; <span className="text-green-600">{cl.fiber}fb</span>
                    </p>
                  </div>
                ))}
                {(!calorieLogs || calorieLogs.length === 0) && <p className="text-xs text-gray-400">No meals logged.</p>}
              </div>
            </div>
            
            {/* Fitness */}
            <div>
              <p className="text-xs font-bold mb-2 text-gray-500 uppercase tracking-widest">Recent Workouts</p>
              <div className="space-y-2">
                {fitnessLogs?.slice(0, 5).map((fl: any) => (
                  <div key={fl.id} className="p-3 rounded-lg border bg-white border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{fl.exerciseName}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{fl.dateStr}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 flex gap-2">
                      {fl.sets > 0 && <span>Sets: {fl.sets}</span>}
                      {fl.reps > 0 && <span>Reps: {fl.reps}</span>}
                      {fl.weight > 0 && <span>Weight: {fl.weight}</span>}
                      {fl.durationMinutes > 0 && <span>Dur: {fl.durationMinutes}m</span>}
                    </p>
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
