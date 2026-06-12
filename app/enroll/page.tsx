import { Suspense } from 'react';
import EnrollClient from './EnrollClient';

export const metadata = {
  title: "Enroll in R.E.C.L.A.I.M. | Mind and Body Reset",
  description: "Enroll in the R.E.C.L.A.I.M. coaching program — 6 private sessions with Lee Anne to reset your health, mindset, and relationship with food."
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12">Loading...</div>}>
      <EnrollClient  />
    </Suspense>
  );
}
