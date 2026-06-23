import Link from "next/link";
import { BRAND } from "@shared/brand";
import { Instagram, Facebook, Youtube } from "lucide-react";

const LOGO = BRAND.logoWideUrl;

export default function SiteFooter() {
  return (
    <footer style={{ background: "#faf5f5", color: "#3e3e3e", borderTop: "1px solid #e8ddd8" }}>
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={LOGO}
                alt="Mind & Body Reset"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p
                  className="font-bold text-lg"
                  style={{ fontFamily: "'Cormorant Garamond', serif", color: "oklch(0.52 0.09 75)" }}
                >
                  Mind & Body Reset
                </p>
                <p className="text-xs" style={{ color: "#7a6e6e" }}>
                  Holistic Wellness Coaching
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "#5a5050" }}>
              Helping women 40+ reclaim their body, rewire their mind, and reset their life — with tools that actually work.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/mindandbodyresetgals/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-60"
                style={{ color: "oklch(0.38 0.10 148)" }}
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.facebook.com/MindandBodyReset"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-60"
                style={{ color: "oklch(0.38 0.10 148)" }}
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://www.youtube.com/@MindandBodyResetCoach"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-60"
                style={{ color: "oklch(0.38 0.10 148)" }}
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "oklch(0.38 0.10 148)" }}
            >
              Quick Links
            </p>
            <div className="flex flex-col gap-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Mind & Body" },
                { href: "/reclaim", label: "R.E.C.L.A.I.M. Program" },
                { href: "/health-wellness-blog", label: "Blog" },
                { href: "/habit-tracker", label: "Free Habit Tracker" },
                { href: "/book", label: "Book a Free Call" },
                { href: "/financial-peace", label: "Financial Peace University" },
                { href: "/midlife-health-podcast", label: "Podcast" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors hover:opacity-60"
                  style={{ color: "#5a5050" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "oklch(0.38 0.10 148)" }}
            >
              Legal
            </p>
            <div className="flex flex-col gap-2">
              {[
                { href: "/terms", label: "Terms and Conditions" },
                { href: "/privacy", label: "Privacy Policy" },
                { href: "/disclaimer", label: "Health Disclaimer" },
                { href: "/admin", label: "Admin Login" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-colors hover:opacity-60"
                  style={{ color: "#5a5050" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderColor: "#e0d5d0" }}
        >
          <p className="text-xs" style={{ color: "#8a7e7e" }}>
            Copyright © {new Date().getFullYear()} Mind and Body Reset — All Rights Reserved.
          </p>
          <p className="text-xs text-center" style={{ color: "#9a8e8e" }}>
            Coaching is not a substitute for professional medical or financial advice. We provide tools for mindset and wellness education.
          </p>
        </div>
      </div>
    </footer>
  );
}
