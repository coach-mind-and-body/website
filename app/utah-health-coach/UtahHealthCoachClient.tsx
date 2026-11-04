"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { BRAND } from "@shared/brand";
import { UTAH_LINKS, UTAH_PAGE, UTAH_PARAGRAPHS } from "@/lib/utahHealthCoach";

export default function UtahHealthCoachClient() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.97 0.008 10)" }}>
      <SiteNav />
      <main className="flex-1">
        <section
          className="py-16 text-center"
          style={{ background: "linear-gradient(135deg, oklch(0.93 0.06 75) 0%, oklch(0.97 0.008 10) 60%)" }}
        >
          <div className="container max-w-3xl mx-auto px-4">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "oklch(0.38 0.10 148)" }}>
              Sandy, Utah · Wasatch Front
            </p>
            <h1
              className="font-bold mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(2rem, 4vw, 3rem)",
                lineHeight: 1.15,
                color: "oklch(0.22 0.02 160)",
              }}
            >
              {UTAH_PAGE.title}
            </h1>
            <p className="text-base" style={{ color: "oklch(0.45 0.02 160)" }}>
              {BRAND.locationLine}
              {" · "}
              <a href={BRAND.phoneHref} className="font-semibold" style={{ color: "oklch(0.38 0.10 148)" }}>
                {BRAND.phoneDisplay}
              </a>
            </p>
          </div>
        </section>

        <article className="py-12">
          <div className="container max-w-3xl mx-auto px-4">
            {UTAH_PARAGRAPHS.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mb-5 text-base leading-relaxed"
                style={{ color: "oklch(0.32 0.02 160)" }}
              >
                {paragraph}
              </p>
            ))}

            <h2
              className="font-bold mt-10 mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.75rem", color: "oklch(0.22 0.02 160)" }}
            >
              Where to go next
            </h2>
            <ul className="flex flex-col gap-2 mb-10">
              {UTAH_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-semibold underline underline-offset-4"
                    style={{ color: "oklch(0.38 0.10 148)" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
