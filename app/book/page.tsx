import type { Metadata } from "next";
import BookClient from "./BookClient";

export const metadata: Metadata = {
  title: "Book a Free Discovery Call | Midlife Health Coach",
  description:
    "Schedule a free 30-minute discovery call with Lee Anne Chapman to explore coaching for midlife health, food freedom, hormones, and lasting habits — women 40+ welcome.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a Free Discovery Call | Midlife Health Coach",
    description:
      "Free 30-minute call to explore R.E.C.L.A.I.M. coaching and whether it's the right fit for you.",
    url: "/book",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Free Discovery Call | Midlife Health Coach",
    description:
      "Talk with Lee Anne about midlife health, food freedom, and next steps — free 30 minutes.",
  },
};

export default function Page() {
  return <BookClient />;
}
