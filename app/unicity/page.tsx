import type { Metadata } from "next";
import FeelGreatClient from "../feel-great-system/FeelGreatClient";
import { absoluteUrl, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: { absolute: "Unicity Feel Great System with Coaching Support | Mind and Body Reset" },
  description:
    "Unimate + Balance (Feel Great System) paired with midlife coaching for women 40+ — support insulin response, food noise, and sustainable habits with Lee Anne Chapman.",
  keywords: [
    "Feel Great System",
    "Unicity Feel Great System",
    "Unimate",
    "Balance Unicity",
    "intermittent fasting women over 40",
    "metabolic health coaching",
  ],
  openGraph: {
    title: "Unicity Feel Great System with Coaching Support",
    description:
      "Feel Great System products plus midlife coaching — metabolic health support for women 40+.",
    url: "/unicity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unicity Feel Great System with Coaching Support",
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
      name: "What is the Unicity Feel Great System?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Feel Great System is a simple approach using Unimate (before your eating window) and Balance (before meals) to support blood sugar response, satiety, and intermittent fasting consistency.",
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
      name: "Who is this for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Women in midlife who want better energy, fewer cravings, and metabolic support alongside mindset and lifestyle coaching — not a one-size-fits-all plan.",
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
