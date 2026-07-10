import type { Metadata } from "next";
import InsulinHubClient from "./InsulinHubClient";
import { absoluteUrl, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: {
    absolute: "Insulin Resistance After 40: A Midlife Guide | Mind and Body Reset",
  },
  description:
    "Understand insulin resistance after 40 — symptoms, why diets fail, food noise, GLP-1 context, and midlife strategies that support energy and habits. Coach education, not medical advice.",
  keywords: [
    "insulin resistance women over 40",
    "insulin resistance after 40",
    "midlife insulin resistance",
    "perimenopause insulin",
    "insulin resistance food noise",
  ],
  alternates: { canonical: "/insulin-resistance-after-40" },
  openGraph: {
    title: "Insulin Resistance After 40: A Midlife Guide",
    description:
      "Why weight and energy feel stuck after 40 — and what actually helps when insulin resistance is part of the story.",
    url: "/insulin-resistance-after-40",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insulin Resistance After 40: A Midlife Guide",
    description:
      "Midlife insulin resistance explained with practical next steps — coaching education for women 40+.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What does insulin resistance feel like after 40?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many women notice energy crashes, stubborn weight around the midsection, intense cravings, brain fog, and feeling like the same diet no longer works. Only a clinician can diagnose insulin resistance.",
      },
    },
    {
      "@type": "Question",
      name: "Why do diets fail when insulin resistance is present?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Extreme restriction can increase stress hormones and food noise while under-fueling muscle. Midlife bodies often need steadier meals, protein, strength training, sleep, and mindset support — not another crash plan.",
      },
    },
    {
      "@type": "Question",
      name: "How is insulin resistance related to food noise and sugar cravings?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Blood sugar volatility and under-eating can amplify mental preoccupation with food and evening sugar urgency. Calming food noise and stabilizing meals often work together.",
      },
    },
    {
      "@type": "Question",
      name: "Is this medical advice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Mind and Body Reset provides health and life coaching education. Work with your healthcare provider for labs, diagnosis, and medical treatment decisions including GLP-1 medications.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    {
      "@type": "ListItem",
      position: 2,
      name: "Insulin Resistance After 40",
      item: absoluteUrl("/insulin-resistance-after-40"),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <InsulinHubClient />
    </>
  );
}
