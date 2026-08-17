"use client";

import { useState } from "react";
import { BookOpen, FolderOpen, Loader2, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { SITE_URL } from "@shared/brand";

export type SharePayload = {
  content?: string;
  mediaUrl?: string;
};

export function recipeShareText(title: string, slug: string) {
  return `A recipe for you: ${title}\n${SITE_URL}/habit-tracker/recipes/${slug}`;
}

export function parseRecipeSlug(content: string | null | undefined): string | null {
  if (!content) return null;
  const m = content.match(/\/habit-tracker\/recipes\/([a-z0-9-]+)/i);
  return m?.[1] ?? null;
}

export function ChatShareToolbar({
  onShare,
  allowFiles,
  compact,
}: {
  onShare: (payload: SharePayload) => void;
  allowFiles?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState<"recipe" | "file" | null>(null);
  const [q, setQ] = useState("");

  const { data: recipes, isLoading: recipesLoading } = trpc.food.listRecipes.useQuery(
    { q: q.trim() || undefined, includeDrafts: allowFiles },
    { enabled: open === "recipe" }
  );
  const { data: files, isLoading: filesLoading } = trpc.clientFiles.listCommon.useQuery(undefined, {
    enabled: allowFiles && open === "file",
  });

  const btn =
    "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-bold border";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={btn}
          style={{
            borderColor: open === "recipe" ? "#2d3b2d" : "#f0e8e4",
            background: open === "recipe" ? "#2d3b2d" : "white",
            color: open === "recipe" ? "white" : "#2d3b2d",
          }}
          onClick={() => setOpen(open === "recipe" ? null : "recipe")}
        >
          <BookOpen size={13} /> Recipe
        </button>
        {allowFiles && (
          <button
            type="button"
            className={btn}
            style={{
              borderColor: open === "file" ? "#2d3b2d" : "#f0e8e4",
              background: open === "file" ? "#2d3b2d" : "white",
              color: open === "file" ? "white" : "#2d3b2d",
            }}
            onClick={() => setOpen(open === "file" ? null : "file")}
          >
            <FolderOpen size={13} /> File
          </button>
        )}
      </div>

      {open === "recipe" && (
        <div className="rounded-2xl border bg-white p-2 max-h-48 overflow-y-auto" style={{ borderColor: "#f0e8e4" }}>
          <div className="flex items-center gap-2 mb-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search recipes…"
              className="flex-1 text-xs px-2 py-1.5 rounded-lg border"
              style={{ borderColor: "#f0e8e4" }}
            />
            <button type="button" onClick={() => setOpen(null)} className="text-gray-400">
              <X size={14} />
            </button>
          </div>
          {recipesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : (
            (recipes ?? []).slice(0, compact ? 8 : 20).map((r) => (
              <button
                key={r.id}
                type="button"
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#faf5f5] text-xs"
                onClick={() => {
                  onShare({ content: recipeShareText(r.title, r.slug) });
                  setOpen(null);
                  setQ("");
                }}
              >
                <span className="font-bold text-[#2d3b2d]">{r.title}</span>
                {r.protein != null && (
                  <span className="text-[#c9a96e] ml-1">{r.protein}g protein</span>
                )}
              </button>
            ))
          )}
          {!recipesLoading && (recipes?.length ?? 0) === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-2">No recipes yet</p>
          )}
        </div>
      )}

      {open === "file" && allowFiles && (
        <div className="rounded-2xl border bg-white p-2 max-h-48 overflow-y-auto" style={{ borderColor: "#f0e8e4" }}>
          <div className="flex justify-between items-center mb-2 px-1">
            <p className="text-[10px] font-bold uppercase text-gray-400">File library</p>
            <button type="button" onClick={() => setOpen(null)} className="text-gray-400">
              <X size={14} />
            </button>
          </div>
          {filesLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 size={16} className="animate-spin text-gray-400" />
            </div>
          ) : (
            (files ?? []).map((f) => (
              <button
                key={f.id}
                type="button"
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#faf5f5] text-xs font-semibold text-[#2d3b2d]"
                onClick={() => {
                  onShare({
                    content: `Sharing: ${f.fileName}`,
                    mediaUrl: f.fileUrl,
                  });
                  setOpen(null);
                }}
              >
                {f.fileName}
              </button>
            ))
          )}
          {!filesLoading && (files?.length ?? 0) === 0 && (
            <p className="text-[11px] text-gray-400 text-center py-2">
              Upload files under Admin → File library
            </p>
          )}
        </div>
      )}
    </div>
  );
}
