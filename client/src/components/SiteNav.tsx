import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, UserCircle2, LogOut, LayoutDashboard } from "lucide-react";
import { BRAND, GOOGLE_CALENDAR } from "../../../shared/brand";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const LOGO = BRAND.logoUrl;

const NAV_LINKS = [
  { href: "/reclaim", label: "R.E.C.L.A.I.M." },
  { href: "/financial-peace", label: "FPU" },
  { href: "/unicity", label: "Unicity" },
  { href: "/midlife-health-podcast", label: "Podcast" },
  { href: "/health-wellness-blog", label: "Blog" },
  { href: "/food-quiz", label: "Free Quiz" },
  { href: "/about", label: "About Us" },
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
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const gcalDesktopRef = useRef<HTMLSpanElement>(null);
  const gcalMobileRef = useRef<HTMLSpanElement>(null);
  const loadedDesktop = useRef(false);
  const loadedMobile = useRef(false);

  // Load Google Calendar button into desktop container once
  useEffect(() => {
    if (loadedDesktop.current) return;
    const tryLoad = () => {
      if (window.calendar?.schedulingButton) {
        if (gcalDesktopRef.current && !gcalDesktopRef.current.hasChildNodes()) {
          window.calendar.schedulingButton.load({
            url: GOOGLE_CALENDAR.discoveryCall,
            color: "#f8cfc4",
            label: "Book a Call",
            target: gcalDesktopRef.current,
          });
          loadedDesktop.current = true;
        }
      } else {
        setTimeout(tryLoad, 300);
      }
    };
    tryLoad();
  }, []);

  // Load Google Calendar button into mobile container when menu opens
  useEffect(() => {
    if (!mobileOpen) return;
    if (loadedMobile.current) return;
    const tryLoad = () => {
      if (window.calendar?.schedulingButton) {
        if (gcalMobileRef.current && !gcalMobileRef.current.hasChildNodes()) {
          window.calendar.schedulingButton.load({
            url: GOOGLE_CALENDAR.discoveryCall,
            color: "#f8cfc4",
            label: "Book a Call",
            target: gcalMobileRef.current,
          });
          loadedMobile.current = true;
        }
      } else {
        setTimeout(tryLoad, 300);
      }
    };
    tryLoad();
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50" style={{ background: "oklch(0.72 0.11 78)", boxShadow: "0 2px 12px oklch(0.20 0.015 50 / 0.18)" }}>
      <div className="container">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 flex-shrink-0">
            <img
              src={LOGO}
              alt="Mind & Body Reset"
              className="w-9 h-9 rounded-full object-cover border-2 border-white/40"
            />
            <span
              className="font-bold hidden sm:block"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "1.15rem",
                color: "oklch(1 0 0)",
                letterSpacing: "0.01em",
              }}
            >
              Mind & Body Reset
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link-gold"
                style={location === link.href ? { textDecoration: "underline", textUnderlineOffset: "4px" } : {}}
              >
                {link.label}
              </Link>
            ))}
            {/* Google Calendar popup button — desktop */}
            <span ref={gcalDesktopRef} />

            {/* Account icon — desktop */}
            <div ref={accountRef} className="relative">
              <button
                onClick={() => isAuthenticated ? setAccountOpen(v => !v) : window.location.href = getLoginUrl()}
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-80"
                style={{ background: "oklch(1 0 0 / 0.18)", color: "oklch(1 0 0)" }}
                aria-label="My Account"
                title={isAuthenticated ? `Signed in as ${user?.name ?? "Client"}` : "Client Login"}
              >
                <UserCircle2 size={20} />
              </button>

              {/* Dropdown */}
              {accountOpen && isAuthenticated && (
                <div
                  className="absolute right-0 top-11 w-52 rounded-xl shadow-xl border z-50 overflow-hidden"
                  style={{ background: "oklch(0.985 0.008 80)", border: "1px solid oklch(0.88 0.04 75)" }}
                >
                  <div className="px-4 py-3 border-b" style={{ borderColor: "oklch(0.88 0.04 75)" }}>
                    <p className="text-xs font-semibold" style={{ color: "oklch(0.45 0.02 160)" }}>Signed in as</p>
                    <p className="text-sm font-bold truncate" style={{ color: "oklch(0.22 0.02 160)" }}>{user?.name ?? user?.email ?? "Client"}</p>
                  </div>
                  <Link
                    href="/portal"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "oklch(0.22 0.02 160)" }}
                  >
                    <LayoutDashboard size={15} />
                    My Portal
                  </Link>
                  <button
                    onClick={() => { setAccountOpen(false); logout(); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm transition-colors hover:bg-black/5"
                    style={{ color: "oklch(0.50 0.08 20)" }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Mobile: account icon + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => isAuthenticated ? window.location.href = '/portal' : window.location.href = getLoginUrl()}
              className="flex items-center justify-center w-9 h-9 rounded-full transition-all hover:opacity-80"
              style={{ background: "oklch(1 0 0 / 0.18)", color: "oklch(1 0 0)" }}
              aria-label="My Account"
            >
              <UserCircle2 size={20} />
            </button>
            <button
              className="p-2 rounded-lg"
              style={{ color: "oklch(1 0 0)" }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="md:hidden pb-4 pt-2 border-t"
            style={{ borderColor: "oklch(1 0 0 / 0.25)" }}
          >
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="nav-link-gold py-1"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <span ref={gcalMobileRef} className="mt-1" />
              {/* Account link in mobile menu */}
              {isAuthenticated ? (
                <div className="flex flex-col gap-1 pt-1 border-t" style={{ borderColor: "oklch(1 0 0 / 0.25)" }}>
                  <Link
                    href="/portal"
                    className="nav-link-gold py-1 flex items-center gap-2"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard size={15} /> My Portal
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="nav-link-gold py-1 text-left flex items-center gap-2"
                    style={{ color: "oklch(0.95 0.04 20)" }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              ) : (
                <a
                  href={getLoginUrl()}
                  className="nav-link-gold py-1 flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <UserCircle2 size={15} /> Client Login
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
