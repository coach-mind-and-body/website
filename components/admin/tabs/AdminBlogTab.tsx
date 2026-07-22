"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";

export function AdminBlogTab() {
  const [blogTab, setBlogTab] = useState<"published" | "scheduled" | "drafts">("published");
  const { data: blogPosts } = trpc.blog.adminList.useQuery();

  const publishedPosts = blogPosts?.filter((p) => p.published) ?? [];
  const scheduledPosts = blogPosts?.filter((p) => !p.published && p.scheduledAt) ?? [];
  const draftPosts = blogPosts?.filter((p) => !p.published && !p.scheduledAt) ?? [];
  const currentBlogPosts =
    blogTab === "published" ? publishedPosts : blogTab === "scheduled" ? scheduledPosts : draftPosts;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="font-bold text-2xl"
          style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.20 0.015 50)" }}
        >
          Blog Posts
        </h2>
        <a
          href="/admin/blog/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
          style={{ background: "oklch(0.72 0.12 75)", color: "oklch(1 0 0)" }}
        >
          + New Post
        </a>
      </div>

      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "oklch(0.985 0.008 80)" }}>
        {(["published", "scheduled", "drafts"] as const).map((bt) => (
          <button
            key={bt}
            onClick={() => setBlogTab(bt)}
            className={`pb-2 text-sm font-bold transition-all ${blogTab === bt ? "border-b-2" : "opacity-60"}`}
            style={{
              borderColor: blogTab === bt ? "oklch(0.72 0.12 75)" : "transparent",
              color: blogTab === bt ? "oklch(0.20 0.015 50)" : "oklch(0.42 0.015 50)",
            }}
          >
            {bt === "published" ? "Published" : bt === "scheduled" ? "Scheduled" : "Drafts"}
            <span
              className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: "oklch(1 0 0)", color: "oklch(0.52 0.015 50)" }}
            >
              {bt === "published"
                ? publishedPosts.length
                : bt === "scheduled"
                  ? scheduledPosts.length
                  : draftPosts.length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {currentBlogPosts.map((post) => (
          <div
            key={post.id}
            className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: "oklch(1 0 0)" }}
          >
            <div>
              <p className="font-semibold text-sm mb-1" style={{ color: "oklch(0.20 0.015 50)" }}>
                {post.title}
              </p>
              <div className="flex items-center gap-3">
                {post.category && (
                  <span className="text-xs" style={{ color: "oklch(0.72 0.12 75)" }}>
                    {post.category}
                  </span>
                )}
                <span className="text-xs" style={{ color: "oklch(0.52 0.015 50)" }}>
                  {post.published && post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString()
                    : post.scheduledAt
                      ? `Scheduled for ${new Date(post.scheduledAt).toLocaleDateString()}`
                      : "Draft"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-1 rounded-full font-bold"
                style={{
                  background: post.published
                    ? "oklch(0.92 0.04 148)"
                    : post.scheduledAt
                      ? "oklch(0.35 0.04 75)"
                      : "oklch(0.93 0.06 75)",
                  color: post.published
                    ? "oklch(0.38 0.10 148)"
                    : post.scheduledAt
                      ? "oklch(0.90 0.10 75)"
                      : "oklch(0.45 0.12 65)",
                }}
              >
                {post.published ? "Published" : post.scheduledAt ? "Scheduled" : "Draft"}
              </span>
              <a href={`/admin/blog/${post.id}`} className="text-xs underline" style={{ color: "oklch(0.72 0.12 75)" }}>
                Edit
              </a>
              {post.published && (
                <a
                  href={`/health-wellness-blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline"
                  style={{ color: "oklch(0.52 0.015 50)" }}
                >
                  View
                </a>
              )}
            </div>
          </div>
        ))}
        {!currentBlogPosts.length && (
          <p className="text-sm" style={{ color: "oklch(0.52 0.015 50)" }}>
            No {blogTab} posts yet.
          </p>
        )}
      </div>
    </div>
  );
}
