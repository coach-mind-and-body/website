import type { Metadata } from "next";
import MidlifeWeightHubClient from "./MidlifeWeightHubClient";
import { absoluteUrl, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: {
    absolute: "Midlife Weight Loss After 40: What Actually Helps | Mind and Body Reset",
  },
  description:
    "Midlife weight loss after 40 — menopause belly, food noise, night cravings, insulin resistance context, and life after GLP-1s. Practical guides for women who are done with another diet.",
  keywords: [
    "midlife weight loss after 40",
    "weight loss women over 40",
    "menopause belly",
    "food noise after 40",
    "how to lose weight after 40",
    "perimenopause weight gain",
  ],
  alternates: { canonical: "/midlife-weight-loss-after-40" },
  openGraph: {
    title: "Midlife Weight Loss After 40: What Actually Helps",
    description:
      "A coaching hub for menopause belly, food noise, night cravings, and patterns that stick — without another restrictive diet.",
    url: "/midlife-weight-loss-after-40",
    type: "website",
    images: [
      {
        url: "https://cdn.mindandbodyresetcoach.com/blog-images/patterns-not-the-belly-unlocking-weight-loss-success-after-40.jpg",
        width: 1200,
        height: 630,
        alt: "Midlife weight loss after 40 — guides for women 40+",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Midlife Weight Loss After 40: What Actually Helps",
    description:
      "Guides for women 40+ on belly fat, food noise, cravings, and lasting habits.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Why is weight loss harder after 40?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Midlife often brings hormonal shifts, muscle loss if strength work is low, sleep disruption, higher stress, and decades of diet patterns. Eating less alone often fails because food noise, evening habits, and under-fueling keep the loop going.",
      },
    },
    {
      "@type": "Question",
      name: "What is menopause belly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Many women notice more fat around the midsection during perimenopause and menopause. Biology and fat redistribution play a role — and so do stress, sleep, and autopilot eating patterns. Spot-reduction ab workouts alone rarely fix the whole picture.",
      },
    },
    {
      "@type": "Question",
      name: "What is food noise?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Food noise is persistent mental chatter about food — planning, craving, negotiating, and guilt — that takes bandwidth even when you are not clearly hungry. Restriction often makes it louder.",
      },
    },
    {
      "@type": "Question",
      name: "Is this medical advice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Mind and Body Reset provides health and life coaching education. Work with your clinician for diagnosis, labs, and medication decisions including GLP-1s.",
      },
    },
  ],
};

const collectionJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Midlife Weight Loss After 40",
  description:
    "Guides for women over 40 on weight, menopause belly, food noise, night cravings, and lasting habits.",
  url: absoluteUrl("/midlife-weight-loss-after-40"),
  isPartOf: { "@type": "WebSite", name: "Mind and Body Reset", url: SITE_URL },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <MidlifeWeightHubClient />
    </>
  );
}
