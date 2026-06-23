"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import { getLoginUrl } from "@/lib/const";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/RichTextEditor";
import { SeoAnalysisPanel } from "@/components/SeoAnalysisPanel";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, Upload, X, Plus,
  ImagePlus, Clock, Calendar, ChevronDown,
} from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Nutrition & Food Freedom",
  "Hormones & Menopause",
  "Mindset & Emotional Wellness",
  "Movement & Energy",
  "Coaching & Transformation",
  "Recipes & Meal Ideas",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Convert a Mountain Time local datetime string to UTC ISO string
function mountainToUtc(localDatetime: string): string {
  // localDatetime is "YYYY-MM-DDTHH:MM" from the input
  // We create a date string with the Mountain timezone offset
  const dt = new Date(localDatetime + ":00");
  // Use Intl to figure out the offset for America/Denver
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Denver",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  // Parse the local time as if it's Mountain Time
  // Create a date in Mountain Time by finding the UTC equivalent
  const parts = localDatetime.split("T");
  const [year, month, day] = parts[0].split("-").map(Number);
  const [hour, minute] = parts[1].split(":").map(Number);

  // Use a trick: format current time in Mountain to find offset
  const now = new Date();
  const utcStr = now.toISOString();
  const mtStr = now.toLocaleString("en-US", { timeZone: "America/Denver" });
  const mtDate = new Date(mtStr);
  const offsetMs = now.getTime() - mtDate.getTime();

  // Build the target date as if in Mountain Time, then add offset to get UTC
  const targetLocal = new Date(year, month - 1, day, hour, minute, 0, 0);
  const targetUtc = new Date(targetLocal.getTime() + offsetMs);
  return targetUtc.toISOString();
}

