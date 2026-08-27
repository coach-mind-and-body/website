"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function AdminSprintTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.sprint.get.useQuery();
  const [newTitle, setNewTitle] = useState("");

  const invalidate = () => utils.sprint.get.invalidate();

  const toggle = trpc.sprint.toggle.useMutation({
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });
  const updateNotes = trpc.sprint.updateNotes.useMutation({
    onError: (e) => toast.error(e.message),
  });
  const add = trpc.sprint.add.useMutation({
    onSuccess: () => {
      setNewTitle("");
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.sprint.remove.useMutation({
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const doneCount = items.filter((i) => i.done).length;

  return (
    <div>
      <h2
        className="font-bold text-2xl mb-1"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        This month
      </h2>
      <p className="text-sm mb-6" style={{ color: "oklch(0.52 0.015 50)" }}>
        {data?.period ?? "—"} · {doneCount}/{items.length} done. Check things off. Add a row at the bottom anytime.
      </p>

      {isLoading ? (
        <Loader2 className="animate-spin" style={{ color: "oklch(0.72 0.12 75)" }} />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl p-4"
              style={{ background: "oklch(1 0 0)" }}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle.mutate({ id: item.id })}
                  className="mt-1 h-4 w-4 accent-[oklch(0.42_0.09_140)]"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: "oklch(0.20 0.015 50)",
                      textDecoration: item.done ? "line-through" : "none",
                      opacity: item.done ? 0.55 : 1,
                    }}
                  >
                    {item.title}
                  </p>
                  <input
                    defaultValue={item.notes}
                    placeholder="Note…"
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== item.notes) updateNotes.mutate({ id: item.id, notes: v });
                    }}
                    className="mt-1 w-full text-xs bg-transparent outline-none"
                    style={{ color: "oklch(0.52 0.015 50)" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Remove this item?")) remove.mutate({ id: item.id });
                  }}
                  className="p-1 rounded hover:bg-black/5"
                  aria-label="Remove"
                >
                  <Trash2 size={14} style={{ color: "oklch(0.65 0.02 50)" }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const t = newTitle.trim();
          if (!t) return;
          add.mutate({ title: t });
        }}
      >
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add something you want on this list…"
          className="flex-1 rounded-xl px-4 py-3 text-sm outline-none"
          style={{ background: "oklch(1 0 0)", color: "oklch(0.20 0.015 50)" }}
        />
        <button
          type="submit"
          disabled={add.isPending || !newTitle.trim()}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: "oklch(0.72 0.12 75)" }}
        >
          <Plus size={16} /> Add
        </button>
      </form>
    </div>
  );
}
