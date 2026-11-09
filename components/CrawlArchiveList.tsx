import Link from "next/link";

export type CrawlArchiveItem = {
  href: string;
  title: string;
  date: string | null;
};

/**
 * Visible title list. Rendered from server props on first paint so each
 * item is an ordinary <a href> in the initial HTML.
 */
export function CrawlArchiveList({
  heading,
  label,
  items,
}: {
  heading: string;
  label: string;
  items: CrawlArchiveItem[];
}) {
  if (items.length === 0) return null;
  return (
    <nav className="mt-14" aria-label={label}>
      <h2
        className="font-bold mb-6"
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
          color: "oklch(0.22 0.02 160)",
        }}
      >
        {heading}
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
        {items.map(item => (
          <li
            key={item.href}
            className="border-b pb-3"
            style={{ borderColor: "oklch(0.90 0.01 160)" }}
          >
            <Link
              href={item.href}
              className="font-semibold leading-snug hover:underline"
              style={{ color: "oklch(0.22 0.02 160)" }}
            >
              {item.title}
            </Link>
            {item.date && (
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.55 0.02 160)" }}
              >
                {item.date}
              </p>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
