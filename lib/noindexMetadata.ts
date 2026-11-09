import type { Metadata } from "next";

/**
 * Screens that must stay out of the index.
 *
 * The root layout sets `robots: { index: true, follow: true, googleBot: { index: true } }`
 * and `alternates.canonical` to the homepage. Next.js replaces `robots` and
 * `alternates` as whole objects, so a child has to set both or those tags
 * survive. `canonical: null` resolves to no canonical link.
 */
export function noindexWithoutInheritedCanonical(
  metadata: Metadata,
  options?: { follow?: boolean }
): Metadata {
  const follow = options?.follow ?? true;
  return {
    ...metadata,
    robots: {
      index: false,
      follow,
      googleBot: {
        index: false,
        follow,
      },
    },
    alternates: {
      canonical: null,
    },
  };
}
