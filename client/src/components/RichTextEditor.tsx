import { useEditor, EditorContent, Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import Youtube from "@tiptap/extension-youtube";
import {
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
} from "react";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Minus,
  TableIcon,
  Youtube as YoutubeIcon,
  Instagram,
  Plus,
  Trash2,
  Columns,
  Rows,
  X,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export interface RichTextEditorHandle {
  insertImage: (url: string, alt?: string) => void;
  getEditor: () => Editor | null;
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageInsert?: () => void;
  placeholder?: string;
  className?: string;
  viewMode?: "edit" | "split" | "preview";
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
  size = "normal",
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  size?: "normal" | "small";
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      title={title}
      className={`rounded transition-colors ${size === "small" ? "p-1" : "p-1.5"}`}
      style={{
        color: active ? "oklch(0.72 0.12 75)" : "oklch(0.75 0.02 160)",
        background: active ? "oklch(0.28 0.025 160)" : "transparent",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

// ── Embed Dialog ──────────────────────────────────────────────────────────────
function EmbedDialog({
  open,
  onClose,
  onInsert,
  type,
}: {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
  type: "youtube" | "instagram" | "link";
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  if (!open) return null;

  const config = {
    youtube: {
      title: "Embed YouTube Video",
      placeholder: "https://www.youtube.com/watch?v=...",
      hint: "Paste a YouTube video URL. Supports youtube.com/watch, youtu.be, and youtube.com/shorts links.",
      validate: (u: string) => {
        const patterns = [
          /youtube\.com\/watch\?v=[\w-]+/,
          /youtu\.be\/[\w-]+/,
          /youtube\.com\/embed\/[\w-]+/,
          /youtube\.com\/shorts\/[\w-]+/,
        ];
        return patterns.some((p) => p.test(u));
      },
      errorMsg: "Please enter a valid YouTube URL",
      icon: <YoutubeIcon size={20} />,
      color: "oklch(0.60 0.20 25)",
    },
    instagram: {
      title: "Embed Instagram Post",
      placeholder: "https://www.instagram.com/p/ABC123/",
      hint: "Paste an Instagram post, reel, or IGTV URL.",
      validate: (u: string) => /instagram\.com\/(p|reel|tv)\/[\w-]+/.test(u),
      errorMsg: "Please enter a valid Instagram post URL (e.g. instagram.com/p/...)",
      icon: <Instagram size={20} />,
      color: "oklch(0.65 0.18 330)",
    },
    link: {
      title: "Insert Link",
      placeholder: "https://example.com",
      hint: "Enter the URL you want to link to.",
      validate: (u: string) => {
        try { new URL(u); return true; } catch { return false; }
      },
      errorMsg: "Please enter a valid URL starting with http:// or https://",
      icon: <LinkIcon size={20} />,
      color: "oklch(0.72 0.12 75)",
    },
  }[type];

  const handleInsert = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("URL is required");
      return;
    }
    if (!config.validate(trimmed)) {
      setError(config.errorMsg);
      return;
    }
    onInsert(trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInsert();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Extract YouTube video ID for preview
  const getYoutubeId = (u: string): string | null => {
    const match = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]+)/);
    return match ? match[1] : null;
  };

  const showPreview = type === "youtube" && url.trim() && config.validate(url.trim());
  const videoId = showPreview ? getYoutubeId(url.trim()) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "oklch(0.22 0.025 160)", border: "1px solid oklch(0.30 0.02 160)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid oklch(0.30 0.02 160)" }}
        >
          <div className="flex items-center gap-2.5">
            <span style={{ color: config.color }}>{config.icon}</span>
            <h3
              className="font-bold text-sm"
              style={{ color: "oklch(0.92 0.01 160)" }}
            >
              {config.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-[oklch(0.28_0.02_160)]"
            style={{ color: "oklch(0.60 0.02 160)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.02 160)" }}>
            {config.hint}
          </p>

          <div>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              className="w-full text-sm rounded-lg px-3.5 py-2.5 transition-all"
              style={{
                background: "oklch(0.18 0.02 160)",
                color: "oklch(0.92 0.01 160)",
                border: error ? "1.5px solid oklch(0.65 0.20 25)" : "1.5px solid oklch(0.30 0.02 160)",
                outline: "none",
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = "oklch(0.72 0.12 75)";
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = "oklch(0.30 0.02 160)";
              }}
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertCircle size={12} style={{ color: "oklch(0.65 0.20 25)" }} />
                <p className="text-xs" style={{ color: "oklch(0.65 0.20 25)" }}>{error}</p>
              </div>
            )}
          </div>

          {/* YouTube Preview */}
          {showPreview && videoId && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid oklch(0.30 0.02 160)" }}
            >
              <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    border: "none",
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2.5 px-5 py-3.5"
          style={{ borderTop: "1px solid oklch(0.30 0.02 160)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: "oklch(0.28 0.02 160)",
              color: "oklch(0.75 0.02 160)",
              border: "1px solid oklch(0.35 0.02 160)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            className="px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
            style={{
              background: config.color,
              color: "oklch(1 0 0)",
            }}
          >
            <ExternalLink size={12} />
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

function TableDropdown({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <ToolbarButton
        onClick={() => setOpen((v) => !v)}
        active={editor.isActive("table")}
        title="Table"
      >
        <TableIcon size={15} />
      </ToolbarButton>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 z-50 rounded-lg shadow-xl p-2 min-w-[160px]"
          style={{
            background: "oklch(0.22 0.025 160)",
            border: "1px solid oklch(0.30 0.02 160)",
          }}
        >
          {!editor.isActive("table") ? (
            <>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.92 0.01 160)" }}
              >
                <Plus size={12} /> Insert 3×3 Table
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 4, cols: 2, withHeaderRow: true })
                    .run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.92 0.01 160)" }}
              >
                <Plus size={12} /> Insert 4×2 Table
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().addColumnAfter().run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.92 0.01 160)" }}
              >
                <Columns size={12} /> Add Column
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().addRowAfter().run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.92 0.01 160)" }}
              >
                <Rows size={12} /> Add Row
              </button>
              <div
                className="my-1"
                style={{ borderTop: "1px solid oklch(0.30 0.02 160)" }}
              />
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().deleteColumn().run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.72 0.07 10)" }}
              >
                <Columns size={12} /> Delete Column
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().deleteRow().run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.72 0.07 10)" }}
              >
                <Rows size={12} /> Delete Row
              </button>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  editor.chain().focus().deleteTable().run();
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded text-xs hover:bg-[oklch(0.28_0.02_160)] transition-colors flex items-center gap-2"
                style={{ color: "oklch(0.72 0.07 10)" }}
              >
                <Trash2 size={12} /> Delete Table
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Toolbar({
  editor,
  onImageInsert,
  onYoutube,
  onInstagram,
  onLink,
}: {
  editor: Editor | null;
  onImageInsert?: () => void;
  onYoutube: () => void;
  onInstagram: () => void;
  onLink: () => void;
}) {
  if (!editor) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-0.5 p-2 border-b"
      style={{
        borderColor: "oklch(0.30 0.02 160)",
        background: "oklch(0.20 0.025 160)",
      }}
    >
      {/* History */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo size={15} />
      </ToolbarButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "oklch(0.30 0.02 160)" }}
      />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        title="Heading 1 (H1)"
      >
        <Heading1 size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        title="Heading 2 (H2)"
      >
        <Heading2 size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        title="Heading 3 (H3)"
      >
        <Heading3 size={15} />
      </ToolbarButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "oklch(0.30 0.02 160)" }}
      />

      {/* Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        title="Bold"
      >
        <Bold size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        title="Italic"
      >
        <Italic size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        title="Underline"
      >
        <UnderlineIcon size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        title="Strikethrough"
      >
        <Strikethrough size={15} />
      </ToolbarButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "oklch(0.30 0.02 160)" }}
      />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        title="Bullet List"
      >
        <List size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        title="Numbered List"
      >
        <ListOrdered size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        title="Blockquote"
      >
        <Quote size={15} />
      </ToolbarButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "oklch(0.30 0.02 160)" }}
      />

      {/* Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
        title="Align Left"
      >
        <AlignLeft size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
        title="Align Center"
      >
        <AlignCenter size={15} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
        title="Align Right"
      >
        <AlignRight size={15} />
      </ToolbarButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "oklch(0.30 0.02 160)" }}
      />

      {/* Link, Image, HR */}
      <ToolbarButton
        onClick={onLink}
        active={editor.isActive("link")}
        title="Insert Link"
      >
        <LinkIcon size={15} />
      </ToolbarButton>
      {onImageInsert && (
        <ToolbarButton onClick={onImageInsert} title="Insert Image">
          <ImageIcon size={15} />
        </ToolbarButton>
      )}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus size={15} />
      </ToolbarButton>

      <div
        className="w-px h-5 mx-1"
        style={{ background: "oklch(0.30 0.02 160)" }}
      />

      {/* Table */}
      <TableDropdown editor={editor} />

      {/* YouTube */}
      <ToolbarButton onClick={onYoutube} title="Embed YouTube Video">
        <YoutubeIcon size={15} />
      </ToolbarButton>

      {/* Instagram */}
      <ToolbarButton onClick={onInstagram} title="Embed Instagram Post">
        <Instagram size={15} />
      </ToolbarButton>
    </div>
  );
}

