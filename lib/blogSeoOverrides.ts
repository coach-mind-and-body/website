/**
 * SEO title and description for the GLP-1 food-noise post.
 * Applied at read time so the article body and visible H1 stay as written.
 * The root layout title template appends " | Mind and Body Reset", so seoTitle
 * must not include the brand.
 */
export const FOOD_NOISE_GLP1_SLUG = "food-noise-after-stopping-ozempic-or-wegovy";

export const FOOD_NOISE_GLP1_SEO = {
  seoTitle: "Does Food Noise Come Back After Stopping Wegovy or Ozempic?",
  seoDescription:
    "Food noise after stopping Ozempic or Wegovy is common and not proof you are weak. Appetite and food preoccupation can return when medication effects lessen.",
} as const;

type SeoFields = {
  slug: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
};

export function applyBlogSeoOverride<T extends SeoFields>(post: T): T {
  if (post.slug !== FOOD_NOISE_GLP1_SLUG) return post;
  return {
    ...post,
    seoTitle: FOOD_NOISE_GLP1_SEO.seoTitle,
    seoDescription: FOOD_NOISE_GLP1_SEO.seoDescription,
  };
}
