import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { BRAND, GOOGLE_CALENDAR } from "../../../shared/brand";

const LOGO = BRAND.logoUrl;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/reclaim", label: "R.E.C.L.A.I.M." },
  { href: "/health-wellness-blog", label: "Blog" },
  { href: "/food-quiz", label: "Free Quiz" },
  { href: "/feel-great-system", label: "Unicity" },
  { href: "/about", label: "About" },
  { href: "/book", label: "Book a Call" },
];

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    calendar?: { schedulingButton: { load: (opts: any) => void } };
  }
}

export default function SiteNav() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const gcalBtnRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Load Google Calendar popup button into the nav
  useEffect(() => {
    const tryLoad = () => {
      if (window.calendar?.schedulingButton && gcalBtnRef.current) {
        window.calendar.schedulingButton.load({
          url: GOOGLE_CALENDAR.discoveryCall,
          color: "#5C7A5C",
          label: "Book Free Call",
          target: gcalBtnRef.current,
        });
      } else {
        setTimeout(tryLoad, 500);
      }
    };
    tryLoad();
  }, []);

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled
          ? "oklch(0.97 0.008 10 / 0.97)"
          : "oklch(0.97 0.008 10 / 0.98)",
        backdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid oklch(0.90 0.01 160)" : "1px solid transparent",
        boxShadow: scrolled ? "0 2px 20px oklch(0.22 0.02 160 / 0.08)" : "none",
      }}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src={LOGO}
              alt="Mind & Body Reset"
              className="w-10 h-10 rounded-full object-cover"
            />
            <span
              className="font-bold hidden sm:block"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.1rem",
                color: "oklch(0.22 0.02 160)",
              }}
            >
              Mind & Body Reset
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.filter((l) => l.href !== "/book").map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${location === link.href ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            {/* Google Calendar popup button */}
            <span ref={gcalBtnRef} />
          </nav>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: "oklch(0.55 0.02 160)" }}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden pb-4 pt-2 border-t"
            style={{ borderColor: "oklch(0.90 0.01 160)" }}
          >
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link py-1 ${location === link.href ? "active" : ""}`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
