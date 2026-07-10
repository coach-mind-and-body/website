"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Youtube } from "lucide-react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

type Props = {
  title: string;
  videoId: string;
  thumbnail: string | null;
  publishedAt: string | null;
  showNotesHtml: string | null;
  transcript: string | null;
};

export default function EpisodeClient({
  title,
  videoId,
  publishedAt,
  showNotesHtml,
  transcript,
}: Props) {
  const dateLabel = publishedAt
    ? new Date(publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.985 0.008 75)" }}>
      <SiteNav />

      <main className="flex-1">
        <section className="py-10 md:py-14" style={{ background: "oklch(0.30 0.09 148)" }}>
          <div className="container max-w-3xl mx-auto px-4">
            <Link
              href="/midlife-health-podcast"
              className="inline-flex items-center gap-1.5 text-sm font-semibold mb-6 transition-opacity hover:opacity-80"
              style={{ color: "oklch(0.92 0.04 148)" }}
            >
              <ArrowLeft size={16} /> All episodes
            </Link>
            {dateLabel && (
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.78 0.06 78)" }}>
                {dateLabel}
              </p>
            )}
            <h1
              className="font-bold leading-tight mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                color: "oklch(0.98 0.01 80)",
              }}
            >
              {title}
            </h1>
            <p className="text-sm mb-6" style={{ color: "oklch(0.90 0.02 148)" }}>
              Mind and Body Reset Podcast · Show notes
            </p>
          </div>
        </section>

        <section className="py-10">
          <div className="container max-w-3xl mx-auto px-4">
            <div
              className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-10"
              style={{ paddingBottom: "56.25%", background: "#000" }}
            >
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-bold mb-10 transition-opacity hover:opacity-70"
              style={{ color: "oklch(0.38 0.10 148)" }}
            >
              <Youtube size={18} /> Watch on YouTube
            </a>

            <article
              className="prose prose-neutral max-w-none mb-12"
              style={{ color: "oklch(0.35 0.02 160)" }}
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(
                  showNotesHtml ||
                    "<p>Show notes for this episode are coming soon.</p>"
                ),
              }}
            />

            {transcript && (
              <details className="mb-12 rounded-xl border p-4" style={{ borderColor: "oklch(0.90 0.01 160)" }}>
                <summary className="font-bold cursor-pointer" style={{ color: "oklch(0.22 0.02 160)" }}>
                  Full transcript
                </summary>
                <div
                  className="mt-4 text-sm leading-relaxed whitespace-pre-wrap"
                  style={{ color: "oklch(0.40 0.02 160)" }}
                >
                  {transcript}
                </div>
              </details>
            )}

            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "oklch(0.96 0.02 148)", border: "1px solid oklch(0.90 0.03 148)" }}
            >
              <h2
                className="font-bold mb-3"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", color: "oklch(0.22 0.02 160)" }}
              >
                Ready for personal support?
              </h2>
              <p className="mb-6 text-sm" style={{ color: "oklch(0.45 0.02 160)" }}>
                Explore midlife coaching, or start with a free quiz or discovery call.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link
                  href="/book"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-white"
                  style={{ background: "oklch(0.38 0.10 148)" }}
                >
                  Book a free call <ArrowRight size={16} />
                </Link>
                <Link
                  href="/reclaim"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm"
                  style={{ background: "white", color: "oklch(0.38 0.10 148)", border: "1px solid oklch(0.38 0.10 148)" }}
                >
                  R.E.C.L.A.I.M. program
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
