import { Suspense } from 'react';
import ResetPasswordClient from './ResetPasswordClient';

export const metadata = {
  title: "Reset Password | Mind and Body Reset",
  description: "Reset your Mind & Body Reset account password securely."
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12">Loading...</div>}>
      <ResetPasswordClient  />
    </Suspense>
  );
}
