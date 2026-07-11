import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import MetaParamBuilder from "@/components/MetaParamBuilder";
import { SITE_URL, absoluteUrl, BRAND } from "@shared/brand";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Health Coach for Women Over 40 | Mind & Body Reset",
    template: "%s | Mind and Body Reset",
  },
  description:
    "Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, quiet food noise, and build lasting habits — without another diet. Book a free discovery call.",
  keywords: [
    "health coach for women over 40",
    "midlife health coach",
    "insulin resistance coach",
    "perimenopause weight loss",
    "hormone balance women 40",
    "food freedom coaching",
    "life coach Utah",
    "Lee Anne Chapman",
    "Mind and Body Reset",
  ],
  authors: [{ name: "Lee Anne Chapman", url: absoluteUrl("/about") }],
  creator: "Lee Anne Chapman",
  openGraph: {
    title: "Health Coach for Women Over 40 | Mind & Body Reset",
    description:
      "Reclaim your health, balance hormones, and reverse insulin resistance with certified coach Lee Anne Chapman.",
    url: SITE_URL,
    siteName: "Mind and Body Reset",
    images: [
      {
        url: "/logo-new.jpg",
        width: 800,
        height: 800,
        alt: "Mind and Body Reset — Health coaching for women 40+",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Health Coach for Women Over 40 | Mind & Body Reset",
    description:
      "Reclaim your health, balance hormones, and reverse insulin resistance with Lee Anne Chapman.",
    images: ["/logo-new.jpg"],
  },
  alternates: {
    canonical: SITE_URL,
    types: {
      "application/rss+xml": absoluteUrl("/feed.xml"),
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MBR Habits",
    startupImage: ["/logo-circular.png"],
  },
  icons: {
    icon: [{ url: "/logo-circular.png", type: "image/png" }],
    apple: [{ url: "/logo-circular.png", sizes: "180x180", type: "image/png" }],
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3a5a3a" },
    { media: "(prefers-color-scheme: dark)", color: "#3a5a3a" },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3a5a3a",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "HealthAndBeautyBusiness",
      "@id": `${SITE_URL}/#business`,
      name: "Mind and Body Reset",
      image: absoluteUrl("/logo-new.jpg"),
      url: SITE_URL,
      priceRange: "$$",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Wasatch Front",
        addressRegion: "UT",
        addressCountry: "US",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: 40.7608,
        longitude: -111.891,
      },
      sameAs: ["https://www.instagram.com/mindandbodyresetcoach/"],
      description:
        "Mind and Body Reset helps women over 40 reclaim their health, balance hormones, and reverse insulin resistance through coaching with Lee Anne Chapman.",
      founder: { "@id": `${SITE_URL}/#person` },
      areaServed: {
        "@type": "Country",
        name: "United States",
      },
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Lee Anne Chapman",
      jobTitle: "Certified Life Coach and Certified Health Coach",
      description:
        "Certified life and health coach helping women 40+ with midlife health, hormonal changes, food freedom, and sustainable habits.",
      url: absoluteUrl("/about"),
      image: absoluteUrl("/logo-new.jpg"),
      worksFor: { "@id": `${SITE_URL}/#business` },
      knowsAbout: [
        "midlife health",
        "insulin resistance",
        "hormone balance",
        "perimenopause",
        "food freedom",
        "habit coaching",
      ],
      address: {
        "@type": "PostalAddress",
        addressLocality: "Wasatch Front",
        addressRegion: "UT",
        addressCountry: "US",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BRAND.name,
      description: BRAND.tagline,
      publisher: { "@id": `${SITE_URL}/#business` },
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-09SQ5LHEEJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-09SQ5LHEEJ', { 'send_page_view': false });
            window.addEventListener('load', function() { gtag('event', 'page_view'); });
          `}
        </Script>
        {/* Meta Pixel */}
        <Script id="meta-pixel" strategy="afterInteractive">
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
      </head>
      <body className="antialiased font-sans">
        <MetaParamBuilder />
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                      window.addEventListener('focus', function() {
                        registration.update();
                      });
                      document.addEventListener('visibilitychange', function() {
                        if (!document.hidden) registration.update();
                      });
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
