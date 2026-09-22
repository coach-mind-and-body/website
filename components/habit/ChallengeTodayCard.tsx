"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getDeviceId } from "@/lib/deviceId";
import { REAL_FOOD_RESET, REAL_FOOD_RESET_CLAIM_KEY } from "@shared/realFoodReset";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, Check, Bell } from "lucide-react";
import { useWebPush } from "@/hooks/useWebPush";

export default function ChallengeTodayCard() {
  const deviceId = getDeviceId();
  const { isSupported, isSubscribed, isSubscribing, subscribeToPush } = useWebPush();
  const { data, refetch } = trpc.challenges.getToday.useQuery({ deviceId });
  const claim = trpc.challenges.claimEnrollment.useMutation({
    onSuccess: () => refetch(),
  });
  const toggle = trpc.challenges.toggleChallengeLog.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });
  const saveJournal = trpc.challenges.saveJournal.useMutation({
    onSuccess: () => toast.success("Journal saved"),
    onError: (e) => toast.error(e.message),
  });

  const [noticed, setNoticed] = useState("");
  const [glad, setGlad] = useState("");
  const [hard, setHard] = useState("");
  const [showGuides, setShowGuides] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("claim") ||
          localStorage.getItem(REAL_FOOD_RESET_CLAIM_KEY)
        : null;
    if (token && !claim.isPending) {
      claim.mutate({ token, deviceId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    if (data?.journal) {
      setNoticed(data.journal.noticed);
      setGlad(data.journal.glad);
      setHard(data.journal.hard);
    }
  }, [data?.journal?.noticed, data?.journal?.glad, data?.journal?.hard]);

  if (!data) return null;

  if (!data.enrolled) {
    return null;
  }

  const day = data.today;

  return (
    <div className="p-5 rounded-3xl border bg-white space-y-4" style={{ borderColor: "#f0e8e4" }}>
      <div>
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#c9a96e" }}>
          {REAL_FOOD_RESET.shortName}
        </p>
        <h3 className="font-bold text-xl" style={{ color: "#2d3b2d", fontFamily: "'Cormorant Garamond', serif" }}>
          {data.title}
        </h3>
      </div>

      {data.beforeStart && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: "#6a7a6a" }}>
            You’re in. We start {REAL_FOOD_RESET.startLabel}. Lives are {REAL_FOOD_RESET.liveDays} at{" "}
            {data.liveTime || REAL_FOOD_RESET.liveTime}. Check-off starts Monday — peek at the week below.
          </p>
          <ul className="space-y-2">
            {(data.previewDays ?? REAL_FOOD_RESET.days).map((d) => (
              <li key={d.n} className="rounded-xl p-3 text-sm" style={{ background: "#f9f5f0" }}>
                <p className="text-xs font-bold" style={{ color: "#c9a96e" }}>
                  Day {d.n} · {d.weekday} · {d.formatLabel}
                </p>
                <p className="font-bold mt-1" style={{ color: "#2d3b2d" }}>
                  {d.title}
                </p>
                <p className="text-xs mt-1" style={{ color: "#555" }}>
                  {d.assignmentTitle}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isSupported && !isSubscribed && (
        <button
          type="button"
          onClick={() => subscribeToPush()}
          disabled={isSubscribing}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold rounded-xl py-3 border"
          style={{ borderColor: "#e8c99a", background: "#fcfaf9", color: "#2d3b2d" }}
        >
          <Bell size={16} />
          {isSubscribing ? "Enabling…" : "Turn on reminders for lives and daily check-ins"}
        </button>
      )}

      {day && (
        <p className="text-xs" style={{ color: "#8a9a8a" }}>
          Logging a meal in Macros or saving your journal counts as today’s check-in.
        </p>
      )}

      {data.afterEnd && (
        <p className="text-sm" style={{ color: "#6a7a6a" }}>
          The five days are complete. Your journal and food log are still here.
        </p>
      )}

      {day && (
        <>
          <div>
            <p className="text-xs font-bold" style={{ color: "#8a9a8a" }}>
              Day {day.n} · {day.weekday} · {day.formatLabel}
            </p>
            <p className="font-bold mt-1" style={{ color: "#2d3b2d" }}>
              {day.title}
            </p>
            <p className="text-sm mt-1" style={{ color: "#555" }}>
              {day.win}
            </p>
          </div>

          <div className="rounded-xl p-3 space-y-2" style={{ background: "#f9f5f0" }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#c9a96e" }}>
              Today’s assignment
            </p>
            <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
              {day.assignmentTitle}
            </p>
            <ol className="list-decimal pl-4 text-sm space-y-1" style={{ color: "#555" }}>
              {day.assignmentSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <p className="text-xs italic" style={{ color: "#8a9a8a" }}>
              {REAL_FOOD_RESET.philosophy}
            </p>
          </div>

          {data.meetUrl && (
            <a
              href={data.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full font-bold rounded-xl py-3"
              style={{ background: "oklch(0.38 0.10 148)", color: "#fff" }}
            >
              <Video size={18} />
              Join live (Google Meet)
            </a>
          )}

          {day.format === "video" && (
            <p className="text-sm rounded-xl p-3" style={{ background: "#f9f5f0", color: "#5a4a40" }}>
              No live call today. Watch the lesson when Lee Anne posts it here, log your food, and write a few lines below.
            </p>
          )}

          <Button
            className="w-full rounded-xl font-bold"
            variant={day.done ? "outline" : "default"}
            disabled={toggle.isPending || !data.userChallengeId}
            style={{
              background: day.done ? "transparent" : "#c9a96e",
              color: day.done ? "#c9a96e" : "white",
              borderColor: "#c9a96e",
            }}
            onClick={() => {
              if (!data.userChallengeId) return;
              toggle.mutate({
                userChallengeId: data.userChallengeId,
                dateStr: day.dateStr,
                completed: !day.done,
                deviceId,
              });
            }}
          >
            {day.done ? (
              <>
                <Check size={16} className="mr-1" /> Done today
              </>
            ) : (
              "Check off today"
            )}
          </Button>

          {day.n === 2 && data.guides?.flipIt && (
            <div className="rounded-xl p-3 space-y-2 text-sm" style={{ background: "#fcfaf9", border: "1px solid #f0e8e4" }}>
              <p className="font-bold" style={{ color: "#2d3b2d" }}>
                {data.guides.flipIt.headline}
              </p>
              <ol className="list-decimal pl-4 space-y-1" style={{ color: "#555" }}>
                {data.guides.flipIt.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
              <p className="text-xs" style={{ color: "#8a9a8a" }}>
                Compare: {data.guides.flipIt.compareRows.join(" · ")}
              </p>
              <p className="font-bold uppercase tracking-widest text-center pt-1" style={{ color: "#c9a96e" }}>
                {data.guides.flipIt.mantra}
              </p>
            </div>
          )}

          {day.n === 4 && data.guides?.plate && (
            <div className="rounded-xl p-3 space-y-2 text-sm" style={{ background: "#fcfaf9", border: "1px solid #f0e8e4" }}>
              <p className="font-bold" style={{ color: "#2d3b2d" }}>
                Where’s my protein / fat / fiber?
              </p>
              <p style={{ color: "#555" }}>
                <strong>Protein:</strong> {data.guides.plate.protein}
              </p>
              <p style={{ color: "#555" }}>
                <strong>Fat:</strong> {data.guides.plate.fat}
              </p>
              <p style={{ color: "#555" }}>
                <strong>Fiber:</strong> {data.guides.plate.fiber}
              </p>
              <p style={{ color: "#555" }}>{data.guides.plate.carbsNote}</p>
              <p className="text-xs" style={{ color: "#8a9a8a" }}>
                {data.guides.plate.unicityNote}
              </p>
              <p className="font-bold pt-1" style={{ color: "#2d3b2d" }}>
                Ideas, not rules
              </p>
              <p className="text-xs" style={{ color: "#555" }}>
                Breakfast: {data.guides.plate.combos.breakfast.join(" · ")}
              </p>
              <p className="text-xs" style={{ color: "#555" }}>
                Lunch: {data.guides.plate.combos.lunch.join(" · ")}
              </p>
              <p className="text-xs" style={{ color: "#555" }}>
                Dinner: {data.guides.plate.combos.dinner.join(" · ")}
              </p>
              <p className="text-xs" style={{ color: "#555" }}>
                Snacks: {data.guides.plate.combos.snacks.join(" · ")}
              </p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
              What did I notice?
            </p>
            <label className="block text-xs font-semibold" style={{ color: "#6a7a6a" }}>
              {day.journal.noticed}
              <Textarea className="mt-1" rows={2} value={noticed} onChange={(e) => setNoticed(e.target.value)} />
            </label>
            <label className="block text-xs font-semibold" style={{ color: "#6a7a6a" }}>
              {day.journal.glad}
              <Textarea className="mt-1" rows={2} value={glad} onChange={(e) => setGlad(e.target.value)} />
            </label>
            <label className="block text-xs font-semibold" style={{ color: "#6a7a6a" }}>
              {day.journal.hard}
              <Textarea className="mt-1" rows={2} value={hard} onChange={(e) => setHard(e.target.value)} />
            </label>
            <Button
              variant="outline"
              className="w-full"
              disabled={saveJournal.isPending || !data.userChallengeId}
              onClick={() => {
                if (!data.userChallengeId) return;
                saveJournal.mutate({
                  userChallengeId: data.userChallengeId,
                  dateStr: day.dateStr,
                  noticed,
                  glad,
                  hard,
                  deviceId,
                });
              }}
            >
              Save journal
            </Button>
          </div>
        </>
      )}

      {data.documents && data.documents.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
            Meal plan, shopping list &amp; recipes
          </p>
          {data.documents.map((doc) => (
            <a
              key={doc.url}
              href={doc.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl px-4 py-3 text-sm font-bold"
              style={{ background: "#f9f5f0", color: "#2d3b2d", border: "1px solid #f0e8e4" }}
            >
              {doc.title} →
            </a>
          ))}
        </div>
      )}

      {data.guides?.mealPlan && data.guides.mealPlan.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
            This week’s plates
          </p>
          {data.guides.mealPlan.map((row) => (
            <div key={row.weekday} className="rounded-xl p-3 text-xs" style={{ background: "#f9f5f0", color: "#555" }}>
              <p className="font-bold mb-1" style={{ color: "#2d3b2d" }}>
                {row.weekday}
              </p>
              <p>Breakfast: {row.breakfast}</p>
              <p>Snack: {row.snack}</p>
              <p>Lunch: {row.lunch}</p>
              <p>Dinner: {row.dinner}</p>
            </div>
          ))}
        </div>
      )}

      {data.guideImages && data.guideImages.length > 0 && (
        <div className="space-y-3">
          {data.guideImages.map((img) => (
            <figure key={img.url} className="rounded-2xl overflow-hidden border" style={{ borderColor: "#f0e8e4" }}>
              <img src={img.url} alt={img.alt} className="w-full h-auto" />
              <figcaption className="text-xs font-bold px-3 py-2" style={{ color: "#8a9a8a" }}>
                {img.title}
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {data.guides && (
        <div>
          <button
            type="button"
            className="text-sm font-bold underline"
            style={{ color: "#c9a96e" }}
            onClick={() => setShowGuides(!showGuides)}
          >
            {showGuides ? "Hide food guides" : "Whole-food guides"}
          </button>
          {showGuides && (
            <div className="mt-3 space-y-3 text-sm" style={{ color: "#555" }}>
              {data.guides.levels.map((row) => (
                <div key={row.type} className="p-3 rounded-xl" style={{ background: "#f9f5f0" }}>
                  <p className="font-bold">{row.type}</p>
                  <p className="text-xs mt-1">{row.description}</p>
                  <p className="text-xs mt-1">{row.examples}</p>
                </div>
              ))}
              <p className="font-bold">Easy meal ideas</p>
              <p>Breakfast: {data.guides.mealIdeas.breakfast.join(" · ")}</p>
              <p>Lunch: {data.guides.mealIdeas.lunch.join(" · ")}</p>
              <p>Dinner: {data.guides.mealIdeas.dinner.join(" · ")}</p>
              <p>Snacks: {data.guides.mealIdeas.snacks.join(" · ")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
