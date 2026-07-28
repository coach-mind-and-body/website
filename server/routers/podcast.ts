import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { resendSubscribe } from "../resendSubscribe";
import { getDb } from "../db";
import { podcastEpisodes } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const PLAYLIST_ID = "PL7rk7dm4oyzKumv4UU53xInS8sNof9q7H";

export interface Episode {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnail: string;
  videoId: string;
  slug?: string | null;
  hasShowNotes?: boolean;
}

export function parseYouTubeRSS(xml: string): Episode[] {
  const episodes: Episode[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const videoId = videoIdMatch ? videoIdMatch[1].trim() : "";
    if (!videoId) continue;

    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : "Untitled Episode";

    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const publishedAt = publishedMatch ? publishedMatch[1].trim() : "";

    const descMatch = entry.match(/<media:description>([^<]*)<\/media:description>/);
    const description = descMatch ? descMatch[1].trim() : "";

    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    episodes.push({
      id: videoId,
      videoId,
      title,
      description,
      publishedAt,
      thumbnail,
    });
  }

  return episodes;
}

export async function fetchPlaylistEpisodes(): Promise<Episode[]> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${PLAYLIST_ID}`;
  const response = await fetch(feedUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; MindBodyReset/1.0)" },
  });
  if (!response.ok) throw new Error(`RSS fetch failed: ${response.status}`);
  const xml = await response.text();
  return parseYouTubeRSS(xml);
}

function adminOnly(role: string | undefined) {
  if (role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admins only" });
}

export const podcastRouter = router({
  subscribe: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        firstName: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { podcastSubscribers } = await import("../../drizzle/schema");
        const db = await getDb();
        if (db) {
          await db
            .insert(podcastSubscribers)
            .values({
              email: input.email,
              firstName: input.firstName,
            })
            .onDuplicateKeyUpdate({ set: { firstName: input.firstName } });
        }
      } catch (e) {
        console.error("[Podcast Subscribe] Failed to save subscriber natively:", e);
      }

      const result = await resendSubscribe({
        email: input.email,
        firstName: input.firstName,
      });

      if (!result.success) {
        console.error("[Podcast Subscribe] Resend error:", result.error);
      }

      let episodesHTML = "";
      try {
        const episodes = (await fetchPlaylistEpisodes()).slice(0, 3);
        episodesHTML = episodes
          .map(
            (ep) => `
          <div style="margin-bottom: 24px;">
            <a href="https://www.youtube.com/watch?v=${ep.videoId}">
              <img src="${ep.thumbnail}" alt="${ep.title}" style="max-width: 100%; border-radius: 8px;" />
            </a>
            <h3 style="margin-top: 12px; margin-bottom: 4px;"><a href="https://www.youtube.com/watch?v=${ep.videoId}" style="color: #2d3b2d; text-decoration: none; font-size: 18px;">${ep.title}</a></h3>
          </div>
        `
          )
          .join("");
      } catch (e) {
        console.error("[Podcast Subscribe] Failed to fetch latest YouTube videos:", e);
      }

      try {
        const { Resend } = await import("resend");
        const { ENV } = await import("../_core/env");
        if (ENV.resendApiKey) {
          const resend = new Resend(ENV.resendApiKey);
          await resend.emails.send({
            from: ENV.resendFromEmail,
            to: input.email,
            subject: "Welcome to the Reclaim Your Body Podcast! 🎧",
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #4a4a4a;">
                <h1 style="color: #2d3b2d;">Welcome to the Podcast!</h1>
                <p>Hi ${input.firstName || "there"},</p>
                <p>Thank you for subscribing to the Reclaim Your Body Podcast! I'm so excited to share these conversations with you.</p>
                <p>Here are some of my most recent episodes to get you started:</p>
                <div style="margin-top: 30px;">
                  ${episodesHTML}
                </div>
                <p>Talk soon,</p>
                <p><strong>Lee Anne Chapman</strong></p>
              </div>
            `,
          });
        }
      } catch (e) {
        console.error("[Podcast Subscribe] Welcome email failed:", e);
      }

      return { success: true };
    }),

  getEpisodes: publicProcedure.query(async () => {
    try {
      const episodes = await fetchPlaylistEpisodes();
      const db = await getDb();
      if (db && episodes.length > 0) {
        // Auto-seed default habit actions for newest episodes (does not overwrite admin edits)
        const { ensureEpisodeDefaults, defaultHabitActionsJson } = await import(
          "../podcastDefaults"
        );
        // Limit writes to the latest 12 so a cold cache doesn't hammer the DB
        for (const ep of episodes.slice(0, 12)) {
          try {
            await ensureEpisodeDefaults(db, {
              videoId: ep.videoId,
              title: ep.title,
              thumbnail: ep.thumbnail,
              publishedAt: ep.publishedAt,
              youtubeDescription: ep.description,
            });
          } catch (e) {
            console.warn("[Podcast] ensure defaults failed for", ep.videoId, e);
          }
        }

        const notes = await db
          .select({
            videoId: podcastEpisodes.videoId,
            slug: podcastEpisodes.slug,
            status: podcastEpisodes.status,
            habitActionsJson: podcastEpisodes.habitActionsJson,
            linkedBlogSlug: podcastEpisodes.linkedBlogSlug,
            linkedChallengeId: podcastEpisodes.linkedChallengeId,
          })
          .from(podcastEpisodes);

        const byVideo = new Map(notes.map((n) => [n.videoId, n]));
        const fallbackActions = defaultHabitActionsJson();
        for (const ep of episodes) {
          const n = byVideo.get(ep.videoId);
          if (n) {
            if (n.status === "published") {
              ep.slug = n.slug;
              ep.hasShowNotes = true;
            }
            // Habit actions available even for draft rows (auto-defaults)
            (ep as any).habitActionsJson =
              n.habitActionsJson && n.habitActionsJson.trim()
                ? n.habitActionsJson
                : fallbackActions;
            (ep as any).linkedBlogSlug = n.linkedBlogSlug;
            (ep as any).linkedChallengeId = n.linkedChallengeId;
          } else {
            (ep as any).habitActionsJson = fallbackActions;
          }
        }
      }
      return { episodes };
    } catch (err) {
      console.error("[Podcast RSS] Failed to fetch episodes:", err);
      return { episodes: [] as Episode[] };
    }
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [row] = await db
        .select()
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.slug, input.slug))
        .limit(1);
      if (!row || row.status !== "published") return null;
      return row;
    }),

  listPublishedNotes: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        slug: podcastEpisodes.slug,
        title: podcastEpisodes.title,
        videoId: podcastEpisodes.videoId,
        thumbnail: podcastEpisodes.thumbnail,
        publishedAt: podcastEpisodes.publishedAt,
        seoDescription: podcastEpisodes.seoDescription,
      })
      .from(podcastEpisodes)
      .where(eq(podcastEpisodes.status, "published"))
      .orderBy(desc(podcastEpisodes.publishedAt));
  }),

  adminList: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];
    return db.select().from(podcastEpisodes).orderBy(desc(podcastEpisodes.publishedAt));
  }),

  /** YouTube playlist + DB enrichment for admin editor */
  adminListFromYoutube: protectedProcedure.query(async ({ ctx }) => {
    adminOnly(ctx.user?.role);
    const db = await getDb();
    if (!db) return [];

    const { ensureEpisodeDefaults, defaultHabitActionsJson, DEFAULT_HABIT_ACTIONS } =
      await import("../podcastDefaults");

    let yt: Episode[] = [];
    try {
      yt = await fetchPlaylistEpisodes();
    } catch (e) {
      console.error("[Podcast admin] RSS failed", e);
    }

    for (const ep of yt.slice(0, 30)) {
      try {
        await ensureEpisodeDefaults(db, {
          videoId: ep.videoId,
          title: ep.title,
          thumbnail: ep.thumbnail,
          publishedAt: ep.publishedAt,
          youtubeDescription: ep.description,
        });
      } catch {
        /* continue */
      }
    }

    const rows = await db
      .select()
      .from(podcastEpisodes)
      .orderBy(desc(podcastEpisodes.publishedAt));

    const byVideo = new Map(rows.map((r) => [r.videoId, r]));
    const fallback = defaultHabitActionsJson();

    // Prefer YouTube order (newest first); append DB-only rows
    const seen = new Set<string>();
    const merged: Array<{
      videoId: string;
      title: string;
      thumbnail: string | null;
      publishedAt: Date | string | null;
      slug: string | null;
      status: string;
      habitActionsJson: string;
      linkedBlogSlug: string | null;
      linkedChallengeId: number | null;
      hasShowNotes: boolean;
      youtubeDescription: string | null;
      id: number | null;
    }> = [];

    for (const ep of yt) {
      seen.add(ep.videoId);
      const row = byVideo.get(ep.videoId);
      merged.push({
        videoId: ep.videoId,
        title: row?.title || ep.title,
        thumbnail: row?.thumbnail || ep.thumbnail,
        publishedAt: row?.publishedAt || ep.publishedAt,
        slug: row?.slug || null,
        status: row?.status || "draft",
        habitActionsJson:
          row?.habitActionsJson && row.habitActionsJson.trim()
            ? row.habitActionsJson
            : fallback,
        linkedBlogSlug: row?.linkedBlogSlug ?? null,
        linkedChallengeId: row?.linkedChallengeId ?? null,
        hasShowNotes: row?.status === "published" && !!row?.showNotesHtml,
        youtubeDescription: row?.youtubeDescription || ep.description || null,
        id: row?.id ?? null,
      });
    }

    for (const row of rows) {
      if (seen.has(row.videoId)) continue;
      merged.push({
        videoId: row.videoId,
        title: row.title,
        thumbnail: row.thumbnail,
        publishedAt: row.publishedAt,
        slug: row.slug,
        status: row.status,
        habitActionsJson:
          row.habitActionsJson && row.habitActionsJson.trim()
            ? row.habitActionsJson
            : fallback,
        linkedBlogSlug: row.linkedBlogSlug,
        linkedChallengeId: row.linkedChallengeId,
        hasShowNotes: row.status === "published" && !!row.showNotesHtml,
        youtubeDescription: row.youtubeDescription,
        id: row.id,
      });
    }

    return {
      episodes: merged,
      defaultActions: DEFAULT_HABIT_ACTIONS,
    };
  }),

  /** Patch only habit-related fields (safe for admin quick edit) */
  adminUpdateHabitMeta: protectedProcedure
    .input(
      z.object({
        videoId: z.string().min(1),
        title: z.string().optional(),
        habitActionsJson: z.string().nullable().optional(),
        linkedChallengeId: z.number().nullable().optional(),
        linkedBlogSlug: z.string().nullable().optional(),
        resetToDefaults: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { ensureEpisodeDefaults, defaultHabitActionsJson } = await import(
        "../podcastDefaults"
      );

      const [existing] = await db
        .select()
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.videoId, input.videoId))
        .limit(1);

      if (!existing) {
        await ensureEpisodeDefaults(db, {
          videoId: input.videoId,
          title: input.title || input.videoId,
        });
      }

      const habitActionsJson = input.resetToDefaults
        ? defaultHabitActionsJson()
        : input.habitActionsJson !== undefined
          ? input.habitActionsJson
          : undefined;

      const patch: Record<string, unknown> = {};
      if (input.title !== undefined) patch.title = input.title;
      if (habitActionsJson !== undefined) patch.habitActionsJson = habitActionsJson;
      if (input.linkedChallengeId !== undefined)
        patch.linkedChallengeId = input.linkedChallengeId;
      if (input.linkedBlogSlug !== undefined) patch.linkedBlogSlug = input.linkedBlogSlug;

      if (Object.keys(patch).length > 0) {
        await db
          .update(podcastEpisodes)
          .set(patch)
          .where(eq(podcastEpisodes.videoId, input.videoId));
      }

      return { success: true };
    }),

  adminUpsert: protectedProcedure
    .input(
      z.object({
        videoId: z.string().min(1),
        slug: z.string().min(1),
        title: z.string().min(1),
        thumbnail: z.string().optional(),
        publishedAt: z.string().optional(),
        youtubeDescription: z.string().optional(),
        showNotesHtml: z.string().optional(),
        seoTitle: z.string().optional(),
        seoDescription: z.string().optional(),
        transcript: z.string().optional(),
        habitActionsJson: z.string().optional().nullable(),
        linkedChallengeId: z.number().optional().nullable(),
        linkedBlogSlug: z.string().optional().nullable(),
        status: z.enum(["draft", "published"]).default("draft"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      adminOnly(ctx.user?.role);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { defaultHabitActionsJson } = await import("../podcastDefaults");

      const [existing] = await db
        .select({ id: podcastEpisodes.id })
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.videoId, input.videoId))
        .limit(1);

      const values = {
        videoId: input.videoId,
        slug: input.slug,
        title: input.title,
        thumbnail: input.thumbnail,
        publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
        youtubeDescription: input.youtubeDescription,
        showNotesHtml: input.showNotesHtml,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        transcript: input.transcript,
        habitActionsJson:
          input.habitActionsJson !== undefined
            ? input.habitActionsJson
            : existing
              ? undefined
              : defaultHabitActionsJson(),
        linkedChallengeId: input.linkedChallengeId ?? null,
        linkedBlogSlug: input.linkedBlogSlug ?? null,
        status: input.status,
      };

      // Remove undefined so we don't wipe existing actions on partial upsert
      const clean = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined)
      );

      if (existing) {
        await db.update(podcastEpisodes).set(clean).where(eq(podcastEpisodes.id, existing.id));
        return { id: existing.id, updated: true };
      }
      const result = await db.insert(podcastEpisodes).values({
        ...clean,
        habitActionsJson: clean.habitActionsJson ?? defaultHabitActionsJson(),
      } as any);
      return { id: Number(result[0].insertId), updated: false };
    }),
});
