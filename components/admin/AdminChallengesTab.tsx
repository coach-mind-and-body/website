"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function AdminChallengesTab() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(7);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [linkedPodcastSlug, setLinkedPodcastSlug] = useState("");
  const [linkedBlogSlug, setLinkedBlogSlug] = useState("");
  const [themeTag, setThemeTag] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [meetUrl, setMeetUrl] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const { data: challenges, refetch } = trpc.challenges.adminListChallenges.useQuery();

  const createMutation = trpc.challenges.createChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge created!");
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.challenges.updateChallenge.useMutation({
    onSuccess: () => {
      toast.success("Challenge updated");
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const broadcastMutation = trpc.push.broadcastChallenge.useMutation({
    onSuccess: (data) => toast.success(`Push sent to ${data.sentCount} devices`),
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setDescription("");
    setDuration(7);
    setStartDate("");
    setEndDate("");
    setLinkedPodcastSlug("");
    setLinkedBlogSlug("");
    setThemeTag("");
    setIsFeatured(false);
    setMeetUrl("");
  };

  const handleSave = () => {
    if (!title) return toast.error("Title is required");
    const payload = {
      title,
      description,
      durationDays: duration,
      startDate: startDate || null,
      endDate: endDate || null,
      linkedPodcastSlug: linkedPodcastSlug || null,
      linkedBlogSlug: linkedBlogSlug || null,
      themeTag: themeTag || null,
      isFeatured,
      featuredOrder: 0,
      isActive: true,
      meetUrl: meetUrl || null,
    };
    if (editId) {
      updateMutation.mutate({ id: editId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <h2
        className="font-bold text-2xl mb-6"
        style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
      >
        Manage Challenges
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          className="p-6 rounded-2xl border"
          style={{ background: "oklch(0.96 0.025 50)", borderColor: "oklch(0.90 0.015 80)" }}
        >
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>
            {editId ? "Edit Challenge" : "Create Challenge"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm block mb-1">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="7 Days of Hydration" />
            </div>
            <div>
              <label className="text-sm block mb-1">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm block mb-1">Duration (days)</label>
                <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
              <div>
                <label className="text-sm block mb-1">Theme tag</label>
                <Input value={themeTag} onChange={(e) => setThemeTag(e.target.value)} placeholder="victory_list" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm block mb-1">Start date</label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm block mb-1">End date</label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-1">Podcast slug</label>
              <Input
                value={linkedPodcastSlug}
                onChange={(e) => setLinkedPodcastSlug(e.target.value)}
                placeholder="patterns-not-the-belly-weight-loss-after-40"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Blog slug</label>
              <Input
                value={linkedBlogSlug}
                onChange={(e) => setLinkedBlogSlug(e.target.value)}
                placeholder="patterns-not-the-belly-unlocking-weight-loss-success-after-40"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Google Meet URL (enrolled people only)</label>
              <Input
                value={meetUrl}
                onChange={(e) => setMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
              Featured in app
            </label>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
              >
                {editId ? "Update" : "Create"}
              </Button>
              {editId && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4" style={{ color: "oklch(0.20 0.015 50)" }}>
            All challenges
          </h3>
          <div className="space-y-3">
            {(challenges || []).map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl border bg-white flex flex-col gap-2"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <div className="font-bold" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {c.title}
                      {!c.isActive && (
                        <span className="ml-2 text-xs text-gray-400">inactive</span>
                      )}
                      {c.isFeatured && (
                        <span className="ml-2 text-xs text-[#c9a96e] font-bold">featured</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.durationDays}d · joins {c.joinCount} · completed {c.completedCount}
                      {c.linkedPodcastSlug && ` · podcast: ${c.linkedPodcastSlug}`}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditId(c.id);
                      setTitle(c.title);
                      setDescription(c.description || "");
                      setDuration(c.durationDays);
                      setStartDate(c.startDate || "");
                      setEndDate(c.endDate || "");
                      setLinkedPodcastSlug(c.linkedPodcastSlug || "");
                      setLinkedBlogSlug(c.linkedBlogSlug || "");
                      setThemeTag(c.themeTag || "");
                      setIsFeatured(!!c.isFeatured);
                      setMeetUrl(c.meetUrl || "");
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateMutation.mutate({ id: c.id, isActive: !c.isActive })
                    }
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => broadcastMutation.mutate({ challengeId: c.id })}
                    disabled={broadcastMutation.isPending}
                    style={{ borderColor: "oklch(0.72 0.12 75)", color: "oklch(0.72 0.12 75)" }}
                  >
                    Push 📢
                  </Button>
                </div>
              </div>
            ))}
            {(challenges || []).length === 0 && (
              <p className="text-gray-500">No challenges yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
