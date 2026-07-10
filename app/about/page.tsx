import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import { absoluteUrl, SITE_URL } from "@shared/brand";

export const metadata: Metadata = {
  title: { absolute: "About Lee Anne Chapman | Midlife Health Coach" },
  description:
    "Meet certified life & health coach Lee Anne Chapman on the Wasatch Front, UT — helping women 40+ with hormones, midlife health, insulin resistance, and food freedom.",
  openGraph: {
    title: "About Lee Anne Chapman | Midlife Health Coach",
    description:
      "Meet certified life & health coach Lee Anne Chapman — women 40+, hormones, midlife health, and food freedom.",
    url: "/about",
    type: "profile",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Lee Anne Chapman | Midlife Health Coach",
    description:
      "Certified life and health coach for women 40+ — hormones, food freedom, lasting habits.",
  },
  alternates: { canonical: "/about" },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Lee Anne Chapman",
  jobTitle: "Certified Life Coach and Certified Health Coach",
  description:
    "Lee Anne Chapman helps women over 40 reclaim their health, balance hormones, reverse insulin resistance, and build a peaceful relationship with food — without shame or another diet.",
  url: absoluteUrl("/about"),
  image: absoluteUrl("/logo-new.jpg"),
  worksFor: {
    "@type": "Organization",
    name: "Mind and Body Reset",
    url: SITE_URL,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Wasatch Front",
    addressRegion: "UT",
    addressCountry: "US",
  },
  knowsAbout: [
    "Midlife health coaching",
    "Insulin resistance",
    "Perimenopause",
    "Hormone balance",
    "Food freedom",
    "Habit change",
  ],
  sameAs: ["https://www.instagram.com/mindandbodyresetcoach/"],
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <AboutClient />
    </>
  );
}
