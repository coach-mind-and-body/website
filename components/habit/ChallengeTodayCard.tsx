"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { getDeviceId } from "@/lib/deviceId";
import { REAL_FOOD_RESET_CLAIM_KEY } from "@shared/realFoodReset";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Video, Check, Bell, ChevronRight, Play } from "lucide-react";
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
    onSuccess: () => toast.success("Note saved"),
    onError: (e) => toast.error(e.message),
  });

  const [noticed, setNoticed] = useState("");
  const [glad, setGlad] = useState("");
  const [hard, setHard] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNote, setShowNote] = useState(false);
  const [showResources, setShowResources] = useState(false);

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

  const week = data?.week ?? [];
  const selected = useMemo(() => {
    if (!week.length) return null;
    return (
      week.find((d) => d.dateStr === selectedDate) ||
      week.find((d) => d.isToday) ||
      week[0]
    );
  }, [week, selectedDate]);

  useEffect(() => {
    if (selected?.journal) {
      setNoticed(selected.journal.noticed);
      setGlad(selected.journal.glad);
      setHard(selected.journal.hard);
    }
  }, [selected?.dateStr, selected?.journal?.noticed, selected?.journal?.glad, selected?.journal?.hard]);

  if (!data?.enrolled) return null;

  const live = !!selected?.liveOpen && selected.meetUrl;
  const watch = selected?.videoUrl || data.videoUrl;
  const embed = selected?.replayEmbedUrl || data.replayEmbedUrl;
  const hasNote = !!(noticed.trim() || glad.trim() || hard.trim());
  const docs = (data.documents ?? []).filter((doc) => !/replay/i.test(doc.title));

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] mb-1" style={{ color: "#c9a96e" }}>
          {data.title}
        </p>
        {selected ? (
          <>
            <h3 className="font-bold text-3xl leading-tight" style={{ color: "#2d3b2d", fontFamily: "'Cormorant Garamond', serif" }}>
              Day {selected.n} of 5
            </h3>
            <p className="font-semibold text-lg mt-1" style={{ color: "#2d3b2d" }}>
              {selected.title}
            </p>
            <p className="text-sm mt-1" style={{ color: "#555" }}>
              {selected.win}
            </p>
          </>
        ) : (
          <h3 className="font-bold text-2xl" style={{ color: "#2d3b2d", fontFamily: "'Cormorant Garamond', serif" }}>
            {data.title}
          </h3>
        )}
      </div>

      {week.length > 0 && (
        <div className="flex">
          {week.map((d) => {
            const on = d.dateStr === (selected?.dateStr ?? "");
            const fill = d.done ? "#c9a96e" : d.isToday ? "#2d3b2d" : "#fff";
            const fg = d.done || d.isToday ? "#fff" : "#8a9a8a";
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={() => setSelectedDate(d.dateStr)}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <span className="text-[11px] font-bold" style={{ color: "#8a9a8a" }}>
                  {d.weekdayShort}
                </span>
                <span
                  className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold"
                  style={{
                    background: fill,
                    color: fg,
                    boxShadow: on ? "0 0 0 2px #2d3b2d" : "0 0 0 1px #f0e8e4",
                  }}
                >
                  {d.done ? "✓" : d.n}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div>
        <div className="relative overflow-hidden rounded-[24px] shadow-[0_8px_24px_rgba(45,59,45,0.08)]" style={{ aspectRatio: "16 / 9", background: "#1c2b1c" }}>
          {embed ? (
            <iframe
              title="Challenge session"
              src={embed}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : live && selected?.meetUrl ? (
            <a
              href={selected.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white"
            >
              <Play size={48} fill="white" />
              <span className="text-xl font-bold">Join live</span>
              <span className="text-sm opacity-80">{data.liveTime}</span>
            </a>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/90 px-6 text-center">
              <Video size={28} />
              <p className="text-sm font-semibold">
                {selected?.format === "live"
                  ? selected.isFuture
                    ? `Live ${selected.weekday} at 1:00 pm Mountain`
                    : "Replay posts here after the 1:00 pm call"
                  : "Lesson video posts here"}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs font-semibold" style={{ color: "#8a9a8a" }}>
            {live ? "Live now · Google Meet" : watch ? (selected?.format === "live" ? "Live replay" : "Lesson") : selected?.formatLabel}
          </p>
          {watch && !live && (
            <a href={watch} target="_blank" rel="noreferrer" className="text-xs font-bold" style={{ color: "#2d3b2d" }}>
              Full screen
            </a>
          )}
        </div>
      </div>

      {isSupported && !isSubscribed && (
        <button
          type="button"
          onClick={() => subscribeToPush()}
          disabled={isSubscribing}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold rounded-xl py-3 border"
          style={{ borderColor: "#e8c99a", background: "#fcfaf9", color: "#2d3b2d" }}
        >
          <Bell size={16} />
          {isSubscribing ? "Enabling…" : "Turn on reminders"}
        </button>
      )}

      {selected && (
        <div className="rounded-[22px] p-5 space-y-3 bg-white border" style={{ borderColor: "#f0e8e4" }}>
          <p className="text-xs font-bold uppercase tracking-[0.14em]" style={{ color: "#c9a96e" }}>
            Today’s job
          </p>
          <p className="font-bold" style={{ color: "#2d3b2d" }}>
            {selected.assignmentTitle}
          </p>
          <ol className="list-decimal pl-4 text-sm space-y-1" style={{ color: "#555" }}>
            {(selected.assignmentSteps ?? []).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {selected.n === 2 && data.guides?.flipIt && (
            <div className="text-sm space-y-1 pt-1" style={{ color: "#555" }}>
              <p className="font-bold" style={{ color: "#2d3b2d" }}>{data.guides.flipIt.headline}</p>
              {data.guides.flipIt.mantra && (
                <p className="text-xs font-semibold" style={{ color: "#c9a96e" }}>
                  {data.guides.flipIt.mantra}
                </p>
              )}
              <ol className="list-decimal pl-4 space-y-1 text-xs">
                {data.guides.flipIt.checks.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ol>
              {data.guides.flipIt.compareRows?.length ? (
                <p className="text-xs pt-1">
                  <span className="font-bold">Look at: </span>
                  {data.guides.flipIt.compareRows.join(" · ")}
                </p>
              ) : null}
            </div>
          )}
          {selected.n === 4 && data.guides?.plate && (
            <div className="text-sm space-y-1 pt-1" style={{ color: "#555" }}>
              <p><strong>Protein:</strong> {data.guides.plate.protein}</p>
              <p><strong>Fat:</strong> {data.guides.plate.fat}</p>
              <p><strong>Fiber:</strong> {data.guides.plate.fiber}</p>
              {data.guides.plate.carbsNote && (
                <p className="text-xs">{data.guides.plate.carbsNote}</p>
              )}
              {data.guides.plate.unicityNote && (
                <p className="text-xs">{data.guides.plate.unicityNote}</p>
              )}
            </div>
          )}
          <Button
            className="w-full rounded-xl font-bold"
            variant={selected.done ? "outline" : "default"}
            disabled={toggle.isPending || !data.userChallengeId || selected.isFuture}
            style={{
              background: selected.done ? "transparent" : "#c9a96e",
              color: selected.done ? "#c9a96e" : "white",
              borderColor: "#c9a96e",
            }}
            onClick={() => {
              if (!data.userChallengeId) return;
              toggle.mutate({
                userChallengeId: data.userChallengeId,
                dateStr: selected.dateStr,
                completed: !selected.done,
                deviceId,
              });
            }}
          >
            {selected.done ? (
              <>
                <Check size={16} className="mr-1" /> Done
              </>
            ) : (
              "Mark job done"
            )}
          </Button>
          <p className="text-xs" style={{ color: "#8a9a8a" }}>
            Logging a meal in Macros also counts.
          </p>
        </div>
      )}

      <div className="rounded-[22px] overflow-hidden bg-white border" style={{ borderColor: "#f0e8e4" }}>
        <button
          type="button"
          onClick={() => {
            setShowNote(!showNote);
            if (!showNote) setShowResources(false);
          }}
          className="w-full flex items-center gap-3 p-4 text-left"
        >
          <span className="font-bold" style={{ color: "#2d3b2d" }}>Daily note</span>
          <span className="text-xs flex-1" style={{ color: "#8a9a8a" }}>
            {hasNote ? "Saved for this day" : "What did you notice?"}
          </span>
          <ChevronRight
            size={16}
            style={{ color: "#8a9a8a", transform: showNote ? "rotate(90deg)" : undefined }}
          />
        </button>
        {showNote && selected && (
          <div className="px-4 pb-4 space-y-3">
            <label className="block text-sm font-semibold" style={{ color: "#2d3b2d" }}>
              {selected.prompts?.noticed ?? "What did you notice today?"}
              <Textarea className="mt-1" rows={3} value={noticed} onChange={(e) => setNoticed(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold" style={{ color: "#2d3b2d" }}>
              {selected.prompts?.glad ?? "One choice you’re glad you made"}
              <Textarea className="mt-1" rows={3} value={glad} onChange={(e) => setGlad(e.target.value)} />
            </label>
            <label className="block text-sm font-semibold" style={{ color: "#2d3b2d" }}>
              {selected.prompts?.hard ?? "One thing that was hard"}
              <Textarea className="mt-1" rows={3} value={hard} onChange={(e) => setHard(e.target.value)} />
            </label>
            <Button
              className="w-full"
              disabled={saveJournal.isPending || !data.userChallengeId}
              onClick={() => {
                if (!data.userChallengeId) return;
                saveJournal.mutate({
                  userChallengeId: data.userChallengeId,
                  dateStr: selected.dateStr,
                  noticed,
                  glad,
                  hard,
                  deviceId,
                });
              }}
            >
              Save note
            </Button>
          </div>
        )}
        <div className="h-px ml-4" style={{ background: "#f0e8e4" }} />
        <button
          type="button"
          onClick={() => {
            setShowResources(!showResources);
            if (!showResources) setShowNote(false);
          }}
          className="w-full flex items-center gap-3 p-4 text-left"
        >
          <span className="font-bold" style={{ color: "#2d3b2d" }}>Meal plan &amp; recipes</span>
          <span className="text-xs flex-1" style={{ color: "#8a9a8a" }}>
            Shopping list, recipes, what to eat
          </span>
          <ChevronRight
            size={16}
            style={{ color: "#8a9a8a", transform: showResources ? "rotate(90deg)" : undefined }}
          />
        </button>
        {showResources && (
          <div className="px-4 pb-4 space-y-4">
            {docs.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-bold"
                style={{ color: "#2d3b2d" }}
              >
                {doc.title} →
              </a>
            ))}
            {data.guides?.mealPlan?.map((row) => (
              <div key={row.weekday} className="text-xs" style={{ color: "#555" }}>
                <p className="font-bold" style={{ color: "#2d3b2d" }}>{row.weekday}</p>
                <p>Breakfast: {row.breakfast}</p>
                {row.snack && <p>Snack: {row.snack}</p>}
                <p>Lunch: {row.lunch}</p>
                <p>Dinner: {row.dinner}</p>
              </div>
            ))}
            {data.guideImages?.map((img) => (
              <figure key={img.url}>
                <img src={img.url} alt={img.alt} className="w-full h-auto rounded-xl" />
                <figcaption className="text-xs font-bold mt-1" style={{ color: "#8a9a8a" }}>
                  {img.title}
                </figcaption>
              </figure>
            ))}
            {([
              { title: "Breakfast", items: data.guides?.plate?.combos?.breakfast },
              { title: "Lunch", items: data.guides?.plate?.combos?.lunch },
              { title: "Dinner", items: data.guides?.plate?.combos?.dinner },
              { title: "Snacks", items: data.guides?.plate?.combos?.snacks },
            ]).filter((g) => g.items && g.items.length > 0).map((g) => (
              <div key={g.title} className="text-xs" style={{ color: "#555" }}>
                <p className="font-bold" style={{ color: "#2d3b2d" }}>{g.title}</p>
                {(g.items ?? []).map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ))}
            {data.guides?.levels.map((row) => (
              <div key={row.type} className="text-sm" style={{ color: "#555" }}>
                <p className="font-bold" style={{ color: "#2d3b2d" }}>{row.type}</p>
                <p className="text-xs">{row.description}</p>
                <p className="text-xs">{row.examples}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
