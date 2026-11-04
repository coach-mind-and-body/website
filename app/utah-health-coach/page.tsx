import type { Metadata } from "next";
import UtahHealthCoachClient from "./UtahHealthCoachClient";
import { absoluteUrl, BRAND, SITE_URL } from "@shared/brand";
import { UTAH_AREA_SERVED, UTAH_PAGE } from "@/lib/utahHealthCoach";

export const metadata: Metadata = {
  title: UTAH_PAGE.title,
  description: UTAH_PAGE.description,
  alternates: { canonical: UTAH_PAGE.path },
  openGraph: {
    title: UTAH_PAGE.title,
    description: UTAH_PAGE.description,
    url: UTAH_PAGE.path,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: UTAH_PAGE.title,
    description: UTAH_PAGE.description,
  },
};

const pageUrl = absoluteUrl(UTAH_PAGE.path);

const serviceJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: BRAND.name,
  url: pageUrl,
  telephone: BRAND.telephone,
  image: absoluteUrl("/logo-new.jpg"),
  description: UTAH_PAGE.description,
  address: {
    "@type": "PostalAddress",
    addressLocality: BRAND.addressLocality,
    addressRegion: BRAND.addressRegion,
    addressCountry: BRAND.addressCountry,
  },
  areaServed: UTAH_AREA_SERVED.map((name) => ({
    "@type": "Place",
    name,
  })),
  provider: {
    "@type": "Person",
    name: BRAND.coachFullName,
    url: absoluteUrl("/about"),
  },
  parentOrganization: {
    "@id": `${SITE_URL}/#business`,
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <UtahHealthCoachClient />
    </>
  );
}
