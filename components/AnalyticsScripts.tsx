"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  isAnalyticsExcludedPath,
  setClientAnalyticsDisabled,
} from "@/lib/analyticsExclude";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Loads GA4 + Meta Pixel only on public marketing pages.
 * Skips /admin, /login, and /reset-password so staff traffic does not count as visitors.
 */
export default function AnalyticsScripts() {
  const pathname = usePathname();
  const excluded = isAnalyticsExcludedPath(pathname);
  /** Last path we sent a GA page_view for (null until first public hit). */
  const lastGaPath = useRef<string | null>(null);
  /** True after Meta's first PageView from script init (avoid double-fire on first load). */
  const metaInitialSent = useRef(false);

  useEffect(() => {
    setClientAnalyticsDisabled(excluded);
    if (excluded) {
      lastGaPath.current = null;
    }
  }, [excluded]);

  useEffect(() => {
    if (excluded) return;

    const trackGa = () => {
      if (typeof window.gtag !== "function") return false;
      if (lastGaPath.current === pathname) return true;
      lastGaPath.current = pathname;
      window.gtag("event", "page_view", {
        page_path: pathname,
        page_location: window.location.href,
        page_title: document.title,
      });
      return true;
    };

    if (!trackGa()) {
      const id = window.setInterval(() => {
        if (trackGa()) window.clearInterval(id);
      }, 200);
      const stop = window.setTimeout(() => window.clearInterval(id), 5000);
      return () => {
        window.clearInterval(id);
        window.clearTimeout(stop);
      };
    }

    // SPA navigations only for Meta (init already fired PageView once)
    if (metaInitialSent.current && typeof window.fbq === "function") {
      window.fbq("track", "PageView");
    }
  }, [pathname, excluded]);

  if (excluded) {
    return null;
  }

  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-09SQ5LHEEJ"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', 'G-09SQ5LHEEJ', {
            send_page_view: false,
            page_path: window.location.pathname
          });
        `}
      </Script>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onReady={() => {
          metaInitialSent.current = true;
        }}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '1256633739205867');
          fbq('track', 'PageView');
        `}
      </Script>
    </>
  );
}
