"use client";

import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileText, Trash2, ExternalLink, FolderOpen } from "lucide-react";

/**
 * Admin library of reusable files (worksheets, guides, etc.).
 * Share them onto a client from contact → Client Files → Share file.
 */
export function AdminCommonFilesTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files, refetch, isLoading } = trpc.clientFiles.listCommon.useQuery();

  const uploadCommon = trpc.clientFiles.uploadCommon.useMutation({
    onSuccess: (data) => {
      toast.success(`Added "${data.fileName}" to library`);
      refetch();
      setUploading(false);
    },
    onError: (e) => {
      toast.error(e.message);
      setUploading(false);
    },
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
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadCommon.mutate({
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        base64Data: base64,
      });
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploading(false);
    };
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
            Upload worksheets and resources once. Then open any contact → Client Files →{" "}
            <strong>Share file</strong> to put them on that client&apos;s portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
          style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
        >
          <Upload size={16} />
          {uploading ? "Uploading…" : "Upload to library"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt,.csv,.xlsx,.mp3,.mp4"
        />
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
          Loading…
        </p>
      ) : files && files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 rounded-xl"
              style={{ background: "oklch(1 0 0)" }}
            >
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
                    if (confirm(`Remove "${file.fileName}" from the library? Clients who already received it keep their copy.`)) {
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
            Upload PDFs and worksheets you send often (e.g. RECLAIM worksheets). They show up under
            Share file on each contact.
          </p>
        </div>
      )}
    </div>
  );
}
