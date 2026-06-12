import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

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
  "telephone": "",
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
      </head>
      <body className="antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

