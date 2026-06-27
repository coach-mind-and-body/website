import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Script from "next/script";
import MetaParamBuilder from "@/components/MetaParamBuilder";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mindandbodyresetcoach.com"),
  title: {
    default: "Mind & Body Reset | Health & Life Coaching for Women 40+",
    template: "%s | Mind and Body Reset",
  },
  description: "Stop 'starting over' and reclaim your health. Lee Anne Chapman helps women 40+ balance hormones, fix insulin resistance, and build lasting habits.",
  keywords: ["health coach", "life coach", "women over 40", "hormone balance", "insulin resistance", "weight loss", "midlife health", "Utah health coach"],
  openGraph: {
    title: "Mind & Body Reset",
    description: "Reclaim your health, balance hormones, and reverse insulin resistance with Lee Anne Chapman.",
    url: "https://www.mindandbodyresetcoach.com",
    siteName: "Mind and Body Reset",
    images: [
      {
        url: "/logo-new.jpg",
        width: 800,
        height: 800,
        alt: "Mind and Body Reset Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mind & Body Reset",
    description: "Reclaim your health, balance hormones, and reverse insulin resistance.",
    images: ["/logo-new.jpg"],
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
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "name": "Mind and Body Reset",
  "image": "https://www.mindandbodyresetcoach.com/logo-new.jpg",
  "@id": "https://www.mindandbodyresetcoach.com/",
  "url": "https://www.mindandbodyresetcoach.com/",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Wasatch Front",
    "addressRegion": "UT",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.7608,
    "longitude": -111.8910
  },
  "sameAs": [
    "https://www.instagram.com/mindandbodyresetcoach/"
  ],
  "description": "Mind and Body Reset helps women over 40 reclaim their health, balance hormones, and reverse insulin resistance.",
  "founder": {
    "@type": "Person",
    "name": "Lee Anne Chapman"
  }
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
      </body>
    </html>
  );
}



