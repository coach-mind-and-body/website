import type { Metadata } from "next";
import Glp1RecoveryClient from "./Glp1RecoveryClient";
import { absoluteUrl, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: {
    absolute: "Life After GLP-1: Maintain Weight Loss Naturally | Mind and Body Reset",
  },
  description:
    "Life after Ozempic, Wegovy, or other GLP-1s — prevent rebound weight gain, quiet returning food noise, protect muscle, and build midlife habits that last. Coaching education, not medical advice.",
  keywords: [
    "life after GLP-1",
    "life after Ozempic",
    "GLP-1 weight regain",
    "semaglutide maintenance",
    "coming off Wegovy",
    "metabolic health after GLP-1",
  ],
  alternates: { canonical: "/life-after-glp-1" },
  openGraph: {
    title: "Life After GLP-1: Maintain Weight Loss Naturally",
    description:
      "Prevent rebound weight gain and rebuild habits after GLP-1 medications — midlife coaching perspective.",
    url: "/life-after-glp-1",
    type: "website",
    images: [
      {
        url: "/healing_balance_hormones_1780339100250.png",
        width: 1200,
        height: 630,
        alt: "Life after GLP-1 — midlife health coaching",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Life After GLP-1: Maintain Weight Loss Naturally",
    description:
      "Metabolism, food noise, and lasting habits after Ozempic, Wegovy, and other GLP-1s.",
    images: ["/healing_balance_hormones_1780339100250.png"],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What happens when you stop a GLP-1 medication?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many people experience increased appetite, return of food noise, and potential weight regain if lifestyle foundations (protein, strength, sleep, stress, and habits) are not in place. Planning with your prescribing clinician is essential.",
      },
    },
    {
      "@type": "Question",
      name: "How can I maintain weight loss after Ozempic or Wegovy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Focus on protein-forward meals, resistance training, sleep, stress regulation, and mindset work around food — not another crash diet. Coaching can help rebuild habits while medication support changes.",
      },
    },
    {
      "@type": "Question",
      name: "Is coaching a replacement for medical care on GLP-1s?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Lee Anne is a certified health and life coach, not a medical provider. Always work with your prescribing clinician for medication decisions; coaching supports habits, mindset, and lifestyle.",
      },
    },
    {
      "@type": "Question",
      name: "Why does food noise come back after GLP-1s?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "GLP-1 medications often quiet appetite and food preoccupation. When the medication effect lessens, old mental patterns and biology can return. Skills for calming food noise become critical.",
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
      name: "Life After GLP-1",
      item: absoluteUrl("/life-after-glp-1"),
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
      <Glp1RecoveryClient />
    </>
  );
}
