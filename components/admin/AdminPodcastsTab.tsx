"use client";

import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, RotateCcw } from "lucide-react";

type HabitAction = {
  title: string;
  type?: "boolean" | "numeric";
  targetValue?: number | null;
  unit?: string | null;
  description?: string | null;
};

function parseActions(json: string | null | undefined): HabitAction[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function AdminPodcastsTab() {
  const utils = trpc.useUtils();
  const { data, isLoading, refetch, isFetching } =
    trpc.podcast.adminListFromYoutube.useQuery();
  const { data: challenges } = trpc.challenges.adminListChallenges.useQuery();

  const updateMeta = trpc.podcast.adminUpdateHabitMeta.useMutation({
    onSuccess: () => {
      toast.success("Episode updated");
      utils.podcast.adminListFromYoutube.invalidate();
      utils.podcast.getEpisodes.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const payload = data && !Array.isArray(data) ? data : null;
  const episodes = payload?.episodes ?? [];
  const defaultActions = payload?.defaultActions ?? [];

  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const selected = useMemo(
    () => episodes.find((e: { videoId: string }) => e.videoId === selectedVideoId) || episodes[0] || null,
    [episodes, selectedVideoId]
  );

  const [actions, setActions] = useState<HabitAction[]>([]);
  const [blogSlug, setBlogSlug] = useState("");
  const [challengeId, setChallengeId] = useState<string>("");

  useEffect(() => {
    if (!selected) return;
    setActions(parseActions(selected.habitActionsJson));
    setBlogSlug(selected.linkedBlogSlug || "");
    setChallengeId(
      selected.linkedChallengeId != null ? String(selected.linkedChallengeId) : ""
    );
  }, [selected?.videoId, selected?.habitActionsJson, selected?.linkedBlogSlug, selected?.linkedChallengeId]);

  useEffect(() => {
    if (!selectedVideoId && episodes[0]) setSelectedVideoId(episodes[0].videoId);
  }, [episodes, selectedVideoId]);

  const save = () => {
    if (!selected) return;
    const cleaned = actions
      .map((a) => ({
        title: a.title.trim(),
        type: a.type || "boolean",
        description: a.description?.trim() || null,
        targetValue: a.type === "numeric" ? a.targetValue ?? null : null,
        unit: a.type === "numeric" ? a.unit || null : null,
      }))
      .filter((a) => a.title);
    updateMeta.mutate({
      videoId: selected.videoId,
      title: selected.title,
      habitActionsJson: JSON.stringify(cleaned),
      linkedBlogSlug: blogSlug.trim() || null,
      linkedChallengeId: challengeId ? Number(challengeId) : null,
    });
  };

  const resetDefaults = () => {
    if (!selected) return;
    if (!confirm("Reset habit actions to the site defaults for this episode?")) return;
    updateMeta.mutate({
      videoId: selected.videoId,
      resetToDefaults: true,
    });
  };

  if (isLoading) {
    return (
      <div className="py-12 flex justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2
            className="font-bold text-2xl mb-1"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Podcast episodes
          </h2>
          <p className="text-sm text-gray-500 max-w-xl">
            Episodes sync from YouTube automatically. Each one gets{" "}
            <strong>default habit actions</strong> (3 wins / who&apos;s driving / walk). Edit
            anytime — your edits are never overwritten by the auto-sync.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh from YouTube"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* List */}
        <div className="lg:col-span-2 space-y-2 max-h-[70vh] overflow-y-auto pr-1">
          {episodes.map((ep: (typeof episodes)[number]) => {
            const active = selected?.videoId === ep.videoId;
            const actionCount = parseActions(ep.habitActionsJson).length;
            return (
              <button
                key={ep.videoId}
                type="button"
                onClick={() => setSelectedVideoId(ep.videoId)}
                className="w-full text-left p-3 rounded-xl border transition-all"
                style={{
                  borderColor: active ? "oklch(0.72 0.12 75)" : "oklch(0.90 0.015 80)",
                  background: active ? "oklch(0.98 0.02 75)" : "white",
                }}
              >
                <div className="flex gap-3">
                  {ep.thumbnail && (
                    <img
                      src={ep.thumbnail}
                      alt=""
                      className="w-16 h-10 object-cover rounded-lg shrink-0 bg-gray-100"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold line-clamp-2" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {ep.title}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {actionCount} actions
                      {ep.hasShowNotes ? " · show notes" : " · auto defaults"}
                      {ep.linkedBlogSlug ? " · blog" : ""}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
          {episodes.length === 0 && (
            <p className="text-sm text-gray-500">No episodes found from YouTube yet.</p>
          )}
        </div>

        {/* Editor */}
        <div
          className="lg:col-span-3 p-5 rounded-2xl border bg-white"
          style={{ borderColor: "oklch(0.90 0.015 80)" }}
        >
          {!selected ? (
            <p className="text-gray-500 text-sm">Select an episode to edit habit actions.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                  Editing
                </p>
                <h3 className="font-bold text-lg" style={{ color: "oklch(0.20 0.015 50)" }}>
                  {selected.title}
                </h3>
                <a
                  href={`https://youtu.be/${selected.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#c9a96e] font-semibold underline"
                >
                  Open on YouTube
                </a>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
                    Habit actions (shown in app)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setActions((a) => [
                          ...a,
                          { title: "", type: "boolean", description: "" },
                        ])
                      }
                    >
                      <Plus size={14} className="mr-1" /> Add
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={resetDefaults}>
                      <RotateCcw size={14} className="mr-1" /> Defaults
                    </Button>
                  </div>
                </div>

                {actions.map((a, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border space-y-2"
                    style={{ borderColor: "oklch(0.92 0.01 80)", background: "oklch(0.99 0.005 80)" }}
                  >
                    <div className="flex gap-2">
                      <Input
                        value={a.title}
                        onChange={(e) => {
                          const next = [...actions];
                          next[i] = { ...next[i], title: e.target.value };
                          setActions(next);
                        }}
                        placeholder="Habit title"
                        className="flex-1"
                      />
                      <select
                        value={a.type || "boolean"}
                        onChange={(e) => {
                          const next = [...actions];
                          next[i] = {
                            ...next[i],
                            type: e.target.value as "boolean" | "numeric",
                          };
                          setActions(next);
                        }}
                        className="text-sm border rounded-lg px-2"
                      >
                        <option value="boolean">Yes/No</option>
                        <option value="numeric">Number</option>
                      </select>
                      <button
                        type="button"
                        className="p-2 text-gray-400 hover:text-red-500"
                        onClick={() => setActions(actions.filter((_, j) => j !== i))}
                        aria-label="Remove"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <Input
                      value={a.description || ""}
                      onChange={(e) => {
                        const next = [...actions];
                        next[i] = { ...next[i], description: e.target.value };
                        setActions(next);
                      }}
                      placeholder="Short description (optional)"
                    />
                    {a.type === "numeric" && (
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={a.targetValue ?? ""}
                          onChange={(e) => {
                            const next = [...actions];
                            next[i] = {
                              ...next[i],
                              targetValue: e.target.value ? Number(e.target.value) : null,
                            };
                            setActions(next);
                          }}
                          placeholder="Target"
                          className="w-28"
                        />
                        <Input
                          value={a.unit || ""}
                          onChange={(e) => {
                            const next = [...actions];
                            next[i] = { ...next[i], unit: e.target.value };
                            setActions(next);
                          }}
                          placeholder="Unit"
                          className="w-28"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {actions.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No actions — app will still fall back to site defaults until you save empty.
                    Prefer “Defaults” if unsure.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Linked blog slug (optional)
                  </label>
                  <Input
                    value={blogSlug}
                    onChange={(e) => setBlogSlug(e.target.value)}
                    placeholder="patterns-not-the-belly-…"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">
                    Linked challenge (optional)
                  </label>
                  <select
                    value={challengeId}
                    onChange={(e) => setChallengeId(e.target.value)}
                    className="w-full h-10 text-sm border rounded-lg px-3 bg-white"
                  >
                    <option value="">None</option>
                    {(challenges || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={save}
                  disabled={updateMeta.isPending}
                  style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
                >
                  {updateMeta.isPending ? "Saving…" : "Save episode"}
                </Button>
              </div>

              {defaultActions.length > 0 && (
                <p className="text-[11px] text-gray-400 pt-2 border-t">
                  Site defaults:{" "}
                  {defaultActions.map((d: { title: string }) => d.title).join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
