import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useRoute, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  ArrowLeft, Save, Eye, EyeOff, Loader2, Upload, X, Plus,
  ImagePlus, Clock, Calendar,
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

export default function BlogEditor() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/admin/blog/:id");
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
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishMode, setPublishMode] = useState<"now" | "schedule" | "draft">("draft");
  const [scheduledAt, setScheduledAt] = useState(""); // Mountain Time local string
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

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
      setPublished(existingPost.published);
      setSeoTitle(existingPost.seoTitle ?? "");
      setSeoDescription(existingPost.seoDescription ?? "");

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
      navigate("/admin?tab=blog");
    },
    onError: (e) => {
      toast.error(e.message);
      setSaving(false);
    },
  });

  const updatePost = trpc.blog.update.useMutation({
    onSuccess: () => {
      toast.success("Blog post updated!");
      navigate("/admin?tab=blog");
    },
    onError: (e) => {
      toast.error(e.message);
      setSaving(false);
    },
  });

  const wordCount = useMemo(() => content.split(/\s+/).filter(Boolean).length, [content]);

  const resolvedCategory = useMemo(() => {
    if (category === "__custom__") return customCategory.trim();
    return category;
  }, [category, customCategory]);

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
      toast.error("Please select a date and time for scheduling");
      return;
    }

    setSaving(true);

    const isPublishNow = publishMode === "now";
    const isSchedule = publishMode === "schedule";

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      excerpt: excerpt.trim() || undefined,
      content: content.trim(),
      category: resolvedCategory || undefined,
      coverImage: coverImage.trim() || undefined,
      published: isPublishNow,
      scheduledAt: isSchedule ? mountainToUtc(scheduledAt) : undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
    };

    if (isEditing && editId) {
      updatePost.mutate({
        id: editId,
        ...payload,
        scheduledAt: isSchedule ? mountainToUtc(scheduledAt) : null,
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
      // Insert Markdown image at cursor position
      const textarea = contentRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = content.slice(0, start);
        const after = content.slice(end);
        const imgMarkdown = `\n![${file.name}](${url})\n`;
        setContent(before + imgMarkdown + after);
        // Move cursor after the inserted text
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imgMarkdown.length;
          textarea.focus();
        });
      } else {
        setContent(content + `\n![${file.name}](${url})\n`);
      }
      toast.success("Image inserted!");
    }, setUploadingInline);
    e.target.value = "";
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

  const saveButtonLabel = publishMode === "now"
    ? "Publish Now"
    : publishMode === "schedule"
    ? "Schedule Post"
    : "Save Draft";

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
              onClick={() => navigate("/admin?tab=blog")}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: "oklch(0.72 0.12 75)" }}
            >
              <ArrowLeft size={16} /> Back to Admin
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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-widest" style={{ color: "oklch(0.55 0.02 160)" }}>
                  Content (Markdown supported)
                </label>
                <div className="flex items-center gap-3">
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
              <textarea
                ref={contentRef}
                placeholder="Write your blog post content here... You can use Markdown formatting.&#10;&#10;Tip: Click 'Insert Image' above to add photos directly into your post."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={24}
                className="w-full rounded-xl px-4 py-3 text-sm font-mono resize-y leading-relaxed"
                style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.35 0.02 160)", minHeight: "400px" }}
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
                  <Calendar size={14} /> Schedule for Later
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
                      min={nowMountain()}
                      className="w-full text-sm rounded-lg px-3 py-2"
                      style={{ background: "oklch(0.22 0.02 160)", color: "oklch(0.88 0.01 160)", border: "1px solid oklch(0.42 0.02 160)", colorScheme: "dark" }}
                    />
                    {scheduledAt && (
                      <p className="text-xs mt-2" style={{ color: "oklch(0.60 0.02 160)" }}>
                        Will publish on {new Date(mountainToUtc(scheduledAt)).toLocaleString("en-US", { timeZone: "America/Denver", weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })} MT
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
                    <img src={coverImage} alt="Cover" className="w-full h-40 object-cover" />
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
    </div>
  );
}
