import type { Metadata } from "next";
import BookClient from "./BookClient";
import { BOOK_PAGE_SEO } from "@/lib/thinPageCopy";

export const metadata: Metadata = {
  title: BOOK_PAGE_SEO.title,
  description: BOOK_PAGE_SEO.description,
  alternates: { canonical: "/book" },
  openGraph: {
    title: BOOK_PAGE_SEO.title,
    description: BOOK_PAGE_SEO.description,
    url: "/book",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BOOK_PAGE_SEO.title,
    description: BOOK_PAGE_SEO.description,
  },
};

export default function Page() {
  return <BookClient />;
}
