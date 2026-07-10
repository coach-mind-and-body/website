import PrivacyClient from "./PrivacyClient";

export const metadata = {
  title: "Privacy Policy",
  description:
    "Read the Mind & Body Reset privacy policy — how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function Page() {
  return <PrivacyClient />;
}
