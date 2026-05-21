import { useEffect } from "react";

const DEFAULT_TITLE = "Health and Wellness Coach | Mind and Body Reset";
const DEFAULT_DESCRIPTION =
  "Certified life and health coach Lee Anne helps women 40+ reclaim their body, rewire their mind, and reset their life. Book a free discovery call today.";
const DEFAULT_KEYWORDS =
  "holistic wellness coaching, women over 40, perimenopause coach, food noise, mind body reset, Lee Anne coach, Wasatch Front, Utah wellness";

function setMetaTag(attr: string, attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

interface PageSEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
}

/**
 * Sets the document title, meta description, keywords, and OG tags for the current page.
 * Resets to defaults on unmount.
 *
 * @example
 * // Simple usage (title only, keeps old behavior)
 * usePageTitle("About | Mind and Body Reset");
 *
 * // Full SEO usage
 * usePageTitle({
 *   title: "About Lee Anne | Mind and Body Reset",
 *   description: "Meet Lee Anne Chapman, certified life and health coach helping women 40+ with food freedom and hormonal health.",
 *   keywords: "Lee Anne Chapman, health coach, life coach, women over 40, Utah"
 * });
 */
export function usePageTitle(options?: string | PageSEOOptions) {
  const title = typeof options === "string" ? options : options?.title;
  const description = typeof options === "object" ? options?.description : undefined;
  const keywords = typeof options === "object" ? options?.keywords : undefined;

  useEffect(() => {
    // Title
    document.title = title ?? DEFAULT_TITLE;

    // Meta description
    setMetaTag("name", "description", description ?? DEFAULT_DESCRIPTION);

    // Keywords
    setMetaTag("name", "keywords", keywords ?? DEFAULT_KEYWORDS);

    // OG tags
    setMetaTag("property", "og:title", title ?? DEFAULT_TITLE);
    setMetaTag("property", "og:description", description ?? DEFAULT_DESCRIPTION);

    // Twitter tags
    setMetaTag("name", "twitter:title", title ?? DEFAULT_TITLE);
    setMetaTag("name", "twitter:description", description ?? DEFAULT_DESCRIPTION);

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag("name", "description", DEFAULT_DESCRIPTION);
      setMetaTag("name", "keywords", DEFAULT_KEYWORDS);
      setMetaTag("property", "og:title", DEFAULT_TITLE);
      setMetaTag("property", "og:description", DEFAULT_DESCRIPTION);
      setMetaTag("name", "twitter:title", DEFAULT_TITLE);
      setMetaTag("name", "twitter:description", DEFAULT_DESCRIPTION);
    };
  }, [title, description, keywords]);
}
