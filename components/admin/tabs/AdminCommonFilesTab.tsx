"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileText, Trash2, ExternalLink, FolderOpen } from "lucide-react";
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
 * Admin library. Checked programs automatically show the file
 * to everyone enrolled in that program.
 */
export function AdminCommonFilesTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ fileName: string; mimeType: string; base64Data: string } | null>(null);
  const [pendingPrograms, setPendingPrograms] = useState<ProgramId[]>([]);

  const { data: files, refetch, isLoading } = trpc.clientFiles.listCommon.useQuery();

  const uploadCommon = trpc.clientFiles.uploadCommon.useMutation({
    onSuccess: (data) => {
      toast.success(`Added "${data.fileName}" to the library`);
      refetch();
      setPending(null);
      setPendingPrograms([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const setPrograms = trpc.clientFiles.setPrograms.useMutation({
    onSuccess: () => refetch(),
    onError: (e) => toast.error(e.message),
  });

  const deleteCommon = trpc.clientFiles.deleteCommon.useMutation({
    onSuccess: () => {
      toast.success("Removed from library");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setPending({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Data: base64,
      });
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2
            className="font-bold text-2xl mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Shared file library
          </h2>
          <p className="text-sm max-w-xl" style={{ color: "oklch(0.52 0.015 50)" }}>
            Check a program and everyone enrolled in it sees the file. You can change the checks later.
            Sharing one file onto one person still works from their contact.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
          style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
        >
          <Upload size={16} />
          Upload to library
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.xlsx,.mp3,.mp4"
        />
      </div>

      {pending && (
        <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: "oklch(1 0 0)" }}>
          <p className="text-sm font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>{pending.fileName}</p>
          <ProgramChecks selected={pendingPrograms} onChange={setPendingPrograms} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={uploadCommon.isPending}
              onClick={() => uploadCommon.mutate({ ...pending, programs: pendingPrograms })}
              className="px-4 py-2 rounded-full text-sm font-bold"
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

      {isLoading ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Loading…
        </p>
      ) : files && files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="p-4 rounded-xl space-y-3"
              style={{ background: "oklch(1 0 0)" }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "oklch(0.96 0.02 80)" }}
                  >
                    <FileText size={18} style={{ color: "oklch(0.72 0.12 75)" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "oklch(0.20 0.015 50)" }}>
                      {file.fileName}
                    </p>
                    <p className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                      Added {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg"
                    style={{ color: "oklch(0.72 0.12 75)" }}
                    title="Open"
                  >
                    <ExternalLink size={16} />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove "${file.fileName}" from the library? People who already received a copy keep it.`)) {
                        deleteCommon.mutate({ fileId: file.id });
                      }
                    }}
                    className="p-2 rounded-lg"
                    style={{ color: "oklch(0.55 0.12 20)" }}
                    title="Remove from library"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <ProgramChecks
                selected={file.programs}
                disabled={setPrograms.isPending}
                onChange={(next) => setPrograms.mutate({ fileId: file.id, programs: next })}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-10 text-center"
          style={{ background: "oklch(1 0 0)", border: "1px dashed oklch(0.90 0.02 80)" }}
        >
          <FolderOpen size={32} className="mx-auto mb-3" style={{ color: "oklch(0.72 0.12 75)" }} />
          <p className="text-sm font-semibold mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
            No common files yet
          </p>
          <p className="text-xs max-w-sm mx-auto" style={{ color: "oklch(0.52 0.015 50)" }}>
            Upload a worksheet, then check the programs that should receive it.
          </p>
        </div>
      )}
    </div>
  );
}
