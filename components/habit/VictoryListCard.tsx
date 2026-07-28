"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { getDeviceId } from "@/lib/deviceId";

type Props = {
  dateStr: string;
  isAuthenticated: boolean;
  /** Prefill from parent if already loaded */
  initial?: { win1: string; win2: string; win3: string } | null;
  compact?: boolean;
  autoFocus?: boolean;
  onSaved?: () => void;
};

export function VictoryListCard({
  dateStr,
  isAuthenticated,
  initial,
  compact,
  autoFocus,
  onSaved,
}: Props) {
  const [win1, setWin1] = useState(initial?.win1 ?? "");
  const [win2, setWin2] = useState(initial?.win2 ?? "");
  const [win3, setWin3] = useState(initial?.win3 ?? "");
  const [open, setOpen] = useState(!!autoFocus);

  const utils = trpc.useUtils();
  const saveMutation = trpc.habit.saveVictoryList.useMutation({
    onSuccess: () => {
      toast.success("Victories saved — evidence for future you");
      utils.habit.getVictoryLists.invalidate();
      onSaved?.();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (initial) {
      setWin1(initial.win1);
      setWin2(initial.win2);
      setWin3(initial.win3);
    }
  }, [initial?.win1, initial?.win2, initial?.win3]);

  useEffect(() => {
    if (!isAuthenticated) {
      try {
        const raw = localStorage.getItem("mbr_victory_lists");
        const map = raw ? JSON.parse(raw) : {};
        const row = map[dateStr];
        if (row) {
          setWin1(row.win1 || "");
          setWin2(row.win2 || "");
          setWin3(row.win3 || "");
        }
      } catch {
        /* ignore */
      }
    }
  }, [dateStr, isAuthenticated]);

  const handleSave = () => {
    if (isAuthenticated) {
      saveMutation.mutate({
        dateStr,
        win1,
        win2,
        win3,
        deviceId: getDeviceId(),
      });
    } else {
      try {
        const raw = localStorage.getItem("mbr_victory_lists");
        const map = raw ? JSON.parse(raw) : {};
        map[dateStr] = { win1, win2, win3 };
        localStorage.setItem("mbr_victory_lists", JSON.stringify(map));
        saveMutation.mutate({
          dateStr,
          win1,
          win2,
          win3,
          deviceId: getDeviceId(),
        });
      } catch {
        toast.error("Could not save locally");
      }
    }
  };

  const filled = [win1, win2, win3].filter((w) => w.trim()).length;

  return (
    <div
      className="bg-white rounded-3xl border shadow-sm overflow-hidden"
      style={{ borderColor: "#f0e8e4" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-[#faf5f5] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "#faf5f5" }}
          >
            <Sparkles size={18} style={{ color: "#c9a96e" }} />
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: "#2d3b2d" }}>
              Today&apos;s victory list
            </h3>
            <p className="text-xs text-gray-500">
              {filled > 0 ? `${filled}/3 wins logged` : "What did you do right today?"}
            </p>
          </div>
        </div>
        <span className="text-[#8a9a8a] text-sm font-bold">{open ? "−" : "+"}</span>
      </button>

      {open && (
        <div className="px-4 md:px-5 pb-5 space-y-3 border-t" style={{ borderColor: "#f0e8e4" }}>
          <p className="text-xs text-gray-500 pt-3">
            Track wins, not just misses. Your brain is a scoreboard — count what went right.
          </p>
          {[
            { v: win1, set: setWin1, ph: "Win 1 — e.g. hit protein, walked, paused a craving" },
            { v: win2, set: setWin2, ph: "Win 2" },
            { v: win3, set: setWin3, ph: "Win 3" },
          ].map((row, i) => (
            <input
              key={i}
              value={row.v}
              onChange={(e) => row.set(e.target.value)}
              placeholder={row.ph}
              maxLength={280}
              className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/40"
              style={{ borderColor: "#f0e8e4", background: "#fcfaf9", color: "#2d3b2d" }}
            />
          ))}
          <div className="flex justify-end pt-1">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="rounded-full px-6"
              style={{ background: "#c9a96e", color: "white" }}
            >
              {saveMutation.isPending ? "Saving…" : "Save victories"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
