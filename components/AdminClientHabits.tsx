"use client";

import { trpc } from "@/lib/trpc";

export default function AdminClientHabits({ userId }: { userId: number }) {
  const { data, isLoading, error } = trpc.habit.adminGetClientHabits.useQuery({ userId }, { retry: false });

  if (isLoading) return <div className="text-xs text-gray-500">Loading habit data...</div>;
  if (error) return <div className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>Client has not shared habit progress.</div>;
  if (!data) return null;

  const { habits, logs, notes } = data;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: "oklch(0.97 0.008 10)" }}>Habits ({habits.length})</p>
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
              <div key={habit.id} className="p-3 rounded-lg border" style={{ background: "oklch(0.28 0.02 160)", borderColor: "oklch(0.35 0.02 160)" }}>
                <p className="text-sm font-bold" style={{ color: "oklch(0.97 0.008 10)" }}>{habit.title}</p>
                <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>{statsText}</p>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-sm font-bold mb-2" style={{ color: "oklch(0.97 0.008 10)" }}>Recent Notes</p>
        <div className="space-y-2">
          {notes.slice(-5).map(note => (
            <div key={note.id} className="p-3 rounded-lg border" style={{ background: "oklch(0.28 0.02 160)", borderColor: "oklch(0.35 0.02 160)" }}>
              <p className="text-xs font-bold mb-1" style={{ color: "oklch(0.72 0.12 75)" }}>{note.dateStr}</p>
              <p className="text-sm" style={{ color: "oklch(0.88 0.01 160)" }}>{note.note}</p>
            </div>
          ))}
          {notes.length === 0 && <p className="text-xs" style={{ color: "oklch(0.60 0.02 160)" }}>No notes recorded.</p>}
        </div>
      </div>
    </div>
  );
}
