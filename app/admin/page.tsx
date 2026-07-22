import AdminClient from './AdminClient';
import { Suspense } from 'react';
import { InboxProvider } from '@/components/admin/messaging/InboxContext';
import InboxModals from '@/components/admin/messaging/InboxModals';
import SlideOutChat from '@/components/admin/SlideOutChat';

export const metadata = {
  title: "Admin Dashboard | Mind and Body Reset",
  description: "Mind & Body Reset Coaches administration dashboard for managing content, users, and site settings.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <InboxProvider>
        <AdminClient />
        <InboxModals />
        <SlideOutChat />
      </InboxProvider>
    </Suspense>
  );
}
