import type { Metadata } from "next";
import SnackHackOfferClient from "./SnackHackOfferClient";

export const metadata: Metadata = {
  title: { absolute: "Your Guide Is On the Way | Mind & Body Reset" },
  robots: { index: false, follow: false },
  alternates: { canonical: "/snack-hack-offer" },
};

export default function SnackHackOfferPage() {
  return <SnackHackOfferClient />;
}
