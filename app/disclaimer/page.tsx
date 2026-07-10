import DisclaimerClient from "./DisclaimerClient";

export const metadata = {
  title: "Disclaimer",
  description:
    "Important disclaimers about Mind & Body Reset coaching services — Lee Anne is a certified coach, not a medical professional.",
  alternates: { canonical: "/disclaimer" },
};

export default function Page() {
  return <DisclaimerClient />;
}
