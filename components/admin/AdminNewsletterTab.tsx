"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Eye,
  Image as ImageIcon,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";

type AudienceGroup = "finance" | "health" | "all";
type View = "list" | "compose";

const AUDIENCE_LABELS: Record<AudienceGroup, string> = {
  finance: "Finance (FPU)",
  health: "Health & Wellness",
  all: "Everyone",
};

function statusBadge(status: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    draft: { bg: "oklch(0.94 0.02 80)", color: "oklch(0.42 0.02 50)" },
    sending: { bg: "oklch(0.92 0.05 240)", color: "oklch(0.40 0.10 240)" },
    sent: { bg: "oklch(0.93 0.05 150)", color: "oklch(0.35 0.08 150)" },
    failed: { bg: "oklch(0.93 0.05 25)", color: "oklch(0.45 0.15 25)" },
    cancelled: { bg: "oklch(0.93 0.02 50)", color: "oklch(0.45 0.02 50)" },
  };
  const s = styles[status] ?? styles.draft;
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {status}
    </span>
  );
}

function emptyBody() {
  return `<p></p>`;
}

export function AdminNewsletterTab() {
  const utils = trpc.useUtils();
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  // Compose state
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [bodyHtml, setBodyHtml] = useState(emptyBody());
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [audienceGroup, setAudienceGroup] = useState<AudienceGroup>("health");
  const [excludeEnrolled, setExcludeEnrolled] = useState(true);
  const [excludeEmails, setExcludeEmails] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const editorRef = useRef<RichTextEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const { data: newsletters = [], isLoading: listLoading } = trpc.newsletter.list.useQuery(undefined, {
    refetchInterval: (q) => {
      const items = q.state.data ?? [];
      return items.some((n) => n.status === "sending") ? 3000 : false;
    },
  });

  const audienceQuery = trpc.newsletter.audiencePreview.useQuery(
    {
      audienceGroup,
      excludeEnrolled,
      excludeEmails,
    },
    { enabled: view === "compose", placeholderData: keepPreviousData }
  );

  // Client-side live preview (no round-trip for every keystroke)
  const previewHtml = useMemo(() => {
    // Lightweight mirror of server shell for instant feedback
    const logo = BRAND.logoWideUrl || BRAND.logoUrl;
    const h = headline.trim();
    const sub = subheadline.trim();
    const ctaL = ctaLabel.trim();
    const ctaU = ctaUrl.trim();
    const body = bodyHtml || "<p></p>";

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  body{margin:0;padding:16px;background:#f5f0eb;font-family:'Nunito Sans',Arial,sans-serif;}
  .wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
  .logo{background:#FDFBF7;padding:24px;text-align:center;border-bottom:1px solid #f0e8e4;}
  .hero{background:linear-gradient(135deg,#fbeee9 0%,#f5dcd3 100%);padding:28px 30px;text-align:center;}
  .hero h1{margin:0 0 8px;color:#5a3e28;font-size:22px;font-weight:700;line-height:1.3;}
  .hero p{margin:0;color:#8a7060;font-size:15px;}
  .body{padding:32px 36px 8px;color:#4a4a4a;font-size:16px;line-height:1.65;}
  .body img{max-width:100%!important;height:auto!important;border-radius:10px;display:block;margin:16px auto;}
  .body a{color:#c9a96e;font-weight:700;}
  .body h1,.body h2,.body h3{color:#5a3e28;}
  .body h2{border-bottom:2px solid #e8ddd0;padding-bottom:8px;}
  .body blockquote{background:#f9f5f0;border-left:4px solid #c9a96e;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;}
  .cta{text-align:center;margin:28px 0;}
  .cta a{display:inline-block;background:#c9a96e;color:#fff!important;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;}
  .footer{padding:28px 40px 36px;border-top:1px solid #f0e8e4;text-align:center;color:#8a9a8a;font-size:12px;}
</style></head><body>
<div class="wrap">
  <div class="logo"><img src="${logo}" alt="${BRAND.name}" style="max-width:180px;height:auto;"/></div>
  ${
    h
      ? `<div class="hero"><h1>${escapePreview(h)}</h1>${sub ? `<p>${escapePreview(sub)}</p>` : ""}</div>`
      : ""
  }
  <div class="body">
    <p>Hi there,</p>
    ${body}
    ${
      ctaL && ctaU
        ? `<div class="cta"><a href="${escapePreview(ctaU)}">${escapePreview(ctaL)}</a></div>`
        : ""
    }
    <p style="margin-top:28px;">With love,<br/><strong>${BRAND.coachName}</strong><br/>
    <span style="color:#8a9a8a;font-size:13px;">Certified Life &amp; Health Coach · ${BRAND.name}</span></p>
  </div>
  <div class="footer">
    <p style="margin:0 0 10px;">You're receiving this because you joined our email list.</p>
    <p style="margin:0;"><span style="text-decoration:underline;color:#8a7060;">Unsubscribe</span> · Privacy</p>
    <p style="margin:12px 0 0;color:#b0b8b0;font-size:11px;">Mind &amp; Body Reset Coaches</p>
  </div>
</div>
</body></html>`;
  }, [bodyHtml, headline, subheadline, ctaLabel, ctaUrl]);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame) return;
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(previewHtml);
    doc.close();
  }, [previewHtml]);

  const saveDraft = trpc.newsletter.saveDraft.useMutation({
    onSuccess: (data) => {
      setEditingId(data.id);
      toast.success("Draft saved");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const sendTest = trpc.newsletter.sendTest.useMutation({
    onSuccess: (data) => toast.success(`Test sent to ${data.to}`),
    onError: (e) => toast.error(e.message),
  });

  const sendNewsletter = trpc.newsletter.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Sending to ${data.recipientCount} people…`);
      setShowSendConfirm(false);
      setConfirmText("");
      setView("list");
      resetCompose();
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelSend = trpc.newsletter.cancel.useMutation({
    onSuccess: () => {
      toast.success("Send cancelled");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteDraft = trpc.newsletter.deleteDraft.useMutation({
    onSuccess: () => {
      toast.success("Deleted");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImage = trpc.newsletter.uploadImage.useMutation();

  const resetCompose = useCallback(() => {
    setEditingId(undefined);
    setSubject("");
    setPreviewText("");
    setHeadline("");
    setSubheadline("");
    setBodyHtml(emptyBody());
    setCtaLabel("");
    setCtaUrl("");
    setAudienceGroup("health");
    setExcludeEnrolled(true);
    setExcludeEmails([]);
    setExcludeInput("");
    setConfirmText("");
    setShowSendConfirm(false);
  }, []);

  const openNew = () => {
    resetCompose();
    setView("compose");
  };

  const loadRowIntoComposer = (
    row: (typeof newsletters)[number],
    opts?: { asNewDraft?: boolean }
  ) => {
    setEditingId(opts?.asNewDraft ? undefined : row.id);
    setSubject(row.subject);
    setPreviewText(row.previewText ?? "");
    setHeadline(row.headline ?? "");
    setSubheadline(row.subheadline ?? "");
    setBodyHtml(row.bodyHtml || emptyBody());
    setCtaLabel(row.ctaLabel ?? "");
    setCtaUrl(row.ctaUrl ?? "");
    setAudienceGroup(row.audienceGroup as AudienceGroup);
    setExcludeEnrolled(row.excludeEnrolled);
    try {
      const parsed = row.excludeEmails ? JSON.parse(row.excludeEmails) : [];
      setExcludeEmails(Array.isArray(parsed) ? parsed : []);
    } catch {
      setExcludeEmails([]);
    }
    setView("compose");
  };

  const openDraft = (id: number) => {
    const row = newsletters.find((n) => n.id === id);
    if (!row) return;
    if (row.status !== "draft" && row.status !== "failed" && row.status !== "cancelled") {
      toast.message("Use “Duplicate” to edit a copy of a sent newsletter.");
      return;
    }
    loadRowIntoComposer(row);
  };

  const duplicateAsDraft = (id: number) => {
    const row = newsletters.find((n) => n.id === id);
    if (!row) return;
    loadRowIntoComposer(row, { asNewDraft: true });
    toast.success("Copied — edit freely, then save or send");
  };

  const insertFirstName = (target: "subject" | "preview" | "headline" | "body" | "cta") => {
    const tag = "{{firstName}}";
    if (target === "body") {
      editorRef.current?.insertText(tag);
      toast.message("Inserted {{firstName}} — becomes each person’s real name when sent");
      return;
    }
    if (target === "subject") setSubject((s) => s + (s && !s.endsWith(" ") ? " " : "") + tag);
    if (target === "preview") setPreviewText((s) => s + tag);
    if (target === "headline") setHeadline((s) => s + (s && !s.endsWith(" ") ? " " : "") + tag);
    if (target === "cta") setCtaLabel((s) => s + (s && !s.endsWith(" ") ? " " : "") + tag);
  };

  const composePayload = () => ({
    id: editingId,
    subject: subject.trim(),
    previewText: previewText.trim() || null,
    headline: headline.trim() || null,
    subheadline: subheadline.trim() || null,
    bodyHtml,
    ctaLabel: ctaLabel.trim() || null,
    ctaUrl: ctaUrl.trim() || null,
    audienceGroup,
    excludeEnrolled,
    excludeEmails,
  });

  const handleSave = () => {
    if (!subject.trim()) {
      toast.error("Add a subject line");
      return;
    }
    saveDraft.mutate(composePayload());
  };

  const handleTest = () => {
    if (!subject.trim()) {
      toast.error("Add a subject line first");
      return;
    }
    sendTest.mutate({
      ...composePayload(),
      toEmail: testEmail.trim() || undefined,
    });
  };

  const handleSend = () => {
    if (confirmText !== "SEND") {
      toast.error('Type SEND in all caps to confirm');
      return;
    }
    sendNewsletter.mutate({
      ...composePayload(),
      confirmPhrase: "SEND",
    });
  };

  const addExcludeEmail = () => {
    const email = excludeInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    if (excludeEmails.includes(email)) {
      setExcludeInput("");
      return;
    }
    setExcludeEmails((prev) => [...prev, email]);
    setExcludeInput("");
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploadingImage(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadImage.mutate(
        { fileName: file.name, mimeType: file.type, base64Data: base64 },
        {
          onSuccess: (data) => {
            editorRef.current?.insertImage(data.url, "", "100%");
            toast.success("Image added — click it to resize (S / M / L / Full)");
            setUploadingImage(false);
          },
          onError: (e) => {
            toast.error(e.message);
            setUploadingImage(false);
          },
        }
      );
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // ── List view ──────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h2
              className="font-bold text-3xl mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
            >
              Newsletters
            </h2>
            <p style={{ color: "oklch(0.52 0.015 50)" }}>
              Write a branded email, pick finance or health, preview it, and send with one click.
            </p>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            <Plus size={16} /> New newsletter
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {listLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.72 0.12 75)" }} />
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.85 0.02 80)" }} />
              <h3 className="text-lg font-semibold mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
                No newsletters yet
              </h3>
              <p className="text-sm mb-4" style={{ color: "oklch(0.52 0.015 50)" }}>
                Create your first email — logo and branding are already built in.
              </p>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
              >
                <Plus size={16} /> Get started
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead style={{ background: "oklch(0.98 0.008 80)", color: "oklch(0.52 0.015 50)" }}>
                  <tr className="border-b">
                    <th className="px-5 py-3 font-medium">Subject</th>
                    <th className="px-5 py-3 font-medium">Audience</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Delivered</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {newsletters.map((n) => (
                    <tr key={n.id} className="border-b last:border-0 hover:bg-slate-50/80">
                      <td className="px-5 py-3.5 font-semibold" style={{ color: "oklch(0.20 0.015 50)" }}>
                        {n.subject}
                      </td>
                      <td className="px-5 py-3.5" style={{ color: "oklch(0.42 0.015 50)" }}>
                        {AUDIENCE_LABELS[n.audienceGroup as AudienceGroup] ?? n.audienceGroup}
                      </td>
                      <td className="px-5 py-3.5">{statusBadge(n.status)}</td>
                      <td className="px-5 py-3.5" style={{ color: "oklch(0.42 0.015 50)" }}>
                        {n.status === "sent" || n.status === "sending" || n.status === "cancelled" ? (
                          <span>
                            <span className="text-emerald-600 font-medium">{n.sentCount}</span>
                            {n.failedCount > 0 && (
                              <span className="text-red-500 ml-1">/ {n.failedCount} failed</span>
                            )}
                            {n.skippedCount > 0 && (
                              <span className="text-slate-400 ml-1">/ {n.skippedCount} skipped</span>
                            )}
                            {n.status === "sending" && (
                              <span className="text-slate-400 ml-1">of {n.recipientCount}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(n.sentAt || n.createdAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        {(n.status === "draft" || n.status === "failed" || n.status === "cancelled") && (
                          <button
                            onClick={() => openDraft(n.id)}
                            className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.35 0.02 50)" }}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => duplicateAsDraft(n.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                          style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.40 0.06 60)" }}
                          title="Start a new draft from this one"
                        >
                          <Copy size={12} /> Duplicate
                        </button>
                        {n.status === "sending" && (
                          <button
                            onClick={() => {
                              if (confirm("Stop sending this newsletter?")) cancelSend.mutate({ id: n.id });
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full text-red-600 bg-red-50"
                          >
                            Cancel
                          </button>
                        )}
                        {n.status !== "sending" && (
                          <button
                            onClick={() => {
                              if (confirm("Delete this newsletter record?")) deleteDraft.mutate({ id: n.id });
                            }}
                            className="text-xs font-bold p-1.5 rounded-full text-slate-400 hover:text-red-500"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Compose view ───────────────────────────────────────────────────────────
  const recipientTotal = audienceQuery.data?.total ?? 0;

  return (
    <div className="-mx-2 md:mx-0">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={() => {
            setView("list");
            resetCompose();
          }}
          className="inline-flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: "oklch(0.42 0.015 50)" }}
        >
          <ArrowLeft size={16} /> Back to list
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saveDraft.isPending}
            className="px-4 py-2 rounded-full text-sm font-bold border"
            style={{
              background: "oklch(1 0 0)",
              color: "oklch(0.35 0.02 50)",
              borderColor: "oklch(0.90 0.015 80)",
            }}
          >
            {saveDraft.isPending ? "Saving…" : "Save draft"}
          </button>
          <button
            onClick={() => setShowSendConfirm(true)}
            disabled={sendNewsletter.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold shadow-sm"
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            <Send size={15} /> Send newsletter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* LEFT: editor */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Subject line *
                </label>
                <button
                  type="button"
                  onClick={() => insertFirstName("subject")}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.45 0.08 60)" }}
                  title="Insert {{firstName}} into the subject"
                >
                  + Name
                </button>
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder='e.g. {{firstName}}, a quick note for you'
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none focus:ring-2"
                style={{ borderColor: "oklch(0.90 0.015 80)", color: "oklch(0.20 0.015 50)" }}
              />
              <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.015 50)" }}>
                Tip: click <strong>+ Name</strong> to personalize — each person sees their own name.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Inbox preview text
                </label>
                <button
                  type="button"
                  onClick={() => insertFirstName("preview")}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.45 0.08 60)" }}
                >
                  + Name
                </button>
              </div>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Short line shown after the subject in Gmail (optional)"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                    Banner headline
                  </label>
                  <button
                    type="button"
                    onClick={() => insertFirstName("headline")}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.45 0.08 60)" }}
                  >
                    + Name
                  </button>
                </div>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Optional soft pink banner title"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Banner subtitle
                </label>
                <input
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2" style={{ borderColor: "oklch(0.94 0.01 80)" }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                Email body
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => insertFirstName("body")}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
                >
                  {"{ }"} Insert name
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.35 0.02 50)" }}
                >
                  <ImageIcon size={12} /> Add image
                </button>
                {uploadingImage && (
                  <span className="text-xs flex items-center gap-1" style={{ color: "oklch(0.72 0.12 75)" }}>
                    <Loader2 size={12} className="animate-spin" /> Uploading…
                  </span>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImageFile(f);
                e.target.value = "";
              }}
            />
            <div className="min-h-[320px]">
              <RichTextEditor
                ref={editorRef}
                value={bodyHtml}
                onChange={setBodyHtml}
                onImageInsert={() => fileInputRef.current?.click()}
                placeholder="Type your message… Use “Insert name” for {{firstName}}"
                className="min-h-[320px]"
                showMergeTags
              />
            </div>
            <div
              className="px-4 py-2.5 text-xs border-t space-y-1"
              style={{ color: "oklch(0.52 0.015 50)", borderColor: "oklch(0.94 0.01 80)", background: "oklch(0.99 0.005 80)" }}
            >
              <p>
                <strong>Easy wins:</strong> “Hi …” and Lee Anne&apos;s sign-off are added automatically.
                Click an image to resize (S / M / L / Full) or align it.
              </p>
              <p>
                YouTube videos become a nice photo + “Watch” button in the inbox (email apps block embedded video).
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                Optional gold button
              </p>
              <button
                type="button"
                onClick={() => insertFirstName("cta")}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.45 0.08 60)" }}
              >
                + Name
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Button text (e.g. Book a call)"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
            </div>
          </div>

          {/* Audience */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: "oklch(0.72 0.12 75)" }} />
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                Who gets this?
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "health" as const, label: "Health", desc: "Snack Hack, quiz, leads, clients" },
                  { id: "finance" as const, label: "Finance", desc: "FPU sign-ups" },
                  { id: "all" as const, label: "Everyone", desc: "All emails we have" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudienceGroup(opt.id)}
                  className="flex flex-col items-start px-4 py-3 rounded-xl text-left border transition-all min-w-[140px]"
                  style={{
                    background: audienceGroup === opt.id ? "oklch(0.97 0.03 75)" : "oklch(0.99 0.005 80)",
                    borderColor: audienceGroup === opt.id ? "oklch(0.72 0.12 75)" : "oklch(0.90 0.015 80)",
                  }}
                >
                  <span className="font-bold text-sm" style={{ color: "oklch(0.20 0.015 50)" }}>
                    {opt.label}
                  </span>
                  <span className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeEnrolled}
                onChange={(e) => setExcludeEnrolled(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="text-sm font-semibold" style={{ color: "oklch(0.25 0.015 50)" }}>
                  Exclude people already enrolled in R.E.C.L.A.I.M.
                </span>
                <span className="block text-xs mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Recommended so current clients don&apos;t get prospect-style emails.
                </span>
              </span>
            </label>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                Also exclude specific emails
              </label>
              <div className="flex gap-2">
                <input
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExcludeEmail();
                    }
                  }}
                  placeholder="name@example.com"
                  className="flex-1 rounded-lg px-3.5 py-2 text-sm border outline-none"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
                <button
                  type="button"
                  onClick={addExcludeEmail}
                  className="px-3 py-2 rounded-lg text-sm font-bold"
                  style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.35 0.02 50)" }}
                >
                  Add
                </button>
              </div>
              {excludeEmails.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {excludeEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "oklch(0.95 0.02 25)", color: "oklch(0.40 0.08 25)" }}
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => setExcludeEmails((prev) => prev.filter((e) => e !== email))}
                        className="hover:opacity-70"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div
              className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
              style={{ background: "oklch(0.97 0.02 75)" }}
            >
              <div>
                <p className="text-sm font-bold" style={{ color: "oklch(0.25 0.02 50)" }}>
                  {audienceQuery.isFetching ? "Counting…" : `${recipientTotal.toLocaleString()} people will receive this`}
                </p>
                {audienceQuery.data?.sample && audienceQuery.data.sample.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                    e.g. {audienceQuery.data.sample.slice(0, 3).map((s) => s.email).join(", ")}
                    {recipientTotal > 3 ? "…" : ""}
                  </p>
                )}
              </div>
              <CheckCircle2 size={22} style={{ color: "oklch(0.72 0.12 75)", flexShrink: 0 }} />
            </div>

            <div className="pt-2 border-t" style={{ borderColor: "oklch(0.94 0.01 80)" }}>
              <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                Send yourself a test first
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Leave blank to use your admin email"
                  className="flex-1 min-w-[180px] rounded-lg px-3.5 py-2 text-sm border outline-none"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
                <button
                  type="button"
                  onClick={handleTest}
                  disabled={sendTest.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold"
                  style={{ background: "oklch(0.25 0.02 50)", color: "oklch(1 0 0)" }}
                >
                  {sendTest.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Send test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: live preview */}
        <div className="xl:sticky xl:top-4 self-start">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b flex items-center gap-2"
              style={{ borderColor: "oklch(0.94 0.01 80)", background: "oklch(0.98 0.008 80)" }}
            >
              <Eye size={15} style={{ color: "oklch(0.72 0.12 75)" }} />
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.42 0.015 50)" }}>
                Live preview
              </span>
              {subject && (
                <span className="ml-auto text-xs truncate max-w-[50%]" style={{ color: "oklch(0.52 0.015 50)" }}>
                  {subject}
                </span>
              )}
            </div>
            <iframe
              ref={previewFrameRef}
              title="Newsletter preview"
              className="w-full border-0 bg-[#f5f0eb]"
              style={{ height: "min(780px, 75vh)" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

      {/* Send confirm modal */}
      {showSendConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "oklch(0 0 0 / 0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSendConfirm(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h3
              className="text-xl font-bold mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
            >
              Send this newsletter?
            </h3>
            <p className="text-sm mb-4" style={{ color: "oklch(0.45 0.015 50)" }}>
              This will email <strong>{recipientTotal.toLocaleString()}</strong> people in{" "}
              <strong>{AUDIENCE_LABELS[audienceGroup]}</strong>
              {excludeEnrolled ? " (excluding enrolled R.E.C.L.A.I.M. clients)" : ""}.
              {excludeEmails.length > 0 ? ` Plus ${excludeEmails.length} manual exclusion(s).` : ""}
            </p>
            <p className="text-sm mb-2" style={{ color: "oklch(0.45 0.015 50)" }}>
              Subject: <em>{subject || "(no subject)"}</em>
            </p>
            <p className="text-xs mb-3" style={{ color: "oklch(0.52 0.015 50)" }}>
              Type <strong>SEND</strong> to confirm:
            </p>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SEND"
              className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none mb-4 font-mono tracking-widest"
              style={{ borderColor: "oklch(0.90 0.015 80)" }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowSendConfirm(false)}
                className="px-4 py-2 rounded-full text-sm font-bold"
                style={{ background: "oklch(0.96 0.02 50)", color: "oklch(0.40 0.02 50)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={confirmText !== "SEND" || sendNewsletter.isPending || recipientTotal === 0}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold disabled:opacity-40"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
              >
                {sendNewsletter.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Send now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function escapePreview(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
