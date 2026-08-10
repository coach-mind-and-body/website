import HomeClient from './HomeClient';

export const metadata = {
  // absolute avoids root layout template ("%s | Mind and Body Reset") doubling the brand
  // Brand-adjacent GSC queries already rank top 5 with tiny impressions: mind body coach, mind reset
  title: {
    absolute: "Mind Body Coach for Women Over 40 | Mind and Body Reset",
  },
  description:
    "Mind and body coach Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, calm food noise, and build lasting habits — without another diet. Free quiz + discovery call.",
  keywords: [
    "mind body coach",
    "mind and body coach",
    "health coach for women over 40",
    "midlife health coach",
    "body mind reset",
    "mind reset",
    "Lee Anne Chapman",
  ],
  openGraph: {
    title: "Mind Body Coach for Women Over 40 | Mind and Body Reset",
    description:
      "Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, quiet food noise, and build lasting habits — without another diet.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mind Body Coach for Women Over 40 | Mind and Body Reset",
    description:
      "Lee Anne Chapman helps women 40+ balance hormones, reverse insulin resistance, quiet food noise, and build lasting habits — without another diet.",
  },
  alternates: {
    canonical: "/",
  },
};

export default function Page() {
  return <HomeClient />;
}
