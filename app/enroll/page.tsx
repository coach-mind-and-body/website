import { Suspense } from 'react';
import EnrollClient from './EnrollClient';

export const metadata = {
  title: "Enroll in R.E.C.L.A.I.M. Coaching",
  description:
    "Enroll in the R.E.C.L.A.I.M. coaching program — 6 private sessions with Lee Anne to reset your health, mindset, and relationship with food. Secure your spot today.",
  alternates: { canonical: "/enroll" },
  openGraph: {
    title: "Enroll in R.E.C.L.A.I.M. Coaching",
    description:
      "6 private sessions for women 40+ — reclaim your body, rewire your mind, reset your life.",
    url: "/enroll",
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Enroll in R.E.C.L.A.I.M. Coaching",
    description:
      "6 private sessions for women 40+ with coach Lee Anne Chapman.",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12">Loading...</div>}>
      <EnrollClient  />
    </Suspense>
  );
}
