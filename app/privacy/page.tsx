import PrivacyClient from "./PrivacyClient";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read the Mind & Body Reset Coaches privacy policy — how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
  // Legal utility page — linked in footer; no need to compete for crawl budget
  robots: { index: false, follow: true },
};

export default function Page() {
  return <PrivacyClient />;
}
