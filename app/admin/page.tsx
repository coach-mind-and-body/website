import AdminClient from './AdminClient';
import { Suspense } from 'react';

export const metadata = {
  title: "Admin Dashboard | Mind and Body Reset",
  description: "Mind & Body Reset administration dashboard for managing content, users, and site settings."
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <AdminClient />
    </Suspense>
  );
}