// Convert a UTC ISO string to Mountain Time local datetime string for the input
function utcToMountain(utcIso: string): string {
  const date = new Date(utcIso);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Get current Mountain Time as datetime-local string
function nowMountain(): string {
  return utcToMountain(new Date().toISOString());
}

export default function BlogEditorClient() {
  usePageTitle({
    title: "Blog Editor | Mind and Body Reset",
    description: "Create and edit blog posts for the Mind & Body Reset health and wellness blog.",
    keywords: "blog editor, content management, blog post"
  });
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const editId = params?.id && params.id !== "new" ? parseInt(params.id) : null;
  const isEditing = editId !== null;

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [coverImage, setCoverImage] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishMode, setPublishMode] = useState<"now" | "schedule" | "draft">("draft");
  const [scheduledAt, setScheduledAt] = useState(""); // Mountain Time local string
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  // Schema markup
  const [schemaTypes, setSchemaTypes] = useState<string[]>(["Article"]);
  const [schemaFaqItems, setSchemaFaqItems] = useState<{question: string; answer: string}[]>([]);
  const [schemaVideoUrl, setSchemaVideoUrl] = useState("");
  const [schemaVideoDescription, setSchemaVideoDescription] = useState("");
  const [schemaHowToSteps, setSchemaHowToSteps] = useState<{name: string; text: string}[]>([]);
  const [schemaExpanded, setSchemaExpanded] = useState(false);
  const [focusKeyword, setFocusKeyword] = useState("");
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("edit");
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [imageAltText, setImageAltText] = useState("");

  // Fetch existing post for editing
  const { data: existingPost, isLoading: loadingPost } = trpc.blog.adminGetById.useQuery(
    { id: editId! },
    { enabled: isEditing }
  );

  // Fetch existing categories from DB
  const { data: dbCategories } = trpc.blog.categories.useQuery();

  // Merge default + DB categories (deduplicated)
  const allCategories = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORIES, ...(dbCategories ?? [])]);
    return Array.from(set).sort();
  }, [dbCategories]);

  // Upload image mutation (shared for cover + inline)
  const uploadImage = trpc.blog.uploadImage.useMutation();

  // Populate form when editing
  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setSlug(existingPost.slug);
      setSlugManual(true);
      setExcerpt(existingPost.excerpt ?? "");
      setContent(existingPost.content);
      const cat = existingPost.category ?? "";
      if (cat && !DEFAULT_CATEGORIES.includes(cat) && !(dbCategories ?? []).includes(cat)) {
        setCategory("__custom__");
        setCustomCategory(cat);
        setShowCustomCategory(true);
      } else {
        setCategory(cat);
      }
      setCoverImage(existingPost.coverImage ?? "");
      setCoverImageAlt(existingPost.coverImageAlt ?? "");
      setPublished(existingPost.published);
      setSeoTitle(existingPost.seoTitle ?? "");
      setSeoDescription(existingPost.seoDescription ?? "");

      // Schema markup
      if (existingPost.schemaTypes) {
        setSchemaTypes(existingPost.schemaTypes.split(",").map(s => s.trim()).filter(Boolean));
      }
      if (existingPost.schemaFaqJson) {
        try { setSchemaFaqItems(JSON.parse(existingPost.schemaFaqJson)); } catch {}
      }
      setSchemaVideoUrl(existingPost.schemaVideoUrl ?? "");
      setSchemaVideoDescription(existingPost.schemaVideoDescription ?? "");
      if (existingPost.schemaHowToStepsJson) {
        try { setSchemaHowToSteps(JSON.parse(existingPost.schemaHowToStepsJson)); } catch {}
      }

      // Set publish mode
      if (existingPost.published) {
        setPublishMode("now");
      } else if (existingPost.scheduledAt) {
        setPublishMode("schedule");
        setScheduledAt(utcToMountain(new Date(existingPost.scheduledAt).toISOString()));
      } else {
        setPublishMode("draft");
      }
    }
  }, [existingPost, dbCategories]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  const createPost = trpc.blog.create.useMutation({
    onSuccess: (data) => {
      if (data.scheduled) {
        toast.success("Blog post scheduled!");
      } else {
        toast.success("Blog post created!");
      }
      router.push("/admin?tab=blog");
    },
    onError: (e) => {
      toast.error(e.message);
      setSaving(false);
    },
  });

  const updatePost = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast.success("Blog post updated!");
      router.push("/admin?tab=blog");
    },
    onError: (e) => {
      toast.error(e.message);
      setSaving(false);
    },
  });

  // Strip HTML tags for word count
  const wordCount = useMemo(() => {
    const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    return text ? text.split(" ").filter(Boolean).length : 0;
  }, [content]);

  const resolvedCategory = useMemo(() => {
    if (category === "__custom__") return customCategory.trim();
    return category;
  }, [category, customCategory]);

  // Determine if the scheduled date is in the past for button label
  const scheduledDateIsPast = useMemo(() => {
    if (publishMode !== "schedule" || !scheduledAt) return false;
    try {
      return new Date(mountainToUtc(scheduledAt)) <= new Date();
    } catch { return false; }
  }, [publishMode, scheduledAt]);

  const saveButtonLabel = publishMode === "now"
    ? "Publish Now"
    : publishMode === "schedule"
    ? (scheduledDateIsPast ? "Publish with Date" : "Schedule Post")
    : "Save Draft";

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [authLoading, isAuthenticated]);

  if (authLoading || loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.18 0.025 160)" }}>
        <Loader2 className="animate-spin" size={32} style={{ color: "oklch(0.72 0.12 75)" }} />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.18 0.025 160)" }}>
        <p style={{ color: "oklch(0.72 0.07 10)" }}>Access denied. Admin role required.</p>
      </div>
    );
  }

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!slug.trim()) { toast.error("Slug is required"); return; }
    if (!content.trim()) { toast.error("Content is required"); return; }

    if (publishMode === "schedule" && !scheduledAt) {
      toast.error("Please select a date and time");
      return;
    }

    setSaving(true);

    const isPublishNow = publishMode === "now";
    const isSchedule = publishMode === "schedule";

    // Determine if the chosen date is in the past (publish immediately with backdate) or future (schedule)
    const chosenDateUtc = isSchedule && scheduledAt ? mountainToUtc(scheduledAt) : undefined;
    const chosenDateIsPast = chosenDateUtc ? new Date(chosenDateUtc) <= new Date() : false;

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      content: content.trim(),
      category: resolvedCategory || undefined,
      coverImage: coverImage.trim() || undefined,
      coverImageAlt: coverImageAlt.trim() || undefined,
      // If schedule mode with a past date, publish immediately with that date
      published: isPublishNow || (isSchedule && chosenDateIsPast),
      publishedAt: isSchedule ? chosenDateUtc : undefined,
      // Only schedule for future dates
      scheduledAt: isSchedule && !chosenDateIsPast ? chosenDateUtc : undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      schemaTypes: schemaTypes.length > 0 ? schemaTypes.join(",") : undefined,
      schemaFaqJson: schemaFaqItems.length > 0 ? JSON.stringify(schemaFaqItems) : undefined,
      schemaVideoUrl: schemaVideoUrl.trim() || undefined,
      schemaVideoDescription: schemaVideoDescription.trim() || undefined,
      schemaHowToStepsJson: schemaHowToSteps.length > 0 ? JSON.stringify(schemaHowToSteps) : undefined,
    };

    if (isEditing && editId) {
      updatePost.mutate({
        id: editId,
        ...payload,
        scheduledAt: isSchedule && !chosenDateIsPast ? chosenDateUtc : null,
      });
    } else {
      createPost.mutate(payload);
    }
  };

  const handleImageFile = (
    file: File,
    onSuccess: (url: string) => void,
    setUploading: (v: boolean) => void,
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadImage.mutate(
        { fileName: file.name, mimeType: file.type, base64Data: base64 },
        {
          onSuccess: (data) => {
            onSuccess(data.url);
            setUploading(false);
          },
          onError: (e) => {
            toast.error(e.message);
            setUploading(false);
          },
        }
      );
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageFile(file, (url) => {
      setCoverImage(url);
      toast.success("Cover image uploaded!");
    }, setUploadingCover);
    e.target.value = "";
  };

  const handleInlineUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleImageFile(file, (url) => {
      // Show alt text dialog before inserting
      setPendingImageUrl(url);
      setImageAltText("");
    }, setUploadingInline);
    e.target.value = "";
  };

  const confirmImageInsert = () => {
    if (pendingImageUrl && editorRef.current) {
      editorRef.current.insertImage(pendingImageUrl, imageAltText);
      toast.success("Image inserted!");
    }
    setPendingImageUrl(null);
    setImageAltText("");
  };

  const handleCategoryChange = (value: string) => {
    if (value === "__custom__") {
      setCategory("__custom__");
      setShowCustomCategory(true);
    } else {
      setCategory(value);
      setShowCustomCategory(false);
      setCustomCategory("");
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.18 0.025 160)" }}>
      {/* Top bar */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "oklch(0.18 0.025 160 / 0.95)", backdropFilter: "blur(12px)", borderColor: "oklch(0.30 0.02 160)" }}
      >
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin?tab=blog")}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "oklch(0.72 0.12 75)" }}
            >
              <ArrowLeft size={16} /> Return to Admin Dashboard
            </button>
            <span className="text-sm font-bold" style={{ color: "oklch(0.97 0.008 10)" }}>
              {isEditing ? "Edit Post" : "New Post"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold"
              style={{
                background: publishMode === "now"
                  ? "oklch(0.38 0.10 148)"
                  : publishMode === "schedule"
                  ? "oklch(0.72 0.12 75)"
                  : "oklch(0.35 0.02 160)",
                color: publishMode === "draft" ? "oklch(0.88 0.01 160)" : publishMode === "now" ? "white" : "oklch(0.22 0.02 160)",
                border: publishMode === "draft" ? "1px solid oklch(0.42 0.02 160)" : "none",
              }}
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : publishMode === "schedule" ? <Clock size={13} /> : publishMode === "now" ? <Eye size={13} /> : <Save size={13} />}
              {saving ? "Saving..." : saveButtonLabel}
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <input
                type="text"
                placeholder="Post title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder-opacity-40"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.97 0.008 10)" }}
              />
            </div>

            {/* Slug */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)" }}>URL:</span>
              <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>/health-wellness-blog/</span>
              <input
                type="text"
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                className="text-xs rounded-lg px-2 py-1 flex-1"
                style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest block mb-2" style={{ color: "oklch(0.55 0.02 160)" }}>
                Excerpt
              </label>
              <textarea
                placeholder="A brief summary of the post (shown in blog listings)..."
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none"
                style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)" }}>
                  Content
                </label>
                <div className="flex items-center gap-2">
                  {/* View mode toggle */}
                  <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid oklch(0.35 0.02 160)" }}>
                    {(["edit", "split", "preview"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className="px-2.5 py-1.5 text-xs font-bold flex items-center gap-1 transition-all"
                        style={{
                          background: viewMode === mode ? "oklch(0.72 0.12 75)" : "oklch(0.28 0.02 160)",
                          color: viewMode === mode ? "oklch(0.22 0.02 160)" : "oklch(0.65 0.02 160)",
                        }}
                        title={mode === "edit" ? "Editor only" : mode === "split" ? "Split view" : "Preview only"}
                      >
                        {mode === "edit" ? <Eye size={12} /> : mode === "split" ? <Eye size={12} /> : <Eye size={12} />}
                        <span className="hidden sm:inline">{mode === "edit" ? "Edit" : mode === "split" ? "Split" : "Preview"}</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => inlineInputRef.current?.click()}
                    disabled={uploadingInline}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)", border: "1px solid oklch(0.35 0.02 160)" }}
                    title="Insert image at cursor position"
                  >
                    {uploadingInline ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
                    Insert Image
                  </button>
                  <input
                    ref={inlineInputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleInlineUpload}
                  />
                  <span className="text-xs" style={{ color: "oklch(0.50 0.02 160)" }}>
                    {wordCount} words
                  </span>
                </div>
              </div>

              {/* Rich Text Editor */}
              <RichTextEditor
                ref={editorRef}
                value={content}
                onChange={setContent}
                onImageInsert={() => inlineInputRef.current?.click()}
                placeholder="Write your blog post content here... Use the toolbar above for headings, bold, lists, and more."
                viewMode={viewMode}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Mode */}
            <div className="rounded-xl p-5" style={{ background: "oklch(0.22 0.02 160)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.55 0.02 160)" }}>
                Publishing
              </p>
              <div className="space-y-2">
                {/* Draft */}
                <button
                  onClick={() => { setPublishMode("draft"); setPublished(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${publishMode === "draft" ? "ring-2 ring-[oklch(0.72_0.12_75)]" : ""}`}
                  style={{
                    background: publishMode === "draft" ? "oklch(0.35 0.02 160)" : "oklch(0.28 0.02 160)",
                    color: "oklch(0.88 0.01 160)",
                  }}
                >
                  <EyeOff size={14} /> Save as Draft
                </button>

                {/* Publish Now */}
                <button
                  onClick={() => { setPublishMode("now"); setPublished(true); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${publishMode === "now" ? "ring-2 ring-[oklch(0.38_0.10_148)]" : ""}`}
                  style={{
                    background: publishMode === "now" ? "oklch(0.38 0.10 148)" : "oklch(0.28 0.02 160)",
                    color: publishMode === "now" ? "white" : "oklch(0.88 0.01 160)",
                  }}
                >
                  <Eye size={14} /> Publish Now
                </button>

                {/* Schedule */}
                <button
                  onClick={() => { setPublishMode("schedule"); setPublished(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${publishMode === "schedule" ? "ring-2 ring-[oklch(0.72_0.12_75)]" : ""}`}
                  style={{
                    background: publishMode === "schedule" ? "oklch(0.35 0.04 75)" : "oklch(0.28 0.02 160)",
                    color: publishMode === "schedule" ? "oklch(0.90 0.10 75)" : "oklch(0.88 0.01 160)",
                  }}
                >
                  <Calendar size={14} /> Set Publish Date (Past or Future)
                </button>

                {/* Schedule picker */}
                {publishMode === "schedule" && (
                  <div className="mt-3 p-3 rounded-lg" style={{ background: "oklch(0.28 0.02 160)", border: "1px solid oklch(0.72 0.12 75)" }}>
                    <label className="text-xs font-bold block mb-2" style={{ color: "oklch(0.72 0.12 75)" }}>
                      <Clock size={12} className="inline mr-1" />
                      Publish Date & Time (Mountain Time)
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                      className="w-full text-sm rounded-lg px-3 py-2"
                      style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.42 0.02 160)", colorScheme: "dark" }}
                    />
                    {scheduledAt && (
                      <p className="text-xs mt-2" style={{ color: "oklch(0.60 0.02 160)" }}>
                        {new Date(mountainToUtc(scheduledAt)) <= new Date()
                          ? `Will backdate to ${new Date(mountainToUtc(scheduledAt)).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })} MT`
                          : `Will publish on ${new Date(mountainToUtc(scheduledAt)).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })} MT`
                        }
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="rounded-xl p-5" style={{ background: "oklch(0.22 0.02 160)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.55 0.02 160)" }}>
                Category
              </p>
              <select
                value={showCustomCategory ? "__custom__" : category}
                onChange={e => handleCategoryChange(e.target.value)}
                className="w-full text-sm rounded-lg px-3 py-2 mb-2"
                style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
              >
                <option value="">Select a category...</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="__custom__">+ Add new category...</option>
              </select>
              {showCustomCategory && (
                <div className="flex items-center gap-2 mt-2">
                  <Plus size={14} style={{ color: "oklch(0.72 0.12 75)", flexShrink: 0 }} />
                  <input
                    type="text"
                    placeholder="Type new category name..."
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    autoFocus
                    className="text-sm rounded-lg px-3 py-2 flex-1"
                    style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.72 0.12 75)" }}
                  />
                  <button
                    onClick={() => { setShowCustomCategory(false); setCategory(""); setCustomCategory(""); }}
                    className="p-1.5 rounded-lg"
                    style={{ color: "oklch(0.55 0.02 160)" }}
                    title="Cancel"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="rounded-xl p-5" style={{ background: "oklch(0.22 0.02 160)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.55 0.02 160)" }}>
                Cover Image
              </p>
              <div className="space-y-3">
                {coverImage && (
                  <div className="relative rounded-lg overflow-hidden">
                    <img src={coverImage} alt={coverImageAlt || "Cover"} className="w-full h-40 object-cover" />
                    <button
                      onClick={() => setCoverImage("")}
                      className="absolute top-2 right-2 p-1.5 rounded-full"
                      style={{ background: "oklch(0.18 0.025 160 / 0.8)" }}
                    >
                      <X size={14} style={{ color: "white" }} />
                    </button>
                  </div>
                )}
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold border-2 border-dashed transition-all"
                  style={{
                    borderColor: uploadingCover ? "oklch(0.72 0.12 75)" : "oklch(0.35 0.02 160)",
                    color: uploadingCover ? "oklch(0.72 0.12 75)" : "oklch(0.65 0.02 160)",
                    background: "oklch(0.25 0.02 160)",
                  }}
                >
                  {uploadingCover ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> {coverImage ? "Replace Image" : "Upload Image"}</>}
                </button>
                <input ref={coverInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleCoverUpload} />
                <div>
                  <p className="text-xs mb-1.5 text-center" style={{ color: "oklch(0.45 0.02 160)" }}>or paste an image URL</p>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={coverImage}
                    onChange={e => setCoverImage(e.target.value)}
                    className="w-full text-xs rounded-lg px-3 py-2"
                    style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                  />
                </div>
                {coverImage && (
                  <div>
                    <label className="text-xs mb-1 block" style={{ color: "oklch(0.60 0.02 160)" }}>Alt Text</label>
                    <input
                      type="text"
                      placeholder="Describe the image for accessibility & SEO..."
                      value={coverImageAlt}
                      onChange={e => setCoverImageAlt(e.target.value)}
                      className="w-full text-xs rounded-lg px-3 py-2"
                      style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SEO */}
            <div className="rounded-xl p-5" style={{ background: "oklch(0.22 0.02 160)" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.55 0.02 160)" }}>
                SEO Settings
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "oklch(0.60 0.02 160)" }}>SEO Title</label>
                  <input
                    type="text"
                    placeholder={title || "Post title..."}
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    className="w-full text-xs rounded-lg px-3 py-2"
                    style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.02 160)" }}>{(seoTitle || title).length}/60 characters</p>
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: "oklch(0.60 0.02 160)" }}>Meta Description</label>
                  <textarea
                    placeholder={excerpt || "Brief description for search engines..."}
                    value={seoDescription}
                    onChange={e => setSeoDescription(e.target.value)}
                    rows={3}
                    className="w-full text-xs rounded-lg px-3 py-2 resize-none"
                    style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                  />
                  <p className="text-xs mt-1" style={{ color: "oklch(0.45 0.02 160)" }}>{(seoDescription || excerpt).length}/160 characters</p>
                </div>
              </div>
            </div>

            {/* Schema Markup */}
            <div className="rounded-xl overflow-hidden" style={{ background: "oklch(0.22 0.02 160)" }}>
              <button
                onClick={() => setSchemaExpanded(v => !v)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)" }}>Schema Markup</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.72 0.12 75)" }}>{schemaTypes.join(", ") || "None"}</p>
                </div>
                <ChevronDown size={14} style={{ color: "oklch(0.55 0.02 160)", transform: schemaExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              {schemaExpanded && (
                <div className="px-5 pb-5 space-y-4 border-t" style={{ borderColor: "oklch(0.28 0.02 160)" }}>
                  {/* Schema type toggles */}
                  <div>
                    <p className="text-xs font-bold mb-2 mt-3" style={{ color: "oklch(0.60 0.02 160)" }}>Schema Types</p>
                    <div className="flex flex-wrap gap-2">
                      {["Article", "FAQ", "VideoObject", "HowTo", "BlogPosting"].map(type => (
                        <button
                          key={type}
                          onClick={() => setSchemaTypes(prev =>
                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                          )}
                          className="px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                          style={{
                            background: schemaTypes.includes(type) ? "oklch(0.38 0.10 148)" : "oklch(0.28 0.02 160)",
                            color: schemaTypes.includes(type) ? "white" : "oklch(0.65 0.02 160)",
                            border: `1px solid ${schemaTypes.includes(type) ? "oklch(0.38 0.10 148)" : "oklch(0.35 0.02 160)"}`
                          }}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FAQ fields */}
                  {schemaTypes.includes("FAQ") && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold" style={{ color: "oklch(0.60 0.02 160)" }}>FAQ Items</p>
                        <button
                          onClick={() => setSchemaFaqItems(prev => [...prev, { question: "", answer: "" }])}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)" }}
                        >+ Add Q&A</button>
                      </div>
                      {schemaFaqItems.map((item, i) => (
                        <div key={i} className="mb-3 p-3 rounded-lg space-y-2" style={{ background: "oklch(0.25 0.02 160)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>Q{i + 1}</span>
                            <button onClick={() => setSchemaFaqItems(prev => prev.filter((_, j) => j !== i))} style={{ color: "oklch(0.55 0.02 160)" }}><X size={12} /></button>
                          </div>
                          <input
                            type="text" placeholder="Question..."
                            value={item.question}
                            onChange={e => setSchemaFaqItems(prev => prev.map((it, j) => j === i ? { ...it, question: e.target.value } : it))}
                            className="w-full text-xs rounded px-2 py-1.5"
                            style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                          />
                          <textarea
                            placeholder="Answer..."
                            value={item.answer}
                            onChange={e => setSchemaFaqItems(prev => prev.map((it, j) => j === i ? { ...it, answer: e.target.value } : it))}
                            rows={2}
                            className="w-full text-xs rounded px-2 py-1.5 resize-none"
                            style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* VideoObject fields */}
                  {schemaTypes.includes("VideoObject") && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold" style={{ color: "oklch(0.60 0.02 160)" }}>Video Details</p>
                      <input
                        type="text" placeholder="YouTube URL..."
                        value={schemaVideoUrl}
                        onChange={e => setSchemaVideoUrl(e.target.value)}
                        className="w-full text-xs rounded-lg px-3 py-2"
                        style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                      />
                      <textarea
                        placeholder="Video description..."
                        value={schemaVideoDescription}
                        onChange={e => setSchemaVideoDescription(e.target.value)}
                        rows={2}
                        className="w-full text-xs rounded-lg px-3 py-2 resize-none"
                        style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                      />
                    </div>
                  )}

                  {/* HowTo fields */}
                  {schemaTypes.includes("HowTo") && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold" style={{ color: "oklch(0.60 0.02 160)" }}>How-To Steps</p>
                        <button
                          onClick={() => setSchemaHowToSteps(prev => [...prev, { name: "", text: "" }])}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)" }}
                        >+ Add Step</button>
                      </div>
                      {schemaHowToSteps.map((step, i) => (
                        <div key={i} className="mb-3 p-3 rounded-lg space-y-2" style={{ background: "oklch(0.25 0.02 160)" }}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs" style={{ color: "oklch(0.55 0.02 160)" }}>Step {i + 1}</span>
                            <button onClick={() => setSchemaHowToSteps(prev => prev.filter((_, j) => j !== i))} style={{ color: "oklch(0.55 0.02 160)" }}><X size={12} /></button>
                          </div>
                          <input
                            type="text" placeholder="Step name..."
                            value={step.name}
                            onChange={e => setSchemaHowToSteps(prev => prev.map((st, j) => j === i ? { ...st, name: e.target.value } : st))}
                            className="w-full text-xs rounded px-2 py-1.5"
                            style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                          />
                          <textarea
                            placeholder="Step instructions..."
                            value={step.text}
                            onChange={e => setSchemaHowToSteps(prev => prev.map((st, j) => j === i ? { ...st, text: e.target.value } : st))}
                            rows={2}
                            className="w-full text-xs rounded px-2 py-1.5 resize-none"
                            style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)" }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SEO Analysis Panel */}
            <SeoAnalysisPanel
              title={title}
              seoTitle={seoTitle}
              seoDescription={seoDescription || excerpt}
              slug={slug}
              content={content}
              excerpt={excerpt}
              category={resolvedCategory}
              focusKeyword={focusKeyword}
              onFocusKeywordChange={setFocusKeyword}
              schemaTypes={schemaTypes}
              onApplySeoTitle={setSeoTitle}
              onApplySeoDescription={setSeoDescription}
              onApplyTitle={(v) => { setTitle(v); setSlugManual(false); }}
              onApplySlug={(v) => { setSlug(v); setSlugManual(true); }}
              onApplyExcerpt={setExcerpt}
            />

            {/* Preview link */}
            {isEditing && existingPost && (
              <a
                href={`/health-wellness-blog/${existingPost.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold w-full"
                style={{ background: "oklch(0.28 0.02 160)", color: "oklch(0.72 0.12 75)", border: "1px solid oklch(0.35 0.02 160)" }}
              >
                <Eye size={14} /> Preview Post
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Alt Text Dialog */}
      {pendingImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "oklch(0 0 0 / 0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setPendingImageUrl(null); setImageAltText(""); } }}
        >
          <div
            className="rounded-xl p-6 w-full max-w-md shadow-2xl"
            style={{ background: "oklch(0.22 0.025 160)", border: "1px solid oklch(0.30 0.02 160)" }}
          >
            <h3 className="text-base font-semibold mb-1" style={{ color: "oklch(0.92 0.01 160)" }}>Add Image Alt Text</h3>
            <p className="text-xs mb-4" style={{ color: "oklch(0.60 0.02 160)" }}>Alt text describes the image for screen readers and improves SEO. Be descriptive and concise.</p>
            <img src={pendingImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-4" />
            <label className="block text-xs font-medium mb-1" style={{ color: "oklch(0.75 0.02 160)" }}>Alt Text</label>
            <input
              type="text"
              value={imageAltText}
              onChange={(e) => setImageAltText(e.target.value)}
              placeholder="e.g. Lee Anne Chapman coaching session with a client"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") confirmImageInsert(); if (e.key === "Escape") { setPendingImageUrl(null); setImageAltText(""); } }}
              className="w-full px-3 py-2 rounded-lg text-sm mb-4"
              style={{ background: "oklch(0.18 0.025 160)", border: "1px solid oklch(0.35 0.025 160)", color: "oklch(0.92 0.01 160)", outline: "none" }}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setPendingImageUrl(null); setImageAltText(""); }}
                className="px-4 py-2 rounded-lg text-sm"
                style={{ background: "oklch(0.28 0.025 160)", color: "oklch(0.75 0.02 160)" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmImageInsert}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: "oklch(0.72 0.12 75)", color: "oklch(0.18 0.025 50)" }}
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
