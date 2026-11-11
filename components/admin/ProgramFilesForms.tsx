"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { ProgramId } from "@shared/programs";
import {
  libraryItemsAvailableToAdd,
  listProgramContent,
  programTagUpdate,
  type ProgramLibraryItem,
} from "@shared/programContentLibrary";

/**
 * Files and digital forms for one program. Tagging goes through forms.adminSetTags,
 * the same call Library > Files uses, so common_file_programs stays the source of truth.
 */
export function ProgramFilesForms({ program }: { program: ProgramId }) {
  const library = trpc.forms.adminLibrary.useQuery();
  const setTags = trpc.forms.adminSetTags.useMutation();
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const items: ProgramLibraryItem[] = (library.data ?? []).map((item) => ({
    kind: item.kind,
    refId: item.refId,
    title: item.title,
    programTags: item.programTags,
    pages: item.pages.map((page) => ({ id: page.id, fileName: page.fileName, fileUrl: page.fileUrl })),
    linkedFormId: item.linkedFormId,
    linkedFormTitle: item.linkedFormTitle,
  }));
  const rows = listProgramContent(items, program);
  const available = libraryItemsAvailableToAdd(items, program);

  const apply = async (update: ReturnType<typeof programTagUpdate>, success: string) => {
    try {
      await setTags.mutateAsync(update);
      toast.success(success);
      await library.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update that tag");
    }
  };

  const addChosen = async () => {
    const selected = available.filter((item) => chosen.includes(`${item.kind}-${item.refId}`));
    if (selected.length === 0) return;
    setBusy(true);
    try {
      for (const item of selected) {
        await setTags.mutateAsync(programTagUpdate(item, program, "add"));
      }
      toast.success(selected.length === 1 ? "Added to this program" : `Added ${selected.length} to this program`);
      setChosen([]);
      setPicking(false);
      await library.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add those files");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-10 pt-8 border-t" style={{ borderColor: "oklch(0.90 0.015 80)" }}>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-xl" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
            Files & forms
          </h3>
          <p className="text-sm mt-1 max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
            Library files tagged to this program, and the digital form made from those pages. Removing one only takes the tag off. The file stays in the library.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setPicking((open) => !open);
            setChosen([]);
          }}
          className="rounded-full px-4 py-2 text-sm font-bold"
          style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
        >
          {picking ? "Close" : "Add files"}
        </button>
      </div>

      {picking && (
        <div className="mb-4 rounded-xl p-4 space-y-3" style={{ background: "white" }}>
          {library.isLoading ? (
            <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Loading the library…</p>
          ) : available.length === 0 ? (
            <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Every library file is already on this program.</p>
          ) : (
            available.map((item) => {
              const key = `${item.kind}-${item.refId}`;
              const on = chosen.includes(key);
              return (
                <label key={key} className="flex items-center gap-3 text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setChosen((current) => (on ? current.filter((id) => id !== key) : [...current, key]))}
                  />
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {item.kind === "group" ? "Page group" : "File"}
                  </span>
                </label>
              );
            })
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || chosen.length === 0}
              onClick={() => void addChosen()}
              className="rounded-full px-4 py-2 text-sm font-bold disabled:opacity-40"
              style={{ background: "oklch(0.38 0.08 145)", color: "white" }}
            >
              {busy ? "Adding…" : "Add to this program"}
            </button>
            <button type="button" onClick={() => setPicking(false)} className="px-4 py-2 text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {library.isLoading ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Loading files…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Nothing from the library is tagged to this program yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.key} className="p-4 rounded-xl flex flex-wrap items-center justify-between gap-3" style={{ background: "white" }}>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.72 0.12 75)" }}>
                  {row.type === "form" ? "Form" : "File"}
                  {row.pageGroup ? ` · ${row.pageGroup}` : ""}
                </p>
                <p className="font-semibold mt-1" style={{ color: "oklch(0.20 0.015 50)" }}>{row.title}</p>
              </div>
              <div className="flex items-center gap-3">
                {row.href && row.type === "form" ? (
                  <Link href={row.href} className="text-sm font-bold" style={{ color: "oklch(0.72 0.12 75)" }}>
                    Edit
                  </Link>
                ) : row.href ? (
                  <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold" style={{ color: "oklch(0.72 0.12 75)" }}>
                    Open
                  </a>
                ) : null}
                <button
                  type="button"
                  disabled={setTags.isPending || busy}
                  onClick={() => {
                    if (!confirm(`Remove "${row.title}" from this program? It stays in the library.`)) return;
                    void apply(
                      programTagUpdate(
                        { kind: row.tagKind, refId: row.tagId, programTags: row.programTags },
                        program,
                        "remove"
                      ),
                      "Removed from this program"
                    );
                  }}
                  className="text-sm font-semibold"
                  style={{ color: "oklch(0.45 0.12 25)" }}
                >
                  Remove from this program
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
