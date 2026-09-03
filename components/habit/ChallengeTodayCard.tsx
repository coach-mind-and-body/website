"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getDeviceId } from "@/lib/deviceId";
import { REAL_FOOD_RESET, REAL_FOOD_RESET_CLAIM_KEY } from "@shared/realFoodReset";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, Check } from "lucide-react";

export default function ChallengeTodayCard() {
  const deviceId = getDeviceId();
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
        <p className="text-sm" style={{ color: "#6a7a6a" }}>
          You’re in. We start {REAL_FOOD_RESET.startLabel}. Lives are {REAL_FOOD_RESET.liveDays} at{" "}
          {REAL_FOOD_RESET.liveTime}.
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

          <div className="space-y-3 pt-2">
            <p className="text-sm font-bold" style={{ color: "#2d3b2d" }}>
              Daily journal
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
