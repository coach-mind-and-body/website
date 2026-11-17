"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { fastingHoursError } from "@shared/fasting";

export const FASTING_LOCAL_KEY = "mbr_fasting_logs";

export type LocalFasting = {
  dateStr: string;
  didFast: boolean;
  hours: number | null;
  notes: string | null;
};

export function loadLocalFasting(): LocalFasting[] {
  try {
    const raw = localStorage.getItem(FASTING_LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalFasting(rows: LocalFasting[]) {
  localStorage.setItem(FASTING_LOCAL_KEY, JSON.stringify(rows));
}

/** Compact saved-row copy. Whole hours stay whole; halves keep one decimal. */
export function fastingAnswerLabel(didFast: boolean, hours: number | null): string {
  if (!didFast) return "Didn't fast";
  if (hours == null || !Number.isFinite(hours)) return "Fasted";
  const halves = Math.round(hours * 2) / 2;
  const text = Number.isInteger(halves) ? String(halves) : halves.toFixed(1);
  return `Fasted ${text} hrs`;
}

export default function FastingToday({
  dateStr,
  isAuthenticated,
}: {
  dateStr: string;
  isAuthenticated: boolean;
}) {
  const utils = trpc.useUtils();
  const query = trpc.calories.getFasting.useQuery({ dateStr }, { enabled: isAuthenticated });
  const [expanded, setExpanded] = useState(false);
  const [localSaved, setLocalSaved] = useState<LocalFasting | null>(null);
  const save = trpc.calories.saveFasting.useMutation({
    onSuccess: (day) => {
      toast.success("Fasting saved");
      utils.calories.getFasting.setData({ dateStr }, day);
      void utils.calories.getFasting.invalidate({ dateStr });
      setExpanded(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const [answered, setAnswered] = useState(false);
  const [didFast, setDidFast] = useState(false);
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  const savedForDay: LocalFasting | null = isAuthenticated
    ? query.data && query.data.dateStr === dateStr && query.data.recorded
      ? {
          dateStr: query.data.dateStr,
          didFast: query.data.didFast,
          hours: query.data.hours,
          notes: query.data.notes,
        }
      : null
    : localSaved && localSaved.dateStr === dateStr
      ? localSaved
      : null;

  useEffect(() => {
    setExpanded(false);
    setLocalSaved(null);
    setAnswered(false);
    setDidFast(false);
    setHours("");
    setNotes("");
  }, [dateStr, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      if (!query.data || query.data.dateStr !== dateStr) return;
      setAnswered(query.data.recorded);
      setDidFast(query.data.didFast);
      setHours(query.data.hours == null ? "" : String(query.data.hours));
      setNotes(query.data.notes ?? "");
      return;
    }
    const row = loadLocalFasting().find((item) => item.dateStr === dateStr) ?? null;
    setLocalSaved(row);
    setAnswered(Boolean(row));
    setDidFast(row?.didFast ?? false);
    setHours(row?.hours == null ? "" : String(row.hours));
    setNotes(row?.notes ?? "");
  }, [dateStr, isAuthenticated, query.data]);

  const choose = (value: boolean) => {
    setAnswered(true);
    setDidFast(value);
    if (!value) setHours("");
    setExpanded(true);
  };

  const collapse = () => {
    setExpanded(false);
    if (savedForDay) {
      setAnswered(true);
      setDidFast(savedForDay.didFast);
      setHours(savedForDay.hours == null ? "" : String(savedForDay.hours));
      setNotes(savedForDay.notes ?? "");
      return;
    }
    setAnswered(false);
    setDidFast(false);
    setHours("");
    setNotes("");
  };

  const openSaved = () => {
    if (savedForDay) {
      setAnswered(true);
      setDidFast(savedForDay.didFast);
      setHours(savedForDay.hours == null ? "" : String(savedForDay.hours));
      setNotes(savedForDay.notes ?? "");
    }
    setExpanded(true);
  };

  const onSave = () => {
    if (!answered) {
      toast.error("Choose yes or no first.");
      return;
    }
    const trimmedHours = hours.trim();
    const hoursValue = trimmedHours === "" ? null : Number(trimmedHours);
    if (trimmedHours !== "" && Number.isNaN(hoursValue)) {
      toast.error("Use whole hours or halves, like 16 or 18.5.");
      return;
    }
    const hoursError = fastingHoursError(didFast ? hoursValue : null);
    if (hoursError) {
      toast.error(hoursError);
      return;
    }
    const payload = {
      dateStr,
      didFast,
      hours: didFast ? hoursValue : null,
      notes: notes.trim() || null,
    };
    if (!isAuthenticated) {
      const rows = loadLocalFasting().filter((item) => item.dateStr !== dateStr);
      const stored: LocalFasting = {
        dateStr,
        didFast,
        hours: payload.hours,
        notes: payload.notes,
      };
      rows.unshift(stored);
      saveLocalFasting(rows);
      setLocalSaved(stored);
      setExpanded(false);
      toast.success("Saved on this device");
      return;
    }
    save.mutate(payload);
  };

  const summary = savedForDay ? fastingAnswerLabel(savedForDay.didFast, savedForDay.hours) : null;

  return (
    <section
      className="bg-white rounded-2xl shadow-sm border px-3 py-2.5"
      style={{ borderColor: "#f0e8e4" }}
    >
      {summary && !expanded ? (
        <button
          type="button"
          onClick={openSaved}
          aria-expanded={false}
          className="flex w-full items-center gap-2 bg-transparent p-0 text-left"
        >
          <span className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: "#2d3b2d" }}>
            {summary}
          </span>
          <ChevronDown size={16} color="#c9a96e" aria-hidden />
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate text-sm font-bold" style={{ color: "#2d3b2d" }}>
            Did you fast today?
          </p>
          <div className="flex shrink-0 gap-2">
            {([
              ["Yes", true],
              ["No", false],
            ] as const).map(([label, value]) => {
              const selected = answered && didFast === value;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => choose(value)}
                  className="px-3 py-1 rounded-full text-sm font-bold border"
                  style={{
                    borderColor: selected ? "#2d3b2d" : "#f0e8e4",
                    background: selected ? "#2d3b2d" : "#faf5f5",
                    color: selected ? "#ffffff" : "#2d3b2d",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {expanded && (
            <button
              type="button"
              onClick={collapse}
              aria-label="Close"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            >
              <ChevronUp size={16} color="#c9a96e" aria-hidden />
            </button>
          )}
        </div>
      )}
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="min-h-0 overflow-hidden" inert={!expanded} aria-hidden={!expanded}>
          <div className="space-y-3 pt-3">
            {answered && didFast && (
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">Hours fasted</span>
                <input
                  inputMode="decimal"
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                  placeholder="16 or 18.5"
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                  style={{ borderColor: "#f0e8e4", color: "#2d3b2d" }}
                />
              </label>
            )}
            <label className="block">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a]">Fasting notes</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: "#f0e8e4", color: "#2d3b2d" }}
              />
            </label>
            <button
              type="button"
              onClick={onSave}
              disabled={save.isPending}
              className="rounded-full px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "#c9a96e" }}
            >
              {save.isPending ? "Saving…" : "Save fasting"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
