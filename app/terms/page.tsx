import TermsClient from "./TermsClient";

export const metadata = {
  title: "Terms of Service",
  description:
    "Review the Mind & Body Reset Coaches terms of service governing use of our website, coaching programs, and digital resources.",
  alternates: { canonical: "/terms" },
  // Legal utility page — linked in footer; no need to compete for crawl budget
  robots: { index: false, follow: true },
};

export default function Page() {
  return <TermsClient />;
}
