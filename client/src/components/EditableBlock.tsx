/**
 * EditableBlock — inline rich text editor for admin page editing.
 *
 * Uses native browser contenteditable (execCommand) instead of TipTap.
 * This preserves all inline styles, font-family, color, etc. from the
 * original HTML content — TipTap's ProseMirror schema strips style attributes
 * which caused text to go black when editing.
 *
 * - View mode: renders content as plain HTML (dangerouslySetInnerHTML)
 * - Edit mode: native contenteditable with a floating bold/italic toolbar
 * - Saves drafts to DB via tRPC on blur; marks block dirty for Publish button
 */
import { useEffect, useRef, useState, ElementType, CSSProperties } from "react";
import { trpc } from "@/lib/trpc";
import { useEditMode } from "@/contexts/EditModeContext";
import { Bold, Italic, List, Undo, Redo } from "lucide-react";

interface EditableBlockProps {
  contentKey: string;
  defaultContent: string;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
}

export function EditableBlock(props: EditableBlockProps) {
  const { isEditMode, page } = useEditMode();

  if (!isEditMode) {
    return <ViewBlock {...props} page={page} />;
  }
  return <AdminEditableBlock {...props} page={page} />;
}

// ── View mode ─────────────────────────────────────────────────────────────────
function ViewBlock({
  contentKey,
  defaultContent,
  className,
  style,
  as: Tag = "div",
  page,
}: EditableBlockProps & { page: string }) {
  const { data: publishedMap } = trpc.pageEditor.getPublished.useQuery(
    { page },
    { staleTime: 300_000 }
  );

  const content =
    publishedMap && publishedMap[contentKey]
      ? publishedMap[contentKey]
      : defaultContent;

  return (
    <Tag
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}

// ── Admin edit mode: native contenteditable ───────────────────────────────────
function AdminEditableBlock({
  contentKey,
  defaultContent,
  className,
  style,
  as: Tag = "div",
  page,
}: EditableBlockProps & { page: string }) {
  const { markDirty } = useEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  // Local copy of content so edits persist in view mode immediately after blur
  const [localContent, setLocalContent] = useState<string | null>(null);
  const editRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: allContentMap } = trpc.pageEditor.getAll.useQuery(
    { page },
    { staleTime: 10_000 }
  );

  const saveDraftMutation = trpc.pageEditor.saveDraft.useMutation({
    onSuccess: () => setSaveStatus("saved"),
    onSettled: () => {
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const getRemoteContent = (): string => {
    if (allContentMap) {
      const entry = allContentMap[contentKey];
      if (entry) return entry.draft ?? entry.published ?? defaultContent;
    }
    return defaultContent;
  };

  // The content shown in view mode: prefer local (post-edit) over remote
  const displayContent = localContent !== null ? localContent : getRemoteContent();

  // When entering edit mode, set the innerHTML of the contenteditable
  useEffect(() => {
    if (isEditing && editRef.current) {
      const content = displayContent;
      editRef.current.innerHTML = content;
      // Place cursor at end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      editRef.current.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const handleBlur = () => {
    if (!editRef.current) return;
    const html = editRef.current.innerHTML;
    // Update local content immediately so view mode shows the edit right away
    setLocalContent(html);
    setSaveStatus("saving");
    saveDraftMutation.mutate({ page, key: contentKey, content: html });
    markDirty(contentKey);
  };

  // Click outside to stop editing
  useEffect(() => {
    if (!isEditing) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing]);

  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      {!isEditing ? (
        <Tag
          className={className}
          style={{
            ...style,
            outline: "2px dashed oklch(0.72 0.12 75)",
            outlineOffset: "2px",
            cursor: "pointer",
          }}
          onClick={() => setIsEditing(true)}
          title="Click to edit"
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      ) : (
        <div className="relative">
          {/* Floating toolbar */}
          <div
            className="absolute z-50 flex items-center gap-1 p-1 rounded-lg shadow-xl"
            style={{
              top: "-44px",
              left: "0",
              background: "oklch(0.18 0.02 160)",
              border: "1px solid oklch(0.35 0.02 160)",
              whiteSpace: "nowrap",
            }}
          >
            <ToolbarButton onClick={() => exec("bold")} title="Bold">
              <Bold size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec("italic")} title="Italic">
              <Italic size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec("insertUnorderedList")} title="Bullet list">
              <List size={14} />
            </ToolbarButton>
            <div className="w-px h-4 mx-1" style={{ background: "oklch(0.35 0.02 160)" }} />
            <ToolbarButton onClick={() => exec("undo")} title="Undo">
              <Undo size={14} />
            </ToolbarButton>
            <ToolbarButton onClick={() => exec("redo")} title="Redo">
              <Redo size={14} />
            </ToolbarButton>
            <div className="w-px h-4 mx-1" style={{ background: "oklch(0.35 0.02 160)" }} />
            <span className="text-xs px-2" style={{ color: "oklch(0.55 0.02 160)" }}>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : "Draft"}
            </span>
          </div>

          {/*
            The Tag wrapper keeps the original className and style so layout is preserved.
            The contenteditable div inside inherits color, font-family, etc. from the Tag
            AND from the inline styles in the HTML content itself.
          */}
          <Tag
            className={className}
            style={{
              ...style,
              outline: "2px solid oklch(0.72 0.12 75)",
              outlineOffset: "2px",
              minHeight: "1em",
            }}
          >
            <div
              ref={editRef as React.RefObject<HTMLDivElement>}
              contentEditable
              suppressContentEditableWarning
              onBlur={handleBlur}
              style={{
                outline: "none",
                minHeight: "1em",
                // Inherit color and font from the Tag wrapper so text is visible
                // even when the admin iframe strips inline styles from HTML content
                color: "inherit",
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                lineHeight: "inherit",
              }}
            />
          </Tag>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="p-1.5 rounded transition-colors"
      style={{
        background: "transparent",
        color: "oklch(0.72 0.12 75)",
      }}
    >
      {children}
    </button>
  );
}
