import type { Metadata } from "next";
import ReclaimClient from "./ReclaimClient";
import { absoluteUrl, PROGRAM, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: { absolute: "R.E.C.L.A.I.M. Coaching for Women Over 40 | Mind and Body Reset" },
  description:
    "6-session 1:1 coaching for women 40+ ready to break free from diet culture, balance hormones, and build lasting habits. Enroll in R.E.C.L.A.I.M. or book a free discovery call.",
  keywords: [
    "health coaching for women over 40",
    "midlife health coach",
    "RECLAIM coaching program",
    "insulin resistance coaching",
    "food freedom coaching",
  ],
  openGraph: {
    title: "R.E.C.L.A.I.M. Coaching for Women Over 40",
    description:
      "6 private sessions to reclaim your body, rewire your mind, and reset your life — without another diet plan.",
    url: "/reclaim",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "R.E.C.L.A.I.M. Coaching for Women Over 40",
    description:
      "6-session 1:1 coaching for midlife health, hormones, and food freedom with Lee Anne Chapman.",
  },
  alternates: { canonical: "/reclaim" },
};

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: PROGRAM.fullName,
  serviceType: "Health and life coaching",
  description:
    "A 6-session 1:1 coaching program for women 40+ focused on mindset, hormones, food relationship, and sustainable habits — not meal plans or calorie counting.",
  provider: {
    "@type": "Person",
    name: "Lee Anne Chapman",
    url: absoluteUrl("/about"),
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  url: absoluteUrl("/reclaim"),
  offers: {
    "@type": "Offer",
    price: String(PROGRAM.fullPrice),
    priceCurrency: PROGRAM.currency,
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/enroll"),
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is R.E.C.L.A.I.M. a diet program?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. R.E.C.L.A.I.M. is a coaching program focused on the mind-body connection. There are no meal plans or calorie counting — the work targets thoughts, beliefs, and patterns that keep women stuck.",
      },
    },
    {
      "@type": "Question",
      name: "Who is R.E.C.L.A.I.M. coaching for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Women 40+ who are tired of starting over with diets, navigating hormonal shifts like perimenopause, and ready for sustainable change with a certified health and life coach.",
      },
    },
    {
      "@type": "Question",
      name: "How many sessions are included?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `The program includes ${PROGRAM.sessionCount} private ${PROGRAM.sessionDurationMins}-minute coaching sessions via Google Meet, plus email support and a personalized action plan after each session.`,
      },
    },
    {
      "@type": "Question",
      name: "How much does R.E.C.L.A.I.M. cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: `Full pay is $${PROGRAM.fullPrice}, or a $${PROGRAM.depositPrice} deposit plus $${PROGRAM.balancePrice} balance before the first session.`,
      },
    },
    {
      "@type": "Question",
      name: "Is this right for perimenopause or menopause?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Lee Anne specializes in women 40+ navigating hormonal shifts, including how hormones affect hunger, cravings, energy, and mood.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "R.E.C.L.A.I.M. Coaching",
      item: absoluteUrl("/reclaim"),
    },
  ],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ReclaimClient />
    </>
  );
}
