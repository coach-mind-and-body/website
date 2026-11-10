"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, NotebookPen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "drink";

type PagePhoto = {
  key: string;
  previewUrl: string;
};

type Draft = {
  key: string;
  mealType: MealType;
  time: string;
  foodName: string;
  portion: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  confidence: "high" | "medium" | "low";
  unclear: boolean;
  note: string | null;
  imageIndex: number;
  dateStr: string;
  imageUrl: string | null;
};

const MEALS: MealType[] = ["breakfast", "lunch", "dinner", "snack", "drink"];
const MAX_PAGES = 4;

function nonNeg(value: string): number | null {
  if (!value.trim()) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed);
}

async function fileToJpegDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read that photo."));
      reader.readAsDataURL(file);
    });
  }
}

export default function WrittenLogScan({
  dateStr,
  isAuthenticated,
  onSaved,
}: {
  dateStr: string;
  isAuthenticated: boolean;
  onSaved: () => void;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<PagePhoto[]>([]);
  const [dataUrls, setDataUrls] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [sharedDate, setSharedDate] = useState(dateStr);
  const [busy, setBusy] = useState<"read" | "save" | null>(null);

  const scan = trpc.calories.analyzeWrittenFoodLog.useMutation();
  const save = trpc.calories.addLogs.useMutation();

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const room = MAX_PAGES - pages.length;
    if (room <= 0) {
      toast.error("Four pages is the limit for one scan.");
      return;
    }
    const files = Array.from(list).slice(0, room);
    if (list.length > room) toast.error("Only the first pages that fit were added.");
    try {
      const next = await Promise.all(
        files.map(async (file) => {
          const dataUrl = await fileToJpegDataUrl(file);
          return {
            photo: { key: crypto.randomUUID(), previewUrl: dataUrl },
            dataUrl,
          };
        })
      );
      setPages((current) => [...current, ...next.map((item) => item.photo)]);
      setDataUrls((current) => [...current, ...next.map((item) => item.dataUrl)]);
      setDrafts(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that photo.");
    }
  };

  const removePage = (index: number) => {
    setPages((current) => current.filter((_, i) => i !== index));
    setDataUrls((current) => current.filter((_, i) => i !== index));
    setDrafts(null);
  };

  const readLog = async () => {
    if (!isAuthenticated) {
      toast.error("Sign in to scan a written log. The photo is saved with your account so your coach can see it.");
      return;
    }
    if (!dataUrls.length) {
      toast.error("Add a photo of the page first.");
      return;
    }
    setBusy("read");
    try {
      const result = await scan.mutateAsync({
        images: dataUrls.map((imageBase64) => ({ imageBase64 })),
      });
      if (!result.entries.length) {
        toast.error("Nothing on that page was readable. Try a closer photo in better light.");
        setDrafts([]);
        return;
      }
      const urls = new Map(result.images.map((image) => [image.index, image.url]));
      setSharedDate(dateStr);
      setDrafts(
        result.entries.map((entry) => ({
          key: crypto.randomUUID(),
          mealType: entry.mealType,
          time: entry.time ?? "",
          foodName: entry.foodName,
          portion: entry.portion ?? "",
          calories: String(entry.calories),
          protein: String(entry.protein),
          carbs: String(entry.carbs),
          fat: String(entry.fat),
          fiber: String(entry.fiber),
          confidence: entry.confidence,
          unclear: entry.unclear,
          note: entry.note,
          imageIndex: entry.imageIndex,
          dateStr,
          imageUrl: urls.get(entry.imageIndex) ?? null,
        }))
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that page.");
    } finally {
      setBusy(null);
    }
  };

  const updateDraft = (key: string, patch: Partial<Draft>) => {
    setDrafts((current) => current?.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)) ?? null);
  };

  const saveAll = async () => {
    if (!drafts?.length) return;
    if (drafts.some((draft) => !draft.foodName.trim())) {
      toast.error("Add a name or remove the blank row.");
      return;
    }
    if (drafts.some((draft) => !/^\d{4}-\d{2}-\d{2}$/.test(draft.dateStr))) {
      toast.error("Use a date like 2026-11-10.");
      return;
    }
    const logs = [];
    for (const draft of drafts) {
      const calories = nonNeg(draft.calories);
      const protein = nonNeg(draft.protein);
      const carbs = nonNeg(draft.carbs);
      const fat = nonNeg(draft.fat);
      const fiber = nonNeg(draft.fiber);
      if (calories == null || protein == null || carbs == null || fat == null || fiber == null) {
        toast.error("Macros need to be numbers.");
        return;
      }
      logs.push({
        dateStr: draft.dateStr,
        mealType: draft.mealType,
        foodName: draft.foodName.trim(),
        portion: draft.portion.trim() || null,
        time: draft.time.trim() || null,
        calories,
        protein,
        carbs,
        fat,
        fiber,
        imageUrl: draft.imageUrl,
      });
    }
    setBusy("save");
    try {
      const result = await save.mutateAsync({ logs });
      toast.success(`Saved ${result.saved} ${result.saved === 1 ? "meal" : "meals"}.`);
      setDrafts(null);
      setPages([]);
      setDataUrls([]);
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save those meals.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-4 border shadow-sm" style={{ borderColor: "#f0e8e4" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-1">Written log</p>
      <h2 className="text-lg font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
        Scan my written log
      </h2>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        Photograph the page you wrote — a meal or a whole day, up to four pages. You can fix anything before it is saved.
        The plate camera inside Log food is unchanged.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              toast.error("Sign in to scan a written log. The photo is saved with your account so your coach can see it.");
              return;
            }
            cameraRef.current?.click();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold text-white"
          style={{ background: "#2d3b2d" }}
        >
          <Camera size={14} />
          Take photo
        </button>
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              toast.error("Sign in to scan a written log. The photo is saved with your account so your coach can see it.");
              return;
            }
            libraryRef.current?.click();
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold border"
          style={{ borderColor: "#f0e8e4", background: "#faf5f5", color: "#2d3b2d" }}
        >
          <NotebookPen size={14} style={{ color: "#c9a96e" }} />
          Choose pages
        </button>
      </div>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {pages.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {pages.map((page, index) => (
            <div key={page.key} className="relative shrink-0">
              <img src={page.previewUrl} alt="" className="h-20 w-16 rounded-xl object-cover border" style={{ borderColor: "#f0e8e4" }} />
              <button
                type="button"
                aria-label={`Remove page ${index + 1}`}
                onClick={() => removePage(index)}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white border text-[10px] font-bold"
                style={{ borderColor: "#f0e8e4", color: "#2d3b2d" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => void readLog()}
        disabled={busy != null || pages.length === 0}
        className="mt-3 w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
        style={{ background: "#2d3b2d" }}
      >
        {busy === "read" ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Reading your handwriting…
          </span>
        ) : (
          "Read my log"
        )}
      </button>

      {drafts && drafts.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-bold text-gray-500">
              Date for every meal
              <input
                type="date"
                value={sharedDate}
                onChange={(event) => setSharedDate(event.target.value)}
                className="mt-1 block p-2 rounded-xl border text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => setDrafts((current) => current?.map((draft) => ({ ...draft, dateStr: sharedDate })) ?? null)}
              className="text-xs font-bold px-3 py-2 rounded-full border"
              style={{ borderColor: "#f0e8e4", color: "#2d3b2d" }}
            >
              Apply to all
            </button>
          </div>

          {drafts.map((draft) => (
            <div key={draft.key} className="rounded-2xl border p-3 space-y-2" style={{ borderColor: "#f0e8e4", background: "#fcfaf9" }}>
              {(draft.unclear || draft.confidence === "low") && (
                <p className="text-xs leading-relaxed rounded-xl px-3 py-2" style={{ background: "#fbeee9", color: "#2d3b2d" }}>
                  {draft.note || "Check this one — the handwriting was hard to read."}
                </p>
              )}
              <div className="flex gap-2">
                {draft.imageIndex < pages.length && (
                  <img src={pages[draft.imageIndex].previewUrl} alt="" className="h-14 w-12 rounded-lg object-cover" />
                )}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <select
                    aria-label="Meal"
                    value={draft.mealType}
                    onChange={(event) => updateDraft(draft.key, { mealType: event.target.value as MealType })}
                    className="p-2 rounded-xl border text-sm bg-white"
                  >
                    {MEALS.map((meal) => (
                      <option key={meal} value={meal}>
                        {meal[0].toUpperCase() + meal.slice(1)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    aria-label="Date"
                    value={draft.dateStr}
                    onChange={(event) => updateDraft(draft.key, { dateStr: event.target.value })}
                    className="p-2 rounded-xl border text-sm bg-white"
                  />
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${draft.foodName || "entry"}`}
                  onClick={() => setDrafts((current) => current?.filter((item) => item.key !== draft.key) ?? null)}
                  className="h-9 w-9 shrink-0 rounded-full border flex items-center justify-center"
                  style={{ borderColor: "#f0e8e4" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <input
                aria-label="Food"
                value={draft.foodName}
                onChange={(event) => updateDraft(draft.key, { foodName: event.target.value })}
                className="w-full p-2.5 rounded-xl border text-sm bg-white"
                placeholder="Food"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  aria-label="Portion"
                  value={draft.portion}
                  onChange={(event) => updateDraft(draft.key, { portion: event.target.value })}
                  className="p-2 rounded-xl border text-sm bg-white"
                  placeholder="Portion"
                />
                <input
                  aria-label="Time"
                  value={draft.time}
                  onChange={(event) => updateDraft(draft.key, { time: event.target.value })}
                  className="p-2 rounded-xl border text-sm bg-white"
                  placeholder="Time"
                />
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(
                  [
                    ["calories", "Cal"],
                    ["protein", "Pro"],
                    ["carbs", "Carb"],
                    ["fat", "Fat"],
                    ["fiber", "Fib"],
                  ] as const
                ).map(([field, label]) => (
                  <label key={field} className="text-[9px] font-bold uppercase text-gray-400">
                    {label}
                    <input
                      type="number"
                      min={0}
                      aria-label={label}
                      value={draft[field]}
                      onChange={(event) => updateDraft(draft.key, { [field]: event.target.value })}
                      className="mt-1 w-full p-1.5 rounded-lg border text-xs bg-white"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => void saveAll()}
            disabled={busy != null || drafts.length === 0}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-50"
            style={{ background: "#2d3b2d" }}
          >
            {busy === "save" ? "Saving…" : `Save all (${drafts.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
