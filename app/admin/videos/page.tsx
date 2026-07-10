import AdminVideosClient from './AdminVideosClient';

export const metadata = {
  title: "Workout Videos | Admin",
  robots: { index: false, follow: false },
};

export default function AdminVideosPage() {
  return <AdminVideosClient />;
}