// ── Floating Bubble Toolbar ─────────────────────────────────────────────────
function FloatingBubbleToolbar({
  editor,
  onLink,
}: {
  editor: Editor;
  onLink: () => void;
}) {
  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
      }}
      className="bubble-toolbar"
    >
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg shadow-xl"
        style={{
          background: "oklch(0.18 0.025 160)",
          border: "1px solid oklch(0.32 0.02 160)",
          backdropFilter: "blur(12px)",
        }}
      >
        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Heading 2"
          size="small"
        >
          <Heading2 size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Heading 3"
          size="small"
        >
          <Heading3 size={14} />
        </ToolbarButton>

        <div
          className="w-px h-4 mx-0.5"
          style={{ background: "oklch(0.32 0.02 160)" }}
        />

        {/* Formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Bold"
          size="small"
        >
          <Bold size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Italic"
          size="small"
        >
          <Italic size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive("underline")}
          title="Underline"
          size="small"
        >
          <UnderlineIcon size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Strikethrough"
          size="small"
        >
          <Strikethrough size={14} />
        </ToolbarButton>

        <div
          className="w-px h-4 mx-0.5"
          style={{ background: "oklch(0.32 0.02 160)" }}
        />

        {/* Link */}
        <ToolbarButton
          onClick={onLink}
          active={editor.isActive("link")}
          title="Insert Link"
          size="small"
        >
          <LinkIcon size={14} />
        </ToolbarButton>

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          active={editor.isActive({ textAlign: "left" })}
          title="Align Left"
          size="small"
        >
          <AlignLeft size={14} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          active={editor.isActive({ textAlign: "center" })}
          title="Align Center"
          size="small"
        >
          <AlignCenter size={14} />
        </ToolbarButton>

        {/* Quote */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Blockquote"
          size="small"
        >
          <Quote size={14} />
        </ToolbarButton>
      </div>
    </BubbleMenu>
  );
}

