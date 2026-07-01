/**
 * PageEditorTab — Admin-only inline page editor for /financial-peace.
 * Renders the actual FinancialPeace page inside an iframe with edit mode
 * toggled on. Publish/Discard controls live in the top bar here.
 */
import { useState, useEffect, useRef } from "react";
import { Pencil, Eye, CheckCircle2, XCircle, Loader2, Info } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function PageEditorTab() {
  const [editMode, setEditMode] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check if there are any unpublished drafts
  const { data: contentData, refetch: refetchContent } = trpc.pageEditor.hasDrafts.useQuery({
    page: "financial-peace",
  });

  const publishMutation = trpc.pageEditor.publishPage.useMutation({
    onSuccess: (data) => {
      toast.success(`Published ${data.published} content block${data.published !== 1 ? "s" : ""}!`);
      setHasDraft(false);
      // Reload the iframe to show published content
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
      refetchContent();
    },
    onError: (e) => toast.error(e.message),
  });

  const discardMutation = trpc.pageEditor.discardDrafts.useMutation({
    onSuccess: (data: { discarded: number }) => {
      toast.success(`Discarded ${data.discarded} draft change${data.discarded !== 1 ? "s" : ""}.`);
      setHasDraft(false);
      setEditMode(false);
      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
      refetchContent();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  // Check for drafts whenever content data changes
  useEffect(() => {
    if (typeof contentData === "boolean") {
      setHasDraft(contentData);
    }
  }, [contentData]);

  // Send edit mode toggle to the iframe
  const toggleEditMode = () => {
    const next = !editMode;
    setEditMode(next);
    iframeRef.current?.contentWindow?.postMessage(
      { type: "SET_EDIT_MODE", value: next },
      window.location.origin
    );
  };

  // Listen for dirty notifications from the iframe
  useEffect(() => {
    const handler = (event: MessageEvent<{ type: string; value?: boolean }>) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "CONTENT_DIRTY") {
        setHasDraft(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // When iframe loads, push the current edit mode state into it
  const handleIframeLoad = () => {
    if (editMode) {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "SET_EDIT_MODE", value: true },
        window.location.origin
      );
    }
  };

  return (
    <div className="flex flex-col gap-0" style={{ height: "calc(100vh - 160px)" }}>
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between gap-4 px-5 py-3 rounded-t-2xl border-b"
        style={{
          background: "oklch(1 0 0)",
          borderColor: "oklch(0.985 0.008 80)",
        }}
      >
        <div className="flex items-center gap-3">
          <h2
            className="font-bold text-lg"
            style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
          >
            Financial Peace Page
          </h2>
          {hasDraft && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: "oklch(0.93 0.06 75)", color: "oklch(0.45 0.12 65)" }}
            >
              Unpublished changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Edit / View toggle */}
          <button
            onClick={toggleEditMode}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
            style={{
              background: editMode ? "oklch(0.72 0.12 75)" : "oklch(0.985 0.008 80)",
              color: editMode ? "oklch(1 0 0)" : "oklch(0.72 0.12 75)",
              border: editMode ? "none" : "2px solid oklch(0.72 0.12 75)",
            }}
          >
            {editMode ? (
              <>
                <Pencil size={14} /> Edit Mode ON
              </>
            ) : (
              <>
                <Eye size={14} /> View Mode
              </>
            )}
          </button>

          {/* Discard */}
          {hasDraft && (
            <button
              onClick={() => discardMutation.mutate({ page: "financial-peace" })}
              disabled={discardMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all"
              style={{
                background: "oklch(0.985 0.008 80)",
                color: "oklch(0.72 0.06 20)",
                border: "2px solid oklch(0.72 0.06 20)",
              }}
            >
              {discardMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <XCircle size={14} />
              )}
              Discard
            </button>
          )}

          {/* Publish */}
          <button
            onClick={() => publishMutation.mutate({ page: "financial-peace" })}
            disabled={!hasDraft || publishMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: hasDraft ? "oklch(0.38 0.09 148)" : "oklch(0.985 0.008 80)",
              color: hasDraft ? "oklch(1 0 0)" : "oklch(0.52 0.015 50)",
            }}
          >
            {publishMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <CheckCircle2 size={14} />
            )}
            Publish
          </button>
        </div>
      </div>

      {/* ── Instruction banner when edit mode is on ── */}
      {editMode && (
        <div
          className="flex items-center gap-2 px-5 py-2 text-xs"
          style={{ background: "oklch(0.97 0.015 148 / 0.15)", color: "oklch(0.72 0.09 145)" }}
        >
          <Info size={13} />
          Click any highlighted text block to edit it inline. Use the toolbar for bold, italic, and
          links. Click outside to save the draft. Hit <strong>Publish</strong> when you're happy
          with your changes.
        </div>
      )}

      {/* ── Iframe ── */}
      <iframe
        ref={iframeRef}
        src="/financial-peace?admin_edit=1"
        title="Financial Peace Page Editor"
        onLoad={handleIframeLoad}
        className="flex-1 w-full rounded-b-2xl border-0"
        style={{
          background: "oklch(0.985 0.008 80)",
          outline: "none",
        }}
      />
    </div>
  );
}
