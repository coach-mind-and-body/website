import Link from "next/link";
import { BRAND } from "@shared/brand";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";

export default function RealFoodResetClient() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "#fcfaf9", fontFamily: "'Montserrat', sans-serif", color: "#2d3b2d" }}
    >
      <header className="px-4 py-5 flex justify-center">
        <img src={BRAND.logoUrl} alt={BRAND.name} className="h-14 w-14 rounded-xl object-contain shadow-sm" />
      </header>

      <main className="px-4 pb-16">
        <div className="max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-4" style={{ color: "#c9a96e" }}>
            {REAL_FOOD_RESET.startLabel} – {REAL_FOOD_RESET.endLabel}
          </p>
          <h1
            className="font-bold leading-[1.1] mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem, 6vw, 3.8rem)" }}
          >
            This challenge has ended.
          </h1>
          <p className="text-xl font-semibold mb-4" style={{ color: "#3a5a3a" }}>
            {REAL_FOOD_RESET.name}
          </p>
          <p className="text-base leading-relaxed mb-4" style={{ color: "#555" }}>
            Five days of noticing what was on the plate, swapping one thing, and practicing when life wasn’t perfect.
            If you were here, that still counts. Your next choice is your next choice — no Monday restart.
          </p>
          <p className="text-base leading-relaxed mb-8" style={{ color: "#555" }}>
            {REAL_FOOD_RESET.philosophy}
          </p>
          <img
            src="/photos/lee-anne-sara.jpg"
            alt="Sara and Lee Anne"
            className="w-full rounded-3xl object-cover mb-8 h-[280px] sm:h-[340px]"
            style={{ objectPosition: "center 38%" }}
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={REAL_FOOD_RESET.trackerPath}
              className="inline-flex items-center justify-center font-bold rounded-full px-6 py-3 text-sm"
              style={{ background: "oklch(0.38 0.10 148)", color: "#fff" }}
            >
              Open the habit tracker
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center justify-center font-bold rounded-full px-6 py-3 text-sm"
              style={{ background: "#fff", color: "#2d3b2d", border: "1px solid #e6ddd6" }}
            >
              Book a free call
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-4 py-8 text-center text-xs" style={{ color: "#8a9a8a" }}>
        {BRAND.name} · {BRAND.coachFullName}
      </footer>
    </div>
  );
}
