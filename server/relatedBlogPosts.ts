import { and, desc, eq, inArray, notInArray } from "drizzle-orm";
import { blogPosts } from "../drizzle/schema";
import {
  curatedTargets,
  mergeRelated,
  type RelatedCard,
  type RelatedSourceKind,
} from "../lib/relatedReading";
import { getDb } from "./db";

const cardColumns = {
  slug: blogPosts.slug,
  title: blogPosts.title,
  excerpt: blogPosts.excerpt,
  category: blogPosts.category,
  coverImage: blogPosts.coverImage,
  publishedAt: blogPosts.publishedAt,
};

function toCard(row: {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  coverImage: string | null;
  publishedAt: Date | string | null;
}): RelatedCard {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    coverImage: row.coverImage,
    publishedAt: row.publishedAt
      ? new Date(row.publishedAt).toISOString()
      : null,
  };
}

async function publishedBySlugs(slugs: string[]): Promise<RelatedCard[]> {
  if (slugs.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select(cardColumns)
    .from(blogPosts)
    .where(and(eq(blogPosts.published, true), inArray(blogPosts.slug, slugs)));
  const bySlug = new Map(rows.map(row => [row.slug, toCard(row)]));
  return slugs.flatMap(slug => {
    const card = bySlug.get(slug);
    return card ? [card] : [];
  });
}

/**
 * Same-category posts, then recent posts, with curated orphan links pinned
 * so they are present in the server HTML.
 */
export async function relatedCardsForBlogPost(
  slug: string,
  category: string | null
): Promise<RelatedCard[]> {
  try {
    const db = await getDb();
    if (!db) return [];

    const curated = await publishedBySlugs(curatedTargets("blog", slug));
    const exclude = [slug, ...curated.map(card => card.slug)];

    const categoryRows = category
      ? await db
          .select(cardColumns)
          .from(blogPosts)
          .where(
            and(
              eq(blogPosts.published, true),
              eq(blogPosts.category, category),
              notInArray(blogPosts.slug, exclude)
            )
          )
          .orderBy(desc(blogPosts.publishedAt))
          .limit(6)
      : [];

    const picked = [...exclude, ...categoryRows.map(row => row.slug)];
    const recent =
      curated.length + categoryRows.length >= 3
        ? []
        : await db
            .select(cardColumns)
            .from(blogPosts)
            .where(
              and(
                eq(blogPosts.published, true),
                notInArray(blogPosts.slug, picked)
              )
            )
            .orderBy(desc(blogPosts.publishedAt))
            .limit(6);

    return mergeRelated(
      curated,
      [...categoryRows.map(toCard), ...recent.map(toCard)],
      3
    );
  } catch (err) {
    console.error("[related] failed to load related posts:", err);
    return [];
  }
}

export async function relatedCardsForSource(
  fromKind: RelatedSourceKind,
  fromSlug: string
): Promise<RelatedCard[]> {
  try {
    return await publishedBySlugs(curatedTargets(fromKind, fromSlug));
  } catch (err) {
    console.error("[related] failed to load curated posts:", err);
    return [];
  }
}
