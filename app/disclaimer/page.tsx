import DisclaimerClient from "./DisclaimerClient";

export const metadata = {
  title: "Disclaimer",
  description:
    "Important disclaimers about Mind & Body Reset Coaches coaching services — Lee Anne is a certified coach, not a medical professional.",
  alternates: { canonical: "/disclaimer" },
  // Legal utility page — linked in footer; no need to compete for crawl budget
  robots: { index: false, follow: true },
};

export default function Page() {
  return <DisclaimerClient />;
}
