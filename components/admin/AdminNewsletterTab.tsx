"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Copy,
  Eye,
  History,
  Image as ImageIcon,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/RichTextEditor";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";

type AudienceGroup = "finance" | "health" | "all" | "snack_hack";
type View = "list" | "compose" | "analytics" | "finance" | "history";

const AUDIENCE_LABELS: Record<AudienceGroup, string> = {
  finance: "Finance",
  health: "Health",
  all: "Everyone",
  snack_hack: "Snack Hack",
};

const DEFAULT_GREETING = "Hi {{firstName}},";
const DEFAULT_SIGN_OFF_CLOSING = "With love,";
const DEFAULT_SIGN_OFF_NAME = "Lee Anne";
const DEFAULT_SIGN_OFF_TITLE = `Certified Life & Health Coach · ${BRAND.name}`;

function statusBadge(status: string) {
  const styles: Record<string, { bg: string; color: string }> = {
    draft: { bg: "oklch(0.94 0.02 80)", color: "oklch(0.42 0.02 50)" },
    scheduled: { bg: "oklch(0.93 0.05 250)", color: "oklch(0.40 0.12 250)" },
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

function escapePreview(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function personalizePreview(text: string, name: string) {
  return text
    .replace(/\{\{\s*firstName\s*\}\}/gi, name)
    .replace(/\{\{\s*name\s*\}\}/gi, name);
}

export function AdminNewsletterTab() {
  const utils = trpc.useUtils();
  const [view, setView] = useState<View>("list");
  const [editingId, setEditingId] = useState<number | undefined>(undefined);

  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [greetingTemplate, setGreetingTemplate] = useState(DEFAULT_GREETING);
  const [signOffClosing, setSignOffClosing] = useState(DEFAULT_SIGN_OFF_CLOSING);
  const [signOffName, setSignOffName] = useState(DEFAULT_SIGN_OFF_NAME);
  const [signOffTitle, setSignOffTitle] = useState(DEFAULT_SIGN_OFF_TITLE);
  const [bodyHtml, setBodyHtml] = useState(emptyBody());
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [audienceGroup, setAudienceGroup] = useState<AudienceGroup>("health");
  const [excludeEnrolled, setExcludeEnrolled] = useState(true);
  const [excludeEmails, setExcludeEmails] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleLocal, setScheduleLocal] = useState(""); // datetime-local
  const [testEmail, setTestEmail] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewName, setPreviewName] = useState("Sarah");
  const [snippetName, setSnippetName] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [logNewsletterId, setLogNewsletterId] = useState<number | null>(null);
  const [financeEmail, setFinanceEmail] = useState("");
  const [financeFirstName, setFinanceFirstName] = useState("");
  const [financePaste, setFinancePaste] = useState("");
  const [financeParsed, setFinanceParsed] = useState<
    { email: string; firstName: string }[] | null
  >(null);
  const [financeParseMeta, setFinanceParseMeta] = useState<{
    skippedLines: number;
    duplicateEmails: number;
  } | null>(null);

  const editorRef = useRef<RichTextEditorHandle>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);

  const { data: newsletters = [], isLoading: listLoading } = trpc.newsletter.list.useQuery(undefined, {
    refetchInterval: (q) => {
      const items = q.state.data ?? [];
      return items.some((n) => n.status === "sending" || n.status === "scheduled") ? 4000 : false;
    },
  });

  const audienceQuery = trpc.newsletter.audiencePreview.useQuery(
    { audienceGroup, excludeEnrolled, excludeEmails },
    { enabled: view === "compose", placeholderData: keepPreviousData }
  );

  const { data: snippets = [] } = trpc.newsletter.listSnippets.useQuery(undefined, {
    enabled: view === "compose",
  });
  const { data: analytics } = trpc.newsletter.analytics.useQuery(undefined, {
    enabled: view === "analytics",
  });
  const { data: financeList = [], isLoading: financeLoading } = trpc.newsletter.listFinance.useQuery(
    undefined,
    { enabled: view === "finance" }
  );
  const { data: personHistory = [], isFetching: historyLoading } =
    trpc.newsletter.personHistory.useQuery(
      { query: historyQuery },
      { enabled: view === "history" && historyQuery.trim().length >= 2 }
    );
  const { data: sendLog = [] } = trpc.newsletter.sendLog.useQuery(
    { newsletterId: logNewsletterId!, limit: 300 },
    { enabled: !!logNewsletterId }
  );

  const previewHtml = useMemo(() => {
    const logo = BRAND.logoWideUrl || BRAND.logoUrl;
    const name = previewName || "there";
    const h = personalizePreview(headline.trim(), name);
    const sub = personalizePreview(subheadline.trim(), name);
    const greet = personalizePreview(greetingTemplate.trim() || DEFAULT_GREETING, name);
    const ctaL = personalizePreview(ctaLabel.trim(), name);
    const ctaU = ctaUrl.trim();
    const body = personalizePreview(bodyHtml || "<p></p>", name);
    const closing = signOffClosing.trim();
    const sName = signOffName.trim();
    const sTitle = signOffTitle.trim();

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
  .body blockquote{background:#f9f5f0;border-left:4px solid #c9a96e;padding:14px 18px;margin:20px 0;border-radius:0 10px 10px 0;}
  .cta{text-align:center;margin:28px 0;}
  .cta a{display:inline-block;background:#c9a96e;color:#fff!important;padding:14px 32px;border-radius:9999px;text-decoration:none;font-weight:700;}
  .footer{padding:28px 40px 36px;border-top:1px solid #f0e8e4;text-align:center;color:#8a9a8a;font-size:12px;}
</style></head><body>
<div class="wrap">
  <div class="logo"><img src="${logo}" alt="${BRAND.name}" style="max-width:180px;height:auto;"/></div>
  ${h ? `<div class="hero"><h1>${escapePreview(h)}</h1>${sub ? `<p>${escapePreview(sub)}</p>` : ""}</div>` : ""}
  <div class="body">
    ${greet ? `<p>${escapePreview(greet)}</p>` : ""}
    ${body}
    ${ctaL && ctaU ? `<div class="cta"><a href="${escapePreview(ctaU)}">${escapePreview(ctaL)}</a></div>` : ""}
    <p style="margin-top:28px;">
      ${closing ? `${escapePreview(closing)}<br/>` : ""}
      ${sName ? `<strong>${escapePreview(sName)}</strong>` : ""}
      ${sName && sTitle ? "<br/>" : ""}
      ${sTitle ? `<span style="color:#8a9a8a;font-size:13px;">${escapePreview(sTitle)}</span>` : ""}
    </p>
  </div>
  <div class="footer">
    <p style="margin:0 0 10px;">You're receiving this because you joined our email list.</p>
    <p style="margin:0;"><span style="text-decoration:underline;color:#8a7060;">Unsubscribe</span> · Privacy</p>
    <p style="margin:12px 0 0;color:#b0b8b0;font-size:11px;">${BRAND.name} · mindandbodyresetcoach.com</p>
  </div>
</div>
</body></html>`;
  }, [
    bodyHtml,
    headline,
    subheadline,
    ctaLabel,
    ctaUrl,
    greetingTemplate,
    signOffClosing,
    signOffName,
    signOffTitle,
    previewName,
  ]);

  useEffect(() => {
    const frame = previewFrameRef.current;
    if (!frame || view !== "compose") return;
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(previewHtml);
    doc.close();
  }, [previewHtml, view]);

  const saveDraft = trpc.newsletter.saveDraft.useMutation({
    onSuccess: (data) => {
      setEditingId(data.id);
      toast.success("Draft saved");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const sendTest = trpc.newsletter.sendTest.useMutation({
    onSuccess: (data) =>
      toast.success(`Test sent to ${data.to} (personalized as ${data.personalizedAs})`),
    onError: (e) => toast.error(e.message),
  });

  const sendNewsletter = trpc.newsletter.send.useMutation({
    onSuccess: (data) => {
      if (data.scheduled) {
        toast.success(
          `Scheduled for ${data.scheduledAt ? new Date(data.scheduledAt).toLocaleString() : "later"} · ${data.recipientCount} people`
        );
      } else {
        toast.success(`Sending to ${data.recipientCount} people…`);
      }
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
      toast.success("Cancelled");
      utils.newsletter.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteDraft = trpc.newsletter.deleteDraft.useMutation({
    onSuccess: () => {
      toast.success("Deleted");
      utils.newsletter.list.invalidate();
      setLogNewsletterId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const uploadImage = trpc.newsletter.uploadImage.useMutation();
  const saveSnippet = trpc.newsletter.saveSnippet.useMutation({
    onSuccess: () => {
      toast.success("Snippet saved");
      setSnippetName("");
      utils.newsletter.listSnippets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const deleteSnippet = trpc.newsletter.deleteSnippet.useMutation({
    onSuccess: () => {
      toast.success("Snippet deleted");
      utils.newsletter.listSnippets.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const addFinance = trpc.newsletter.addFinance.useMutation({
    onSuccess: () => {
      toast.success("Added to finance list");
      setFinanceEmail("");
      setFinanceFirstName("");
      utils.newsletter.listFinance.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const parseFinancePaste = trpc.newsletter.parseFinancePaste.useMutation({
    onSuccess: (data) => {
      setFinanceParsed(data.contacts);
      setFinanceParseMeta({
        skippedLines: data.skippedLines,
        duplicateEmails: data.duplicateEmails,
      });
      if (data.total === 0) {
        toast.error("No emails found in that paste — check the text and try again");
      } else {
        toast.success(`Found ${data.total} contact${data.total === 1 ? "" : "s"}`);
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const bulkAddFinance = trpc.newsletter.bulkAddFinance.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Imported ${data.added} new · ${data.alreadyOnList} already on list` +
          (data.failed ? ` · ${data.failed} failed` : "")
      );
      setFinancePaste("");
      setFinanceParsed(null);
      setFinanceParseMeta(null);
      utils.newsletter.listFinance.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const removeFinance = trpc.newsletter.removeFinance.useMutation({
    onSuccess: () => {
      toast.success("Removed from finance list");
      utils.newsletter.listFinance.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetCompose = useCallback(() => {
    setEditingId(undefined);
    setSubject("");
    setPreviewText("");
    setHeadline("");
    setSubheadline("");
    setGreetingTemplate(DEFAULT_GREETING);
    setSignOffClosing(DEFAULT_SIGN_OFF_CLOSING);
    setSignOffName(DEFAULT_SIGN_OFF_NAME);
    setSignOffTitle(DEFAULT_SIGN_OFF_TITLE);
    setBodyHtml(emptyBody());
    setCtaLabel("");
    setCtaUrl("");
    setAudienceGroup("health");
    setExcludeEnrolled(true);
    setExcludeEmails([]);
    setExcludeInput("");
    setConfirmText("");
    setShowSendConfirm(false);
    setScheduleEnabled(false);
    setScheduleLocal("");
  }, []);

  const loadRowIntoComposer = (
    row: (typeof newsletters)[number],
    opts?: { asNewDraft?: boolean }
  ) => {
    setEditingId(opts?.asNewDraft ? undefined : row.id);
    setSubject(row.subject);
    setPreviewText(row.previewText ?? "");
    setHeadline(row.headline ?? "");
    setSubheadline(row.subheadline ?? "");
    setGreetingTemplate(row.greetingTemplate ?? DEFAULT_GREETING);
    setSignOffClosing(row.signOffClosing ?? DEFAULT_SIGN_OFF_CLOSING);
    setSignOffName(row.signOffName ?? DEFAULT_SIGN_OFF_NAME);
    setSignOffTitle(row.signOffTitle ?? DEFAULT_SIGN_OFF_TITLE);
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
    setScheduleEnabled(false);
    setScheduleLocal("");
    setView("compose");
  };

  const openDraft = (id: number) => {
    const row = newsletters.find((n) => n.id === id);
    if (!row) return;
    if (row.status !== "draft" && row.status !== "failed" && row.status !== "cancelled") {
      toast.message("Use Duplicate to edit a copy of a scheduled/sent newsletter.");
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

  const composePayload = () => ({
    id: editingId,
    subject: subject.trim(),
    previewText: previewText.trim() || null,
    headline: headline.trim() || null,
    subheadline: subheadline.trim() || null,
    greetingTemplate,
    signOffClosing,
    signOffName,
    signOffTitle,
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
      toast.error("Type SEND in all caps to confirm");
      return;
    }
    let scheduledAt: string | null = null;
    if (scheduleEnabled) {
      if (!scheduleLocal) {
        toast.error("Pick a date and time to schedule");
        return;
      }
      const d = new Date(scheduleLocal);
      if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now() + 30_000) {
        toast.error("Schedule time must be at least 1 minute from now");
        return;
      }
      scheduledAt = d.toISOString();
    }
    sendNewsletter.mutate({
      ...composePayload(),
      confirmPhrase: "SEND",
      scheduledAt,
    });
  };

  const addExcludeEmail = () => {
    const email = excludeInput.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      toast.error("Enter a valid email");
      return;
    }
    if (!excludeEmails.includes(email)) setExcludeEmails((prev) => [...prev, email]);
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

  const insertFirstName = (target: "subject" | "preview" | "headline" | "greeting" | "body" | "cta") => {
    const tag = "{{firstName}}";
    if (target === "body") {
      editorRef.current?.insertText(tag);
      toast.message("{{firstName}} → each person’s real first name when sent (e.g. Sarah, Mia)");
      return;
    }
    if (target === "subject") setSubject((s) => s + (s && !s.endsWith(" ") ? " " : "") + tag);
    if (target === "preview") setPreviewText((s) => s + tag);
    if (target === "headline") setHeadline((s) => s + (s && !s.endsWith(" ") ? " " : "") + tag);
    if (target === "greeting") setGreetingTemplate((s) => (s.includes("{{firstName}}") ? s : s + tag));
    if (target === "cta") setCtaLabel((s) => s + (s && !s.endsWith(" ") ? " " : "") + tag);
  };

  const navBtn = (id: View, label: string, icon: ReactNode) => (
    <button
      key={id}
      type="button"
      onClick={() => setView(id)}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: view === id ? "oklch(0.72 0.12 75)" : "oklch(0.96 0.025 50)",
        color: view === id ? "oklch(1 0 0)" : "oklch(0.40 0.02 50)",
      }}
    >
      {icon} {label}
    </button>
  );

  // ── Sub-nav ───────────────────────────────────────────────────────────────
  const subNav = (
    <div className="flex flex-wrap gap-2 mb-6">
      {navBtn("list", "Newsletters", <Mail size={14} />)}
      {navBtn("analytics", "Analytics", <BarChart3 size={14} />)}
      {navBtn("history", "Person history", <History size={14} />)}
      {navBtn("finance", "Finance list", <Wallet size={14} />)}
    </div>
  );

  // ── Analytics ─────────────────────────────────────────────────────────────
  if (view === "analytics") {
    const l30 = analytics?.last30Days;
    return (
      <div>
        <h2
          className="font-bold text-3xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Newsletter analytics
        </h2>
        <p className="mb-4 max-w-2xl" style={{ color: "oklch(0.52 0.015 50)" }}>
          Live from your database + Resend webhooks (delivered, opens, clicks, bounces).
          Opens/clicks require tracking enabled on your Resend domain and the webhook configured.
        </p>
        {subNav}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            { label: "Sent (30d)", value: l30?.sent ?? "—" },
            { label: "Delivered", value: l30?.delivered ?? "—", sub: l30 ? `${l30.deliveryRate}%` : undefined },
            { label: "Opened", value: l30?.opened ?? "—", sub: l30 ? `${l30.openRate}%` : undefined },
            { label: "Clicked", value: l30?.clicked ?? "—", sub: l30 ? `${l30.clickRate}%` : undefined },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.55 0.015 50)" }}>
                {c.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "oklch(0.22 0.015 50)" }}>
                {c.value}
              </p>
              {c.sub && (
                <p className="text-xs font-semibold mt-0.5" style={{ color: "oklch(0.72 0.12 75)" }}>
                  {c.sub} rate
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Campaigns (30d)", value: l30?.campaigns ?? "—" },
            { label: "Bounced", value: l30?.bounced ?? "—" },
            { label: "Failed (API)", value: l30?.failed ?? "—" },
            { label: "Skipped (opt-out)", value: l30?.skipped ?? "—" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.55 0.015 50)" }}>
                {c.label}
              </p>
              <p className="text-2xl font-bold mt-1" style={{ color: "oklch(0.22 0.015 50)" }}>
                {c.value}
              </p>
            </div>
          ))}
        </div>
        {analytics?.byAudience && analytics.byAudience.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-5 mb-6 shadow-sm">
            <p className="text-xs font-bold uppercase mb-3" style={{ color: "oklch(0.52 0.015 50)" }}>
              By audience (30 days)
            </p>
            <div className="space-y-2">
              {analytics.byAudience.map((a) => (
                <div key={a.audience} className="flex justify-between text-sm gap-2 flex-wrap">
                  <span className="font-semibold capitalize">{AUDIENCE_LABELS[a.audience as AudienceGroup] ?? a.audience}</span>
                  <span style={{ color: "oklch(0.45 0.015 50)" }}>
                    {a.sent} sent · {a.opened} opened · {a.clicked} clicked · {a.campaigns} campaign
                    {a.campaigns === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b text-xs font-bold uppercase" style={{ color: "oklch(0.52 0.015 50)" }}>
            Recent campaigns — click for per-person log
          </div>
          <div className="divide-y">
            {(analytics?.recent ?? []).map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setLogNewsletterId(n.id);
                }}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 flex flex-wrap justify-between gap-2"
              >
                <span className="font-semibold text-sm">{n.subject}</span>
                <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                  {n.sentCount} sent
                  {" · "}
                  {n.openRate}% open
                  {" · "}
                  {n.clickRate}% click
                  {n.bounced ? ` · ${n.bounced} bounce` : ""}
                  {n.sentAt ? ` · ${new Date(n.sentAt).toLocaleDateString()}` : ""}
                </span>
              </button>
            ))}
            {(analytics?.recent ?? []).length === 0 && (
              <p className="px-5 py-8 text-sm text-center" style={{ color: "oklch(0.55 0.015 50)" }}>
                No sent campaigns yet.
              </p>
            )}
          </div>
        </div>
        {logNewsletterId && (
          <div className="mt-4 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-sm">Recipient log · newsletter #{logNewsletterId}</p>
              <button type="button" onClick={() => setLogNewsletterId(null)} className="text-xs font-bold text-slate-500">
                Close
              </button>
            </div>
            <div className="max-h-80 overflow-auto text-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase" style={{ color: "oklch(0.55 0.015 50)" }}>
                    <th className="py-1 pr-2">Email</th>
                    <th className="py-1 pr-2">Name</th>
                    <th className="py-1 pr-2">API</th>
                    <th className="py-1 pr-2">Delivery</th>
                    <th className="py-1 pr-2">Opens</th>
                    <th className="py-1 pr-2">Clicks</th>
                    <th className="py-1">When</th>
                  </tr>
                </thead>
                <tbody>
                  {sendLog.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-1.5 pr-2 text-xs">{r.email}</td>
                      <td className="py-1.5 pr-2">{r.firstName}</td>
                      <td className="py-1.5 pr-2 text-xs">{r.status}</td>
                      <td className="py-1.5 pr-2 text-xs">{r.deliveryStatus ?? "—"}</td>
                      <td className="py-1.5 pr-2">{r.openCount ?? 0}</td>
                      <td className="py-1.5 pr-2">{r.clickCount ?? 0}</td>
                      <td className="py-1.5 text-xs text-slate-500">
                        {new Date(r.sentAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sendLog.length === 0 && (
                <p className="text-xs py-4 text-slate-500">No per-person log for this send (sent before logging existed).</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Person history ────────────────────────────────────────────────────────
  if (view === "history") {
    return (
      <div>
        <h2
          className="font-bold text-3xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Person history
        </h2>
        <p className="mb-4" style={{ color: "oklch(0.52 0.015 50)" }}>
          Search by email or first name to see every newsletter they received.
        </p>
        {subNav}
        <input
          value={historyQuery}
          onChange={(e) => setHistoryQuery(e.target.value)}
          placeholder="Search email or name…"
          className="w-full max-w-md rounded-lg px-3.5 py-2.5 text-sm border mb-4 outline-none"
          style={{ borderColor: "oklch(0.90 0.015 80)" }}
        />
        {historyLoading && <Loader2 className="animate-spin mb-4" style={{ color: "oklch(0.72 0.12 75)" }} />}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {personHistory.length === 0 ? (
            <p className="px-5 py-10 text-sm text-center text-slate-500">
              {historyQuery.trim().length < 2 ? "Type at least 2 characters to search." : "No sends found."}
            </p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-4 py-2">Person</th>
                  <th className="px-4 py-2">Subject</th>
                  <th className="px-4 py-2">Audience</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {personHistory.map((r) => (
                  <tr key={r.sendId} className="border-t">
                    <td className="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-semibold">{r.firstName || "—"}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="px-4 py-2">{r.subject}</td>
                    <td className="px-4 py-2 capitalize">
                      {AUDIENCE_LABELS[r.audienceGroup as AudienceGroup] ?? r.audienceGroup}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      {r.status}
                      {r.deliveryStatus ? ` · ${r.deliveryStatus}` : ""}
                      {(r.openCount ?? 0) > 0 ? ` · ${r.openCount} open` : ""}
                      {(r.clickCount ?? 0) > 0 ? ` · ${r.clickCount} click` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── Finance list ──────────────────────────────────────────────────────────
  if (view === "finance") {
    return (
      <div>
        <h2
          className="font-bold text-3xl mb-2"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Finance email list
        </h2>
        <p className="mb-4 max-w-2xl" style={{ color: "oklch(0.52 0.015 50)" }}>
          Dave Ramsey’s site doesn’t sync here. <strong>Copy/paste a whole list</strong> (names + emails)
          and we’ll extract them. Site FPU sign-ups are already included.
        </p>
        {subNav}

        {/* Bulk paste importer */}
        <div
          className="bg-white rounded-xl border shadow-sm p-5 mb-4"
          style={{ borderColor: "oklch(0.90 0.04 75)" }}
        >
          <p className="text-xs font-bold uppercase mb-1" style={{ color: "oklch(0.45 0.06 60)" }}>
            Bulk import from Dave Ramsey / Excel
          </p>
          <p className="text-xs mb-3" style={{ color: "oklch(0.52 0.015 50)" }}>
            Paste anything: spreadsheet rows, “Jane Doe jane@email.com”, “Name &lt;email&gt;”, CSV, or a
            list of emails. Click <strong>Extract</strong> to preview, then <strong>Import all</strong>.
          </p>
          <textarea
            value={financePaste}
            onChange={(e) => {
              setFinancePaste(e.target.value);
              setFinanceParsed(null);
              setFinanceParseMeta(null);
            }}
            rows={8}
            placeholder={`Examples (any mix is fine):\nSarah Johnson  sarah@example.com\nMia Lee <mia@example.com>\nDoe, Jane\tjane@school.org\nbob@gmail.com`}
            className="w-full rounded-lg px-3.5 py-3 text-sm border outline-none font-mono mb-3"
            style={{ borderColor: "oklch(0.90 0.015 80)", background: "oklch(0.99 0.005 80)" }}
          />
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              onClick={() => {
                if (!financePaste.trim()) {
                  toast.error("Paste a list first");
                  return;
                }
                parseFinancePaste.mutate({ text: financePaste });
              }}
              disabled={parseFinancePaste.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: "oklch(0.25 0.02 50)", color: "white" }}
            >
              {parseFinancePaste.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              Extract names &amp; emails
            </button>
            {financeParsed && financeParsed.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  bulkAddFinance.mutate({ contacts: financeParsed });
                }}
                disabled={bulkAddFinance.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold"
                style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
              >
                {bulkAddFinance.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                Import all ({financeParsed.length})
              </button>
            )}
            {(financePaste || financeParsed) && (
              <button
                type="button"
                onClick={() => {
                  setFinancePaste("");
                  setFinanceParsed(null);
                  setFinanceParseMeta(null);
                }}
                className="px-3 py-2 rounded-full text-sm font-bold text-slate-500"
              >
                Clear
              </button>
            )}
          </div>

          {financeParsed && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "oklch(0.92 0.02 80)" }}>
              <div
                className="px-4 py-2 text-xs font-bold flex flex-wrap gap-3"
                style={{ background: "oklch(0.97 0.02 75)", color: "oklch(0.35 0.04 50)" }}
              >
                <span>{financeParsed.length} ready to import</span>
                {financeParseMeta && financeParseMeta.duplicateEmails > 0 && (
                  <span>{financeParseMeta.duplicateEmails} duplicate email(s) removed</span>
                )}
                {financeParseMeta && financeParseMeta.skippedLines > 0 && (
                  <span>{financeParseMeta.skippedLines} line(s) skipped (no email)</span>
                )}
              </div>
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-sm text-left">
                  <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-2">First name</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeParsed.map((c, i) => (
                      <tr key={`${c.email}-${i}`} className="border-t">
                        <td className="px-4 py-1.5">
                          <input
                            value={c.firstName}
                            onChange={(e) => {
                              const v = e.target.value;
                              setFinanceParsed((prev) =>
                                prev
                                  ? prev.map((row, idx) =>
                                      idx === i ? { ...row, firstName: v } : row
                                    )
                                  : prev
                              );
                            }}
                            className="w-full rounded px-2 py-1 text-sm border outline-none"
                            style={{ borderColor: "oklch(0.92 0.01 80)" }}
                          />
                        </td>
                        <td className="px-4 py-1.5 font-mono text-xs">{c.email}</td>
                        <td className="px-2 py-1.5">
                          <button
                            type="button"
                            title="Remove from import"
                            onClick={() =>
                              setFinanceParsed((prev) =>
                                prev ? prev.filter((_, idx) => idx !== i) : prev
                              )
                            }
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Single add */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 mb-4">
          <p className="text-xs font-bold uppercase mb-3" style={{ color: "oklch(0.52 0.015 50)" }}>
            Or add one person
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={financeFirstName}
              onChange={(e) => setFinanceFirstName(e.target.value)}
              placeholder="First name"
              className="rounded-lg px-3 py-2 text-sm border outline-none w-36"
              style={{ borderColor: "oklch(0.90 0.015 80)" }}
            />
            <input
              value={financeEmail}
              onChange={(e) => setFinanceEmail(e.target.value)}
              placeholder="email@example.com"
              className="rounded-lg px-3 py-2 text-sm border outline-none flex-1 min-w-[200px]"
              style={{ borderColor: "oklch(0.90 0.015 80)" }}
            />
            <button
              type="button"
              onClick={() => {
                if (!financeEmail.includes("@")) {
                  toast.error("Enter a valid email");
                  return;
                }
                addFinance.mutate({
                  email: financeEmail.trim(),
                  firstName: financeFirstName.trim() || undefined,
                });
              }}
              disabled={addFinance.isPending}
              className="px-4 py-2 rounded-full text-sm font-bold"
              style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
            >
              {addFinance.isPending ? "Adding…" : "Add to finance"}
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-4 py-2 text-xs font-bold uppercase border-b text-slate-500">
            Current finance list ({financeList.length})
          </div>
          {financeLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin" style={{ color: "oklch(0.72 0.12 75)" }} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Source</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {financeList.map((c) => (
                  <tr key={c.email} className="border-t">
                    <td className="px-4 py-2 font-semibold">{c.firstName}</td>
                    <td className="px-4 py-2">{c.email}</td>
                    <td className="px-4 py-2 text-xs text-slate-500">{c.source}</td>
                    <td className="px-4 py-2 text-right">
                      {c.canRemove && (
                        <button
                          type="button"
                          onClick={() => removeFinance.mutate({ email: c.email })}
                          className="text-xs font-bold text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!financeLoading && financeList.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No finance contacts yet.</p>
          )}
        </div>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div>
        <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
          <div>
            <h2
              className="font-bold text-3xl mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
            >
              Newsletters
            </h2>
            <p style={{ color: "oklch(0.52 0.015 50)" }}>
              Write once, preview live, schedule or send. {"{{firstName}}"} becomes each person’s real name.
            </p>
          </div>
          <button
            onClick={() => {
              resetCompose();
              setView("compose");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm"
            style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
          >
            <Plus size={16} /> New newsletter
          </button>
        </div>
        {subNav}

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          {listLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.72 0.12 75)" }} />
            </div>
          ) : newsletters.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: "oklch(0.85 0.02 80)" }} />
              <h3 className="text-lg font-semibold mb-1">No newsletters yet</h3>
              <button
                onClick={() => {
                  resetCompose();
                  setView("compose");
                }}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
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
                      <td className="px-5 py-3.5">
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
                            {n.status === "sending" && (
                              <span className="text-slate-400 ml-1">of {n.recipientCount}</span>
                            )}
                          </span>
                        ) : n.status === "scheduled" ? (
                          <span className="text-xs">
                            {n.scheduledAt
                              ? new Date(n.scheduledAt).toLocaleString()
                              : "Scheduled"}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(n.sentAt || n.scheduledAt || n.createdAt).toLocaleString([], {
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
                        {n.status === "sent" && (
                          <button
                            onClick={() => {
                              setLogNewsletterId(n.id);
                              setView("analytics");
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-full"
                            style={{ background: "oklch(0.95 0.03 150)", color: "oklch(0.35 0.08 150)" }}
                          >
                            Recipients
                          </button>
                        )}
                        <button
                          onClick={() => duplicateAsDraft(n.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                          style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.40 0.06 60)" }}
                        >
                          <Copy size={12} /> Duplicate
                        </button>
                        {(n.status === "sending" || n.status === "scheduled") && (
                          <button
                            onClick={() => {
                              if (confirm("Cancel this newsletter?")) cancelSend.mutate({ id: n.id });
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

  // ── Compose ───────────────────────────────────────────────────────────────
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
            {scheduleEnabled ? <Calendar size={15} /> : <Send size={15} />}
            {scheduleEnabled ? "Schedule…" : "Send newsletter"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="space-y-4">
          {/* Subject + greeting + sign-off */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Subject line *
                </label>
                <button
                  type="button"
                  onClick={() => insertFirstName("subject")}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.97 0.03 75)", color: "oklch(0.45 0.08 60)" }}
                >
                  + Name
                </button>
              </div>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder='e.g. {{firstName}}, a quick note for you'
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
              <p className="text-[11px] mt-1" style={{ color: "oklch(0.55 0.015 50)" }}>
                <strong>{"{{firstName}}"}</strong> is replaced with each person’s real first name when the email
                sends (from their lead/subscriber record).
              </p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "oklch(0.52 0.015 50)" }}>
                Inbox preview text
              </label>
              <input
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Optional Gmail preview line"
                className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Banner headline
                </label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm border outline-none"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide mb-1.5 block" style={{ color: "oklch(0.52 0.015 50)" }}>
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

            <div className="rounded-xl p-3 space-y-3" style={{ background: "oklch(0.98 0.01 80)" }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase" style={{ color: "oklch(0.45 0.02 50)" }}>
                  Greeting (editable)
                </p>
                <button
                  type="button"
                  onClick={() => insertFirstName("greeting")}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "oklch(0.72 0.12 75)", color: "white" }}
                >
                  + Name
                </button>
              </div>
              <input
                value={greetingTemplate}
                onChange={(e) => setGreetingTemplate(e.target.value)}
                placeholder="Hi {{firstName}},"
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none bg-white"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
              <p className="text-[11px]" style={{ color: "oklch(0.55 0.015 50)" }}>
                Clear this field to hide the greeting line entirely.
              </p>
              <p className="text-xs font-bold uppercase pt-1" style={{ color: "oklch(0.45 0.02 50)" }}>
                Sign-off (editable)
              </p>
              <input
                value={signOffClosing}
                onChange={(e) => setSignOffClosing(e.target.value)}
                placeholder="With love,"
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none bg-white"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
              <input
                value={signOffName}
                onChange={(e) => setSignOffName(e.target.value)}
                placeholder="Lee Anne"
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none bg-white"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
              <input
                value={signOffTitle}
                onChange={(e) => setSignOffTitle(e.target.value)}
                placeholder="Title line"
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none bg-white"
                style={{ borderColor: "oklch(0.90 0.015 80)" }}
              />
            </div>
          </div>

          {/* Body */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-2"
              style={{ borderColor: "oklch(0.94 0.01 80)" }}
            >
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
            <div className="min-h-[280px]">
              <RichTextEditor
                ref={editorRef}
                value={bodyHtml}
                onChange={setBodyHtml}
                onImageInsert={() => fileInputRef.current?.click()}
                placeholder="Type your message…"
                className="min-h-[280px]"
                showMergeTags
              />
            </div>

            {/* Snippets */}
            <div className="px-4 py-3 border-t space-y-2" style={{ borderColor: "oklch(0.94 0.01 80)", background: "oklch(0.99 0.005 80)" }}>
              <p className="text-xs font-bold uppercase" style={{ color: "oklch(0.52 0.015 50)" }}>
                Saved snippets
              </p>
              <div className="flex flex-wrap gap-1.5">
                {snippets.map((s) => (
                  <div key={s.id} className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        editorRef.current?.insertContent(s.bodyHtml);
                        toast.success(`Inserted “${s.name}”`);
                      }}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: "oklch(0.96 0.025 50)", color: "oklch(0.32 0.02 50)" }}
                    >
                      {s.name}
                    </button>
                    <button
                      type="button"
                      title="Delete snippet"
                      onClick={() => {
                        if (confirm(`Delete snippet “${s.name}”?`)) deleteSnippet.mutate({ id: s.id });
                      }}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {snippets.length === 0 && (
                  <span className="text-[11px] text-slate-500">No snippets yet — save a reusable block below.</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <input
                  value={snippetName}
                  onChange={(e) => setSnippetName(e.target.value)}
                  placeholder="Snippet name (e.g. PS block)"
                  className="rounded-lg px-3 py-1.5 text-xs border outline-none flex-1 min-w-[140px] bg-white"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!snippetName.trim()) {
                      toast.error("Name the snippet");
                      return;
                    }
                    saveSnippet.mutate({ name: snippetName.trim(), bodyHtml });
                  }}
                  disabled={saveSnippet.isPending}
                  className="text-[11px] font-bold px-3 py-1.5 rounded-full"
                  style={{ background: "oklch(0.25 0.02 50)", color: "white" }}
                >
                  Save body as snippet
                </button>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.52 0.015 50)" }}>
              Optional gold button
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Button text"
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
                  { id: "health" as const, label: "Health", desc: "Leads, clients, health list" },
                  { id: "snack_hack" as const, label: "Snack Hack", desc: "Guide downloads only" },
                  { id: "finance" as const, label: "Finance", desc: "FPU + manual finance list" },
                  { id: "all" as const, label: "Everyone", desc: "All emails we have" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAudienceGroup(opt.id)}
                  className="flex flex-col items-start px-4 py-3 rounded-xl text-left border transition-all min-w-[120px]"
                  style={{
                    background: audienceGroup === opt.id ? "oklch(0.97 0.03 75)" : "oklch(0.99 0.005 80)",
                    borderColor: audienceGroup === opt.id ? "oklch(0.72 0.12 75)" : "oklch(0.90 0.015 80)",
                  }}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <span className="text-xs mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
            {audienceGroup === "finance" && (
              <p className="text-xs" style={{ color: "oklch(0.50 0.04 60)" }}>
                Manage the finance list under <strong>Finance list</strong> (for people from Dave Ramsey’s site).
              </p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={excludeEnrolled}
                onChange={(e) => setExcludeEnrolled(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="text-sm font-semibold">Exclude enrolled R.E.C.L.A.I.M. clients</span>
                <span className="block text-xs mt-0.5" style={{ color: "oklch(0.52 0.015 50)" }}>
                  Recommended for prospect-style emails.
                </span>
              </span>
            </label>

            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase" style={{ color: "oklch(0.52 0.015 50)" }}>
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
                  style={{ background: "oklch(0.96 0.025 50)" }}
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
                      <button type="button" onClick={() => setExcludeEmails((p) => p.filter((e) => e !== email))}>
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
                <p className="text-sm font-bold">
                  {audienceQuery.isFetching
                    ? "Counting…"
                    : `${recipientTotal.toLocaleString()} people will receive this`}
                </p>
                {audienceQuery.data?.sample && audienceQuery.data.sample.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "oklch(0.52 0.015 50)" }}>
                    e.g.{" "}
                    {audienceQuery.data.sample
                      .slice(0, 3)
                      .map((s) => `${s.firstName} <${s.email}>`)
                      .join(", ")}
                    {recipientTotal > 3 ? "…" : ""}
                  </p>
                )}
              </div>
              <CheckCircle2 size={22} style={{ color: "oklch(0.72 0.12 75)", flexShrink: 0 }} />
            </div>

            {/* Schedule */}
            <div className="pt-2 border-t space-y-2" style={{ borderColor: "oklch(0.94 0.01 80)" }}>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                />
                <span className="text-sm font-semibold inline-flex items-center gap-1.5">
                  <Calendar size={14} /> Schedule for later
                </span>
              </label>
              {scheduleEnabled && (
                <input
                  type="datetime-local"
                  value={scheduleLocal}
                  onChange={(e) => setScheduleLocal(e.target.value)}
                  className="w-full max-w-xs rounded-lg px-3 py-2 text-sm border outline-none"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                />
              )}
            </div>

            <div className="pt-2 border-t" style={{ borderColor: "oklch(0.94 0.01 80)" }}>
              <p className="text-xs font-bold mb-2 uppercase" style={{ color: "oklch(0.52 0.015 50)" }}>
                Send yourself a test first
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Leave blank for your admin email"
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

        {/* Preview */}
        <div className="xl:sticky xl:top-4 self-start">
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div
              className="px-4 py-3 border-b flex flex-wrap items-center gap-2"
              style={{ borderColor: "oklch(0.94 0.01 80)", background: "oklch(0.98 0.008 80)" }}
            >
              <Eye size={15} style={{ color: "oklch(0.72 0.12 75)" }} />
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: "oklch(0.42 0.015 50)" }}>
                Live preview
              </span>
              <label className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                As
                <input
                  value={previewName}
                  onChange={(e) => setPreviewName(e.target.value)}
                  className="w-20 rounded px-1.5 py-0.5 border text-xs"
                  style={{ borderColor: "oklch(0.90 0.015 80)" }}
                  title="Sample first name for preview"
                />
              </label>
            </div>
            <iframe
              ref={previewFrameRef}
              title="Newsletter preview"
              className="w-full border-0 bg-[#f5f0eb]"
              style={{ height: "min(820px, 78vh)" }}
              sandbox="allow-same-origin"
            />
          </div>
        </div>
      </div>

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
              {scheduleEnabled ? "Schedule this newsletter?" : "Send this newsletter?"}
            </h3>
            <p className="text-sm mb-3" style={{ color: "oklch(0.45 0.015 50)" }}>
              <strong>{recipientTotal.toLocaleString()}</strong> people in{" "}
              <strong>{AUDIENCE_LABELS[audienceGroup]}</strong>
              {excludeEnrolled ? " (excluding enrolled clients)" : ""}.
              {scheduleEnabled && scheduleLocal && (
                <>
                  <br />
                  Goes out: <strong>{new Date(scheduleLocal).toLocaleString()}</strong>
                </>
              )}
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
                style={{ background: "oklch(0.96 0.02 50)" }}
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
                ) : scheduleEnabled ? (
                  <Calendar size={15} />
                ) : (
                  <Send size={15} />
                )}
                {scheduleEnabled ? "Schedule now" : "Send now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
