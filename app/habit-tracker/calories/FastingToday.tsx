"use client";

import { useEffect, useState } from "react";
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

export default function FastingToday({
  dateStr,
  isAuthenticated,
}: {
  dateStr: string;
  isAuthenticated: boolean;
}) {
  const utils = trpc.useUtils();
  const query = trpc.calories.getFasting.useQuery({ dateStr }, { enabled: isAuthenticated });
  const save = trpc.calories.saveFasting.useMutation({
    onSuccess: () => {
      toast.success("Fasting saved");
      utils.calories.getFasting.invalidate({ dateStr });
    },
    onError: (error) => toast.error(error.message),
  });

  const [answered, setAnswered] = useState(false);
  const [didFast, setDidFast] = useState(false);
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
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
    const row = loadLocalFasting().find((item) => item.dateStr === dateStr);
    setAnswered(Boolean(row));
    setDidFast(row?.didFast ?? false);
    setHours(row?.hours == null ? "" : String(row.hours));
    setNotes(row?.notes ?? "");
  }, [dateStr, isAuthenticated, query.data]);

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
      rows.unshift({
        dateStr,
        didFast,
        hours: payload.hours,
        notes: payload.notes,
      });
      saveLocalFasting(rows);
      toast.success("Saved on this device");
      return;
    }
    save.mutate(payload);
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 border" style={{ borderColor: "#f0e8e4" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#8a9a8a] mb-2">Fasting</p>
      <h2 className="text-lg font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}>
        Did you fast today?
      </h2>
      <div className="flex gap-2 mb-3">
        {([
          ["Yes", true],
          ["No", false],
        ] as const).map(([label, value]) => {
          const selected = answered && didFast === value;
          return (
            <button
              key={label}
              type="button"
              onClick={() => {
                setAnswered(true);
                setDidFast(value);
                if (!value) setHours("");
              }}
              className="px-4 py-2 rounded-full text-sm font-bold border"
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
      {answered && didFast && (
        <label className="block mb-3">
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
      <label className="block mb-3">
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
    </section>
  );
}
