import TermsClient from "./TermsClient";

export const metadata = {
  title: "Terms of Service",
  description:
    "Review the Mind & Body Reset terms of service governing use of our website, coaching programs, and digital resources.",
  alternates: { canonical: "/terms" },
};

export default function Page() {
  return <TermsClient />;
}
