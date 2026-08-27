import type { Metadata } from "next";
import FeelGreatClient from "../feel-great-system/FeelGreatClient";
import { absoluteUrl, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  // Primary GSC query: "feel great system" (impressions exist; avg position ~33)
  title: {
    absolute: "Feel Great System (Unicity Unimate + Balance) | Mind and Body Reset",
  },
  description:
    "What is the Feel Great System? Unimate + Balance (Unicity) to support intermittent fasting, satiety, and metabolic health — plus midlife coaching for women over 40 with Lee Anne Chapman.",
  keywords: [
    "feel great system",
    "the feel great system",
    "Unicity Feel Great System",
    "Unimate",
    "Balance Unicity",
    "feel great protocol",
    "intermittent fasting women over 40",
    "metabolic health coaching",
  ],
  openGraph: {
    title: "Feel Great System by Unicity | Unimate + Balance",
    description:
      "Learn how the Feel Great System (Unimate + Balance) supports fasting and metabolic health — with coaching for women 40+.",
    url: "/unicity",
    type: "website",
    images: [
      {
        url: "https://cdn.mindandbodyresetcoach.com/blog-images/fuel-system-reset-switching-from-sugar-to-fat-burning_1780341579953.jpg",
        width: 1200,
        height: 630,
        alt: "Feel Great System — Unimate + Balance for midlife metabolic health",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feel Great System by Unicity | Unimate + Balance",
    description:
      "Unimate, Balance, and coaching support for midlife metabolic health — Mind and Body Reset.",
  },
  alternates: { canonical: "/unicity" },
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Unicity Feel Great System",
  description:
    "The Feel Great System combines Unimate and Balance to support intermittent fasting and metabolic health, paired with coaching guidance for women in midlife.",
  brand: {
    "@type": "Brand",
    name: "Unicity",
  },
  url: absoluteUrl("/unicity"),
  image: absoluteUrl("/logo-new.jpg"),
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/unicity"),
    seller: {
      "@type": "Organization",
      name: "Mind and Body Reset",
      url: SITE_URL,
    },
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is the Feel Great System?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Feel Great System is Unicity’s two-product approach: Unimate (often used in the morning / before your eating window) and Balance (before meals). Together they are designed to support satiety, blood sugar response, and consistency with intermittent fasting — not a meal plan or calorie-counting diet.",
      },
    },
    {
      "@type": "Question",
      name: "What is the difference between Unimate and Balance?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unimate is a yerba mate drink commonly used for morning focus and to support the fasting window. Balance is a fiber blend typically taken before meals to support fullness and a steadier post-meal response. The Feel Great System uses both as a simple daily practice.",
      },
    },
    {
      "@type": "Question",
      name: "Is the Feel Great System a diet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. It is a product system that supports metabolic health and fasting habits. At Mind and Body Reset, it is paired with coaching so women 40+ build sustainable habits — not another restrictive diet.",
      },
    },
    {
      "@type": "Question",
      name: "Who is the Feel Great System for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Women in midlife who want better energy, fewer cravings, and metabolic support alongside mindset and lifestyle coaching — not a one-size-fits-all plan. Always check with your clinician if you have medical conditions or take medications.",
      },
    },
    {
      "@type": "Question",
      name: "Can coaching help with the Feel Great System after 40?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Products alone rarely fix food noise, stress eating, or identity patterns. Lee Anne pairs Feel Great System education with midlife coaching so habits stick beyond the first week of motivation.",
      },
    },
    {
      "@type": "Question",
      name: "Is the Feel Great protocol the same as the Feel Great System?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "People search both. Here, Feel Great System means Unicity Unimate + Balance as a daily practice, not a calorie-counting diet.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a Unicity fasting app?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unicity has its own tools. This page is coaching education for women 40+ using Feel Great with habits and food-noise skills — not a replacement for Unicity’s app.",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <FeelGreatClient />
    </>
  );
}