function PreviewPane({ html }: { html: string }) {
  return (
    <div
      className="rich-text-preview-pane p-6 overflow-y-auto blog-post-content"
      style={{
        background: "oklch(0.985 0.008 75)",
        color: "oklch(0.25 0.02 55)",
        minHeight: "400px",
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const RichTextEditor = forwardRef<
  RichTextEditorHandle,
  RichTextEditorProps
>(function RichTextEditor(
  { value, onChange, onImageInsert, placeholder, className, viewMode = "edit" },
  ref
) {
  const [embedDialog, setEmbedDialog] = useState<{
    open: boolean;
    type: "youtube" | "instagram" | "link";
  }>({ open: false, type: "youtube" });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write your post content here...",
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({
        inline: false,
        HTMLAttributes: {
          class: "youtube-embed",
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  // Sync external value changes (e.g. when loading an existing post)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const insertImage = useCallback(
    (url: string, alt?: string) => {
      editor?.chain().focus().setImage({ src: url, alt: alt ?? "" }).run();
    },
    [editor]
  );

  // Expose methods to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      insertImage,
      getEditor: () => editor,
    }),
    [editor, insertImage]
  );

  const handleEmbedInsert = useCallback(
    (url: string) => {
      if (!editor) return;

      if (embedDialog.type === "youtube") {
        editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
      } else if (embedDialog.type === "instagram") {
        const embedUrl = url.replace(/\/$/, "") + "/embed";
        editor
          .chain()
          .focus()
          .insertContent(
            `<div data-instagram-embed="true" class="instagram-embed-wrapper"><iframe src="${embedUrl}" width="400" height="480" frameborder="0" scrolling="no" allowtransparency="true" style="border-radius:8px; max-width:100%;"></iframe></div>`
          )
          .run();
      } else if (embedDialog.type === "link") {
        editor
          .chain()
          .focus()
          .setLink({ href: url, target: "_blank" })
          .run();
      }
    },
    [editor, embedDialog.type]
  );

  const showEditor = viewMode === "edit" || viewMode === "split";
  const showPreview = viewMode === "preview" || viewMode === "split";

  return (
    <>
      <div
        className={`rounded-lg border overflow-hidden ${className ?? ""}`}
        style={{ borderColor: "oklch(0.30 0.02 160)" }}
      >
        {showEditor && (
          <Toolbar
            editor={editor}
            onImageInsert={onImageInsert}
            onYoutube={() => setEmbedDialog({ open: true, type: "youtube" })}
            onInstagram={() => setEmbedDialog({ open: true, type: "instagram" })}
            onLink={() => setEmbedDialog({ open: true, type: "link" })}
          />
        )}
        <div
          className={
            viewMode === "split" ? "grid grid-cols-2 divide-x" : ""
          }
          style={
            viewMode === "split"
              ? { borderColor: "oklch(0.30 0.02 160)" }
              : undefined
          }
        >
          {showEditor && (
            <div className="relative">
              <EditorContent
                editor={editor}
                className="rich-text-editor-content"
              />
              {/* Floating bubble toolbar on text selection */}
              {editor && (
                <FloatingBubbleToolbar
                  editor={editor}
                  onLink={() => setEmbedDialog({ open: true, type: "link" })}
                />
              )}
            </div>
          )}
          {showPreview && <PreviewPane html={value} />}
        </div>
      </div>

      {/* Embed Dialog */}
      <EmbedDialog
        open={embedDialog.open}
        type={embedDialog.type}
        onClose={() => setEmbedDialog((prev) => ({ ...prev, open: false }))}
        onInsert={handleEmbedInsert}
      />
    </>
  );
});
