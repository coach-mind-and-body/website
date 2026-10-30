import { HABIT_TRACKER_INTRO } from "@/lib/thinPageCopy";

/** Server-rendered so the page has an H1 and intro before the tracker mounts. */
export default function HabitTrackerIntro() {
  return (
    <section className="px-4 pt-8 pb-2 max-w-2xl mx-auto" aria-labelledby="habit-tracker-heading">
      <h1
        id="habit-tracker-heading"
        className="text-3xl font-bold mb-4"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
      >
        Free Daily Habit Tracker
      </h1>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "#3e3e3e" }}>
        {HABIT_TRACKER_INTRO.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </section>
  );
}
