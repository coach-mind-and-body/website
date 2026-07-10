import HomeClient from './HomeClient';

export const metadata = {
  // absolute avoids root layout template ("%s | Mind and Body Reset") doubling the brand
  title: {
    absolute: "Health Coach for Women Over 40 | Mind and Body Reset",
  },
  description:
    "Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, quiet food noise, and build lasting habits — without another diet. Book a free discovery call.",
  openGraph: {
    title: "Health Coach for Women Over 40 | Mind and Body Reset",
    description:
      "Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, quiet food noise, and build lasting habits — without another diet. Book a free discovery call.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Health Coach for Women Over 40 | Mind and Body Reset",
    description:
      "Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, quiet food noise, and build lasting habits — without another diet. Book a free discovery call.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return <HomeClient />;
}
