"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X } from "lucide-react";

const SKIP_KEY = "mbr_onboarding_pack_done";

export function OnboardingPackModal({
  isAuthenticated,
  onApplied,
}: {
  isAuthenticated: boolean;
  onApplied?: () => void;
}) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(SKIP_KEY);
  });

  const { data: packs } = trpc.habit.getPacks.useQuery(undefined, {
    enabled: open,
  });
  const utils = trpc.useUtils();
  const applyMutation = trpc.habit.applyPack.useMutation({
    onSuccess: () => {
      toast.success("Your focus habits are ready");
      localStorage.setItem(SKIP_KEY, "1");
      setOpen(false);
      utils.habit.getUserHabits.invalidate();
      onApplied?.();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!open) return null;

  const applyLocal = (pack: {
    items: Array<{
      title: string;
      description?: string | null;
      type: "boolean" | "numeric";
      targetValue?: number | null;
      unit?: string | null;
    }>;
  }) => {
    const habits = pack.items.map((it, i) => ({
      id: Date.now() + i,
      title: it.title,
      description: it.description,
      type: it.type,
      targetValue: it.targetValue ?? null,
      unit: it.unit ?? null,
      isActive: true,
    }));
    localStorage.setItem("mbr_habits", JSON.stringify(habits));
    localStorage.setItem(SKIP_KEY, "1");
    setOpen(false);
    toast.success("Your focus habits are ready");
    onApplied?.();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto"
        style={{ border: "1px solid #f0e8e4" }}
      >
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: "#f0e8e4" }}>
          <div>
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "#2d3b2d" }}
            >
              Pick a starting focus
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              2 minutes a day. Choose a pack — you can change habits later.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(SKIP_KEY, "1");
              setOpen(false);
            }}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400"
            aria-label="Skip"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          {(packs || []).map((pack) => (
            <button
              key={pack.id}
              type="button"
              disabled={applyMutation.isPending}
              onClick={() => {
                if (isAuthenticated) applyMutation.mutate({ packId: pack.id });
                else applyLocal(pack);
              }}
              className="w-full text-left p-4 rounded-2xl border hover:shadow-md transition-all"
              style={{ borderColor: pack.isDefault ? "#c9a96e" : "#f0e8e4" }}
            >
              <p className="font-bold text-sm" style={{ color: "#2d3b2d" }}>
                {pack.title}
                {pack.isDefault && (
                  <span className="ml-2 text-[10px] uppercase tracking-wide text-[#c9a96e]">
                    Recommended
                  </span>
                )}
              </p>
              {pack.description && (
                <p className="text-xs text-gray-500 mt-1">{pack.description}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                {pack.items?.length || 0} habits
              </p>
            </button>
          ))}
          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={() => {
              localStorage.setItem(SKIP_KEY, "1");
              setOpen(false);
            }}
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );
}
