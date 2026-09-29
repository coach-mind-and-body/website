"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { REAL_FOOD_RESET } from "@shared/realFoodReset";
import { todayMountainDateStr } from "@/lib/mountainTime";

export function AdminRealFoodResetTab() {
  const { data: leads, refetch } = trpc.leadgen.adminListRealFoodReset.useQuery();
  const { data: videos, refetch: refetchVideos } = trpc.challenges.adminListDayVideos.useQuery();
  const [dateStr, setDateStr] = useState(todayMountainDateStr());
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const saveVideo = trpc.challenges.adminSetDayVideo.useMutation({
    onSuccess: () => {
      toast.success("Replay is in the app under Challenge");
      refetchVideos();
      setUrl("");
    },
    onError: (e) => toast.error(e.message),
  });
  const draftEmail = trpc.challenges.adminDraftDayVideoEmail.useMutation({
    onSuccess: () => {
      toast.success("Email draft created — open Newsletters to send it");
    },
    onError: (e) => toast.error(e.message),
  });
  const removeLead = trpc.leadgen.adminDeleteRealFoodReset.useMutation({
    onSuccess: () => {
      toast.success("Challenge lead removed");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2
            className="font-bold text-2xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            {REAL_FOOD_RESET.name} Leads
          </h2>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
            Sign-ups from{" "}
            <a
              href={REAL_FOOD_RESET.path}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: "oklch(0.72 0.12 75)" }}
            >
              mindandbodyresetcoach.com{REAL_FOOD_RESET.path}
            </a>
            . Anyone who filled out the landing-page form. Same list as the newsletter audience
            “No Processed Food Challenge.”
          </p>
        </div>
        <div className="rounded-xl px-5 py-4 text-center" style={{ background: "oklch(1 0 0)", minWidth: "140px" }}>
          <div
            className="text-3xl font-bold"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            {leads?.length ?? 0}
          </div>
          <div className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
            Unique emails in DB
          </div>
        </div>
      </div>
      <div
        className="rounded-2xl p-5 mb-8 space-y-3"
        style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.93 0.02 50)" }}
      >
        <h3 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Today’s live replay
        </h3>
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Meet recordings land in Drive. Open the file → Share → Anyone with the link (Viewer) → copy the link and
          paste it here. It embeds in Habit Tracker for that day. YouTube unlisted still works too. Then create an
          email draft — the button opens the recording in the browser. Send it from Newsletters.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
            Date
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
            Label (optional)
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Monday live replay"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal"
            />
          </label>
        </div>
        <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: "oklch(0.52 0.015 50)" }}>
          Drive or YouTube link
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://drive.google.com/file/d/…"
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saveVideo.isPending || !url.trim()}
            onClick={() => saveVideo.mutate({ dateStr, url: url.trim(), title: title.trim() || null })}
            className="rounded-full px-4 py-2 text-sm font-bold text-white"
            style={{ background: "oklch(0.32 0.04 145)" }}
          >
            {saveVideo.isPending ? "Saving…" : "Save to Challenge"}
          </button>
        </div>
        <label className="text-xs font-bold uppercase tracking-wide block" style={{ color: "oklch(0.52 0.015 50)" }}>
          Extra line for the email (optional)
          <textarea
            value={extraNote}
            onChange={(e) => setExtraNote(e.target.value)}
            rows={2}
            placeholder="Sorry we missed you at 1:00 — here’s the recording."
            className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-normal"
          />
        </label>
        <button
          type="button"
          disabled={draftEmail.isPending}
          onClick={() => draftEmail.mutate({ dateStr, extraNote: extraNote.trim() || undefined })}
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: "oklch(0.97 0.02 80)", color: "oklch(0.32 0.04 145)" }}
        >
          {draftEmail.isPending ? "Creating…" : "Create email draft"}
        </button>
        {videos && videos.length > 0 ? (
          <ul className="text-sm space-y-1 pt-2" style={{ color: "oklch(0.40 0.02 50)" }}>
            {videos
              .slice()
              .sort((a, b) => (a.dateStr < b.dateStr ? 1 : -1))
              .map((v) => (
                <li key={v.id}>
                  {v.dateStr}
                  {v.title ? ` · ${v.title}` : ""}
                  {v.watchUrl ? (
                    <>
                      {" — "}
                      <a href={v.watchUrl} className="underline" target="_blank" rel="noreferrer">
                        watch
                      </a>
                    </>
                  ) : null}
                </li>
              ))}
          </ul>
        ) : null}
      </div>

      <p className="text-xs mb-4 rounded-lg px-3 py-2" style={{ background: "oklch(0.97 0.02 80)", color: "oklch(0.40 0.02 50)" }}>
        This count is <strong>unique emails saved in our database</strong>. Meta Ads Lead events can be higher
        (duplicate submits, pixel + CAPI double-counting, test events, or a pixel fire before the DB write).
      </p>

      {leads && leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "oklch(1 0 0)" }}
            >
              <div>
                <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
                  {lead.firstName?.trim() || "—"}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <a href={`mailto:${lead.email}`} className="text-xs underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                    {lead.email}
                  </a>
                  <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {new Date(lead.createdAt).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("Remove this challenge lead? This cannot be undone.")) {
                    removeLead.mutate({ id: lead.id });
                  }
                }}
                disabled={removeLead.isPending}
                className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                style={{ background: "oklch(0.95 0.06 10)", color: "oklch(0.45 0.12 10)" }}
              >
                {removeLead.isPending ? "Removing..." : "Remove"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          No challenge sign-ups yet.
        </p>
      )}
    </div>
  );
}
