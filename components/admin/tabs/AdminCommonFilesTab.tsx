"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileText, Trash2, FolderOpen, Layers } from "lucide-react";
import { PROGRAM_LIST, type ProgramId } from "@shared/programs";

function ProgramChecks({
  selected,
  onChange,
  disabled,
}: {
  selected: ProgramId[];
  onChange: (next: ProgramId[]) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {PROGRAM_LIST.map((program) => {
        const checked = selected.includes(program.id);
        return (
          <label key={program.id} className="flex items-center gap-1.5 text-xs" style={{ color: "oklch(0.30 0.015 50)" }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() =>
                onChange(checked ? selected.filter((id) => id !== program.id) : [...selected, program.id])
              }
            />
            {program.label}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Admin library. Program checks use common_file_programs.
 * Pages can be grouped, and a PDF or photo can become a fillable form.
 */
export function AdminCommonFilesTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ fileName: string; mimeType: string; base64Data: string } | null>(null);
  const [pendingPrograms, setPendingPrograms] = useState<ProgramId[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [groupTitle, setGroupTitle] = useState("");
  const [groupPrograms, setGroupPrograms] = useState<ProgramId[]>([]);
  const [grouping, setGrouping] = useState(false);

  const library = trpc.forms.adminLibrary.useQuery();
  const uploadCommon = trpc.clientFiles.uploadCommon.useMutation({
    onSuccess: (data) => {
      toast.success(`Added "${data.fileName}" to the library`);
      library.refetch();
      setPending(null);
      setPendingPrograms([]);
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteCommon = trpc.clientFiles.deleteCommon.useMutation({
    onSuccess: () => {
      toast.success("Removed from library");
      library.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const group = trpc.forms.adminGroup.useMutation({
    onSuccess: () => {
      toast.success("Grouped into one item");
      setSelected([]);
      setGrouping(false);
      setGroupTitle("");
      setGroupPrograms([]);
      library.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const ungroup = trpc.forms.adminUngroup.useMutation({
    onSuccess: () => {
      toast.success("Ungrouped. The original pages are still in the library.");
      library.refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const setTags = trpc.forms.adminSetTags.useMutation({
    onSuccess: () => library.refetch(),
    onError: (error) => toast.error(error.message),
  });
  const draft = trpc.forms.adminDraftFromFiles.useMutation({
    onSuccess: (result) => {
      window.location.href = `/admin/forms/${result.id}`;
    },
    onError: (error) => toast.error(error.message),
  });

  const items = library.data ?? [];
  const selectedFiles = useMemo(() => {
    const ids: number[] = [];
    for (const id of selected) {
      const item = items.find((entry) => entry.kind === "file" && entry.pages.some((page) => page.id === id));
      if (item) ids.push(id);
    }
    return ids;
  }, [items, selected]);

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1] ?? "";
      setPending({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Data: base64,
      });
      setPendingPrograms([]);
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const toggleFile = (id: number) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="mb-2 text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}>
            Shared file library
          </h2>
          <p className="max-w-xl text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            Check a program and everyone enrolled sees it. Clients see the form once it is published. Until then they see the original file.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={selectedFiles.length < 2}
            onClick={() => setGrouping(true)}
            className="flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold disabled:opacity-40"
            style={{ background: "oklch(0.38 0.10 148)", color: "white" }}
          >
            <Layers size={16} /> Group into one item
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-bold shadow-sm"
            style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
          >
            <Upload size={16} />
            Upload to library
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.xlsx,.mp3,.mp4"
        />
      </div>

      {pending && (
        <div className="mb-4 space-y-3 rounded-xl bg-white p-4">
          <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>{pending.fileName}</p>
          <ProgramChecks selected={pendingPrograms} onChange={setPendingPrograms} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={uploadCommon.isPending}
              onClick={() => uploadCommon.mutate({ ...pending, programs: pendingPrograms })}
              className="rounded-full px-4 py-2 text-sm font-bold"
              style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
            >
              {uploadCommon.isPending ? "Saving…" : "Add to library"}
            </button>
            <button type="button" onClick={() => setPending(null)} className="px-4 py-2 text-sm" style={{ color: "oklch(0.42 0.015 50)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {grouping ? (
        <div className="mb-4 rounded-xl bg-white p-4">
          <p className="mb-2 text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
            {selectedFiles.length} pages, in the order you selected. Originals stay in the library. The checks apply to every page.
          </p>
          <input
            className="mb-3 min-h-12 w-full rounded-xl border px-3"
            placeholder="Title, for example Men's fasting calendar"
            value={groupTitle}
            onChange={(event) => setGroupTitle(event.target.value)}
          />
          <ProgramChecks selected={groupPrograms} onChange={setGroupPrograms} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="min-h-12 rounded-full px-4 text-sm font-bold text-white"
              style={{ background: "oklch(0.38 0.10 148)" }}
              disabled={!groupTitle.trim() || group.isPending}
              onClick={() => group.mutate({ fileIds: selectedFiles, title: groupTitle.trim(), programTags: groupPrograms })}
            >
              Save group
            </button>
            <button type="button" className="min-h-12 rounded-full px-4 text-sm font-bold" onClick={() => setGrouping(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {library.isLoading ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>Loading…</p>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => {
            const pageIds = item.pages.map((page) => page.id);
            return (
              <div key={item.id} className="space-y-3 rounded-xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {item.kind === "file" ? (
                      <input
                        type="checkbox"
                        className="mt-3 h-5 w-5"
                        checked={selected.includes(item.refId)}
                        onChange={() => toggleFile(item.refId)}
                        aria-label={`Select ${item.title}`}
                      />
                    ) : (
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: "oklch(0.96 0.02 80)" }}>
                        <Layers size={18} style={{ color: "oklch(0.38 0.10 148)" }} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>{item.title}</p>
                      <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                        {item.kind === "group"
                          ? `Original pages · ${item.pages.length}`
                          : "Original file"}
                        {item.linkedPublishStatus === "published"
                          ? " · clients see the form"
                          : item.linkedFormId
                            ? " · form is still a draft"
                            : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {item.linkedFormId ? (
                      <Link href={`/admin/forms/${item.linkedFormId}`} className="rounded-full px-3 py-2 text-xs font-bold" style={{ background: "oklch(0.96 0.02 80)", color: "oklch(0.30 0.02 50)" }}>
                        {item.linkedPublishStatus === "published" ? "Edit the form" : "Edit the draft form"}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled={!item.convertible || draft.isPending}
                        className="rounded-full px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        style={{ background: "oklch(0.72 0.12 75)" }}
                        onClick={() => draft.mutate({ fileIds: pageIds })}
                      >
                        {draft.isPending ? "Reading…" : "Turn this file into a form"}
                      </button>
                    )}
                    {item.kind === "group" ? (
                      <button
                        type="button"
                        className="rounded-full px-3 py-2 text-xs font-bold"
                        style={{ background: "oklch(0.96 0.02 80)" }}
                        onClick={() => ungroup.mutate({ groupId: item.refId })}
                      >
                        Split the original pages
                      </button>
                    ) : (
                      <a href={item.pages[0]?.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-2 text-xs font-bold" style={{ color: "#5a6b5a" }}>
                        Open the original file
                      </a>
                    )}
                    {item.kind === "file" ? (
                      <button
                        type="button"
                        className="p-2"
                        style={{ color: "oklch(0.55 0.12 20)" }}
                        onClick={() => {
                          if (confirm(`Remove "${item.title}" from the library? People who already received a copy keep it.`)) {
                            deleteCommon.mutate({ fileId: item.refId });
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </div>
                </div>
                {item.kind === "group" ? (
                  <ol className="space-y-1 pl-8 text-xs" style={{ color: "oklch(0.42 0.015 50)" }}>
                    {item.pages.map((page, index) => (
                      <li key={page.id}>{index + 1}. {page.fileName}</li>
                    ))}
                  </ol>
                ) : null}
                <div className="pl-8">
                  <ProgramChecks
                    selected={item.programTags}
                    disabled={setTags.isPending}
                    onChange={(next) => setTags.mutate({ kind: item.kind, id: item.refId, programTags: next })}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl p-10 text-center" style={{ background: "oklch(1 0 0)", border: "1px dashed oklch(0.90 0.02 80)" }}>
          <FolderOpen size={32} className="mx-auto mb-3" style={{ color: "oklch(0.72 0.12 75)" }} />
          <p className="mb-1 text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>No common files yet</p>
          <p className="mx-auto max-w-sm text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
            Upload a worksheet, check the programs that should see it, then turn it into a form if you want clients to fill it in here.
          </p>
        </div>
      )}
      <p className="mt-4 flex items-center gap-2 text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
        <FileText size={14} /> A checked program shows either the published form or the original file. You can still share one file with one person from their contact.
      </p>
    </div>
  );
}
