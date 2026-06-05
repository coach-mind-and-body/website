import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { Youtube, Play, Mail, ArrowRight, Headphones } from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

const PODCAST_THUMBNAIL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663371864914/AofowMqj2LY3ZXRJFmskfG/podcast-thumbnail_d50f52f9.png";

const YOUTUBE_CHANNEL = "https://www.youtube.com/@MindandBodyResetCoach";
const YOUTUBE_PLAYLIST = `https://www.youtube.com/playlist?list=PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H`;

interface Episode {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  videoId: string;
}

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Podcast() {
  usePageTitle({
    title: "Better Than Perfect Podcast | Mind and Body Reset",
    description: "Listen to Better Than Perfect — Lee Anne's podcast on midlife health, body image, food freedom, hormones, and real stories from women reclaiming their lives.",
    keywords: "Better Than Perfect podcast, midlife health podcast, women over 40 podcast, food freedom, body image, hormones, perimenopause, Lee Anne Chapman"
  });
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 8;

  // Fetch episodes server-side to avoid CORS issues with YouTube RSS
  const { data: podcastData, isLoading: loading } = trpc.podcast.getEpisodes.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
  const episodes: Episode[] = (podcastData?.episodes ?? []) as Episode[];

  // Set first episode as active once loaded
  useEffect(() => {
    if (episodes.length > 0 && !activeVideo) {
      setActiveVideo(episodes[0].id);
    }
  }, [episodes, activeVideo]);

  const totalPages = Math.max(1, Math.ceil(episodes.length / limit));
  const paginatedEpisodes = episodes.slice((page - 1) * limit, page * limit);

  const subscribeMutation = trpc.podcast.subscribe.useMutation({
    onSuccess: () => {
      setSubscribed(true);
      setEmail("");
      setFirstName("");
      toast.success("You're in! Check your inbox for a confirmation.");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? "Something went wrong. Please try again.");
    },
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    subscribeMutation.mutate(
      { email, firstName: firstName || undefined },
      { onSettled: () => setSubmitting(false) }
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.985 0.008 75)" }}>
      {/* SEO meta — injected via Helmet if available, otherwise inline */}
      <SiteNav />

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.09 148) 0%, oklch(0.38 0.10 148) 100%)",
          minHeight: "420px",
        }}
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, oklch(0.72 0.11 78) 0%, transparent 60%), radial-gradient(circle at 80% 20%, oklch(0.65 0.08 148) 0%, transparent 50%)",
          }}
        />
        <div className="container relative z-10 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
                style={{ background: "oklch(1 0 0 / 0.18)", color: "oklch(0.95 0.04 148)" }}
              >
                <Headphones size={13} />
                New Episodes Every Other Week
              </div>
              <h1
                className="font-bold leading-tight mb-4"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                  color: "oklch(0.97 0.005 75)",
                }}
              >
                Mind and Body Reset Podcast
              </h1>
              <p
                className="text-base leading-relaxed mb-3"
                style={{ color: "oklch(0.80 0.015 75)", fontStyle: "italic", fontSize: "1.05rem" }}
              >
                Real Talk About Health, Weight, and Midlife
              </p>
              <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.72 0.015 75)", maxWidth: "460px" }}>
                If you're a woman over 40 doing "all the right things" and still gaining weight, exhausted, or frustrated
                with your body — this podcast is for you. No extremes. No shame. No pretending willpower is the problem.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={YOUTUBE_PLAYLIST}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-90"
                  style={{ background: "oklch(0.92 0.04 78)", color: "oklch(0.22 0.03 50)" }}
                >
                  <Youtube size={16} />
                  Subscribe on YouTube
                </a>
                <a
                  href="#subscribe"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all hover:bg-white/10"
                  style={{ borderColor: "oklch(1 0 0 / 0.5)", color: "oklch(0.97 0.005 75)" }}
                >
                  <Mail size={15} />
                  Get Episodes by Email
                </a>
              </div>
            </div>

            {/* Right: podcast cover art */}
            <div className="flex justify-center md:justify-end">
              <div
                className="rounded-3xl overflow-hidden"
                style={{
                  width: "260px",
                  height: "260px",
                  boxShadow: "0 20px 60px oklch(0.10 0.02 50 / 0.6)",
                  border: "4px solid oklch(1 0 0 / 0.12)",
                }}
              >
                <img
                  src={PODCAST_THUMBNAIL}
                  alt="Mind and Body Reset Podcast — It's Not Willpower"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT WE TALK ABOUT ── */}
      <section className="py-14" style={{ background: "oklch(0.975 0.010 78)" }}>
        <div className="container max-w-4xl mx-auto text-center">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}
          >
            What We Cover
          </span>
          <h2
            className="font-bold mb-8"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              color: "oklch(0.18 0.025 50)",
            }}
          >
            Honest conversations about what actually works in midlife
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-left">
            {[
              { emoji: "🔬", topic: "Insulin resistance & why weight feels stuck" },
              { emoji: "💊", topic: "Life after GLP-1s — maintaining results without white-knuckling" },
              { emoji: "⚡", topic: "Hormones, fasting & stress sabotaging your progress" },
              { emoji: "🧠", topic: "Mindset, thought patterns & emotional eating" },
              { emoji: "💪", topic: "Strength training & metabolic health for women 40+" },
              { emoji: "🔄", topic: "How to stop starting over and build real consistency" },
            ].map((item) => (
              <div
                key={item.topic}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.90 0.02 75)" }}
              >
                <span className="text-xl flex-shrink-0">{item.emoji}</span>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.30 0.025 55)" }}>
                  {item.topic}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EPISODES ── */}
      <section className="py-16" style={{ background: "oklch(0.985 0.008 75)" }}>
        <div className="container max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span
                className="inline-block text-xs font-bold uppercase tracking-widest mb-2 px-3 py-1 rounded-full"
                style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}
              >
                Latest Episodes
              </span>
              <h2
                className="font-bold"
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                  color: "oklch(0.18 0.025 50)",
                }}
              >
                Listen &amp; Watch
              </h2>
            </div>
            <a
              href={YOUTUBE_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: "oklch(0.38 0.10 148)" }}
            >
              View all on YouTube <ArrowRight size={14} />
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden animate-pulse"
                  style={{ background: "oklch(0.93 0.01 75)", height: "280px" }}
                />
              ))}
            </div>
          ) : episodes.length === 0 ? (
            <div className="text-center py-16">
              <Youtube size={40} className="mx-auto mb-4 opacity-30" style={{ color: "oklch(0.45 0.09 10)" }} />
              <p className="text-sm" style={{ color: "oklch(0.52 0.035 55)" }}>
                Episodes are loading. Check back shortly or{" "}
                <a href={YOUTUBE_CHANNEL} target="_blank" rel="noopener noreferrer" className="underline">
                  watch on YouTube
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured / active episode */}
              {activeVideo && (
                <div
                  ref={playerRef}
                  className="rounded-2xl overflow-hidden"
                  style={{ boxShadow: "0 4px 30px oklch(0.20 0.015 50 / 0.10)", border: "1px solid oklch(0.90 0.02 75)" }}
                >
                  <div className="aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${activeVideo}?rel=0&modestbranding=1`}
                      title="Podcast episode"
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Episode grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {paginatedEpisodes.map((ep) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setActiveVideo(ep.id);
                      // Scroll to the featured player, not the top of the page
                      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="text-left rounded-2xl overflow-hidden transition-all hover:shadow-lg group"
                    style={{
                      background: "oklch(1 0 0)",
                      border: `2px solid ${activeVideo === ep.id ? "oklch(0.38 0.10 148)" : "oklch(0.90 0.02 75)"}`,
                      boxShadow: activeVideo === ep.id ? "0 4px 20px oklch(0.38 0.10 148 / 0.20)" : "none",
                    }}
                  >
                    <div className="relative">
                      <img
                        src={ep.thumbnail}
                        alt={ep.title}
                        className="w-full object-cover"
                        style={{ height: "180px" }}
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "oklch(0.10 0.02 50 / 0.45)" }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: "oklch(0.72 0.11 78)" }}
                        >
                          <Play size={20} fill="white" style={{ color: "white" }} />
                        </div>
                      </div>
                      {activeVideo === ep.id && (
                        <div
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: "oklch(0.92 0.04 78)", color: "oklch(0.22 0.03 50)" }}
                        >
                          Now Playing
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs mb-1.5" style={{ color: "oklch(0.60 0.03 55)" }}>
                        {formatDate(ep.publishedAt)}
                      </p>
                      <h3
                        className="font-bold text-sm leading-snug mb-2 line-clamp-2"
                        style={{ color: "oklch(0.18 0.025 50)" }}
                      >
                        {ep.title}
                      </h3>
                      <p className="text-xs leading-relaxed line-clamp-3" style={{ color: "oklch(0.45 0.025 55)" }}>
                        {ep.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 transition-all"
                    style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}
                  >
                    Previous
                  </button>
                  <span className="text-sm font-bold mx-2" style={{ color: "oklch(0.18 0.025 50)" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-full text-sm font-bold disabled:opacity-50 transition-all"
                    style={{ background: "oklch(0.92 0.04 148)", color: "oklch(0.38 0.10 148)" }}
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="text-center pt-2 mt-8">
                <a
                  href={YOUTUBE_CHANNEL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                  style={{ color: "oklch(0.45 0.09 10)" }}
                >
                  <Youtube size={16} />
                  See all episodes on YouTube
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── EMAIL SUBSCRIBE ── */}
      <section
        id="subscribe"
        className="py-20"
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.09 148) 0%, oklch(0.38 0.10 148) 100%)",
        }}
      >
        <div className="container max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: "oklch(1 0 0 / 0.18)", color: "oklch(0.95 0.04 148)" }}
          >
            <Mail size={13} />
            Never Miss an Episode
          </div>
          <h2
            className="font-bold mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)",
              color: "oklch(0.97 0.005 75)",
            }}
          >
            Get new episodes delivered to your inbox
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.72 0.015 75)", maxWidth: "420px", margin: "0 auto 2rem" }}>
            Every time a new episode drops, you'll get it straight to your email — plus occasional tips and resources
            from Lee Anne on health, mindset, and midlife.
          </p>

          {subscribed ? (
            <div
              className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl"
              style={{ background: "oklch(1 0 0 / 0.15)", border: "1px solid oklch(1 0 0 / 0.3)" }}
            >
              <span className="text-2xl">🎉</span>
              <div className="text-left">
                <p className="font-bold text-sm" style={{ color: "oklch(0.97 0.005 75)" }}>
                  You're subscribed!
                </p>
                <p className="text-xs" style={{ color: "oklch(0.85 0.01 75)" }}>
                  Check your inbox — new episodes will land there automatically.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input
                type="text"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex-1 rounded-xl border-0 text-sm"
                style={{
                  background: "oklch(1 0 0 / 0.12)",
                  color: "oklch(0.97 0.005 75)",
                  caretColor: "oklch(0.97 0.005 75)",
                }}
              />
              <Input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 rounded-xl border-0 text-sm"
                style={{
                  background: "oklch(1 0 0 / 0.12)",
                  color: "oklch(0.97 0.005 75)",
                  caretColor: "oklch(0.97 0.005 75)",
                }}
              />
              <Button
                type="submit"
                disabled={submitting || !email}
                className="rounded-xl px-6 font-bold text-sm flex-shrink-0"
                style={{ background: "oklch(0.92 0.04 78)", color: "oklch(0.22 0.03 50)" }}
              >
                {submitting ? "Subscribing…" : "Subscribe"}
              </Button>
            </form>
          )}
          <p className="text-xs mt-4" style={{ color: "oklch(0.55 0.01 75)" }}>
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>

      {/* ── ABOUT THE HOST ── */}
      <section className="py-16" style={{ background: "oklch(0.975 0.010 78)" }}>
        <div className="container max-w-3xl mx-auto text-center">
          <img
            src={PODCAST_THUMBNAIL}
            alt="Lee Anne Chapman — Host of Mind and Body Reset Podcast"
            className="w-24 h-24 rounded-full object-cover mx-auto mb-5"
            style={{ border: "3px solid oklch(0.65 0.08 148)" }}
          />
          <h3
            className="font-bold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.6rem", color: "oklch(0.18 0.025 50)" }}
          >
            Hosted by Lee Anne Chapman
          </h3>
          <p className="text-sm mb-1" style={{ color: "oklch(0.52 0.035 55)" }}>
            Life, Health &amp; Financial Coach · Women 40+
          </p>
          <p className="text-sm leading-relaxed mt-4 max-w-xl mx-auto" style={{ color: "oklch(0.35 0.03 55)" }}>
            Lee Anne knows this journey firsthand — she's been through the hormone chaos, the insulin resistance
            diagnosis, and the frustration of doing everything "right" and still feeling stuck. This podcast is the
            conversation she wishes she'd had years ago.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <a
              href="/about"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all hover:opacity-80"
              style={{ background: "oklch(0.38 0.10 148)", color: "oklch(0.97 0.005 75)" }}
            >
              Meet Lee Anne <ArrowRight size={14} />
            </a>
            <a
              href="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border transition-all hover:opacity-80"
              style={{ borderColor: "oklch(0.38 0.10 148)", color: "oklch(0.38 0.10 148)" }}
            >
              Book a Free Call
            </a>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
